// controllers/subscriptionController.js
const sql = require('mssql');
const { getConnection } = require('../config/database');

// Create subscription
exports.createSubscription = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.customer_id || req.user?.user_id;
    const { plan_id, start_date } = req.body;

    if (!plan_id || !start_date) {
      return res.status(400).json({ message: 'Plan ID and start date are required' });
    }

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Verify plan exists
      const planCheck = await transaction.request()
        .input('planId', sql.Int, plan_id)
        .query('SELECT plan_id, plan_name, price_per_month FROM Meal_Plans WHERE plan_id = @planId');

      if (planCheck.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Plan not found' });
      }

      const plan = planCheck.recordset[0];

      // Calculate end date (1 month from start date)
      const startDate = new Date(start_date);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      const startDateOnly = startDate.toISOString().split('T')[0];
      const endDateOnly = endDate.toISOString().split('T')[0];

      // Create subscription
      const subscriptionResult = await transaction.request()
        .input('customerId', sql.Int, userId)
        .input('planId', sql.Int, plan_id)
        .input('startDate', sql.Date, startDateOnly)
        .input('endDate', sql.Date, endDateOnly)
        .input('status', sql.VarChar(20), 'active')
        .query(`
          INSERT INTO Subscriptions (customer_id, plan_id, start_date, end_date, status)
          VALUES (@customerId, @planId, @startDate, @endDate, @status);
          SELECT CAST(SCOPE_IDENTITY() AS INT) AS subscription_id;
        `);

      const subscriptionId = subscriptionResult.recordset[0].subscription_id;
      const amount = Number(plan.price_per_month || 0);

      // Create order record first because Payments requires an order_id
      let orderId;
      try {
        const orderResult = await transaction.request()
          .input('customerId', sql.Int, userId)
          .input('subscriptionId', sql.Int, subscriptionId)
          .input('deliveryDate', sql.Date, startDateOnly)
          .input('mealType', sql.VarChar(20), 'lunch')
          .input('amount', sql.Decimal(10, 2), amount)
          .input('status', sql.VarChar(30), 'pending')
          .query(`
            INSERT INTO Orders (customer_id, subscription_id, order_date, delivery_date, meal_type, total_amount, status)
            VALUES (@customerId, @subscriptionId, GETDATE(), @deliveryDate, @mealType, @amount, @status);
            SELECT CAST(SCOPE_IDENTITY() AS INT) AS order_id;
          `);

        orderId = orderResult.recordset[0].order_id;
        console.log('Order created successfully:', orderId);
      } catch (orderError) {
        console.error('Failed to create order:', orderError);
        throw orderError;
      }

      // Create payment record after the order exists
      try {
        await transaction.request()
          .input('customerId', sql.Int, userId)
          .input('subscriptionId', sql.Int, subscriptionId)
          .input('orderId', sql.Int, orderId)
          .input('amount', sql.Decimal(10, 2), amount)
          .input('paymentMethod', sql.VarChar(20), 'cash')
          .input('paymentStatus', sql.VarChar(20), 'pending')
          .query(`
            INSERT INTO Payments (customer_id, subscription_id, order_id, amount, payment_method, payment_status, created_at)
            VALUES (@customerId, @subscriptionId, @orderId, @amount, @paymentMethod, @paymentStatus, GETDATE());
          `);
        console.log('Payment created successfully for order:', orderId);
      } catch (paymentError) {
        console.error('Failed to create payment:', paymentError);
        throw paymentError;
      }

      // Create delivery record
      try {
        await transaction.request()
          .input('orderId', sql.Int, orderId)
          .input('status', sql.VarChar(30), 'assigned')
          .query(`
            INSERT INTO Deliveries (order_id, status)
            VALUES (@orderId, @status);
          `);
        console.log('Delivery created successfully for order:', orderId);
      } catch (deliveryError) {
        console.error('Failed to create delivery:', deliveryError);
        throw deliveryError;
      }

      await transaction.commit();

      res.status(201).json({
        message: 'Subscription created successfully',
        subscription_id: subscriptionId,
        plan_name: plan.plan_name,
        start_date: startDateOnly,
        end_date: endDateOnly
      });
    } catch (txError) {
      await transaction.rollback();
      console.error('Create subscription transaction failed:', txError);
      res.status(500).json({ message: 'Failed to create subscription', error: txError.message });
    }
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ message: 'Failed to create subscription', error: error.message });
  }
};

// Get user subscriptions
exports.getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.customer_id || req.user?.user_id;

    const pool = await getConnection();
    const result = await pool.request()
      .input('customerId', sql.Int, userId)
      .query(`
        SELECT
          s.subscription_id,
          s.plan_id,
          s.start_date,
          s.end_date as renewal_date,
          s.status,
          m.plan_name as plan_name,
          m.price_per_month as price,
          m.description,
          m.meals_per_day,
          m.subscription_type
        FROM Subscriptions s
        JOIN Meal_Plans m ON s.plan_id = m.plan_id
        WHERE s.customer_id = @customerId
        ORDER BY s.start_date DESC
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ message: 'Failed to fetch subscriptions', error: error.message });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.customer_id || req.user?.user_id;
    const { subscriptionId } = req.params;

    const pool = await getConnection();

    // Verify ownership
    const checkSub = await pool.request()
      .input('subId', sql.Int, subscriptionId)
      .input('customerId', sql.Int, userId)
      .query('SELECT * FROM Subscriptions WHERE subscription_id = @subId AND customer_id = @customerId');

    if (checkSub.recordset.length === 0) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Update status
    await pool.request()
      .input('subId', sql.Int, subscriptionId)
      .query('UPDATE Subscriptions SET status = \'cancelled\' WHERE subscription_id = @subId');

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Failed to cancel subscription', error: error.message });
  }
};
