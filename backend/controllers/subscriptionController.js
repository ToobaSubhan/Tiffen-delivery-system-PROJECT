// controllers/subscriptionController.js
const sql = require('mssql');
const { getConnection } = require('../config/database');

// Create subscription
exports.createSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan_id, start_date } = req.body;

    if (!plan_id || !start_date) {
      return res.status(400).json({ message: 'Plan ID and start date are required' });
    }

    const pool = await getConnection();

    // Verify plan exists
    const planCheck = await pool.request()
      .input('planId', sql.Int, plan_id)
      .query('SELECT * FROM Meal_Plans WHERE plan_id = @planId');

    if (planCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const plan = planCheck.recordset[0];

    // Calculate end date (1 month from start date)
    const endDate = new Date(start_date);
    endDate.setMonth(endDate.getMonth() + 1);

    // Create subscription
    const result = await pool.request()
      .input('customerId', sql.Int, userId)
      .input('planId', sql.Int, plan_id)
      .input('startDate', sql.Date, start_date)
      .input('endDate', sql.Date, endDate.toISOString().split('T')[0])
      .input('status', sql.VarChar, 'active')
      .query(`
        INSERT INTO Subscriptions (customer_id, plan_id, start_date, end_date, status)
        VALUES (@customerId, @planId, @startDate, @endDate, @status);
        SELECT @@IDENTITY as subscription_id;
      `);

    res.status(201).json({
      message: 'Subscription created successfully',
      subscription_id: result.recordset[0].subscription_id,
      plan_name: plan.plan_name,
      start_date: start_date,
      end_date: endDate.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ message: 'Failed to create subscription', error: error.message });
  }
};

// Get user subscriptions
exports.getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;

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
    const userId = req.user.id;
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
