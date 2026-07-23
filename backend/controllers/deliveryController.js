// controllers/deliveryController.js
const sql = require('mssql');
const { getConnection } = require('../config/database');

// Get user deliveries
exports.getUserDeliveries = async (req, res) => {
  try {
    const userId = req.user.id;

    const pool = await getConnection();
    const result = await pool.request()
      .input('customerId', sql.Int, userId)
      .query(`
        SELECT 
          d.delivery_id,
          d.order_id,
          d.delivery_time,
          d.status,
          d.customer_rating,
          d.feedback,
          o.delivery_date,
          m.plan_name as plan_name
        FROM Deliveries d
        JOIN Orders o ON d.order_id = o.order_id
        JOIN Subscriptions s ON o.subscription_id = s.subscription_id
        JOIN Meal_Plans m ON s.plan_id = m.plan_id
        WHERE s.customer_id = @customerId
        ORDER BY o.delivery_date DESC
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Get deliveries error:', error);
    res.status(500).json({ message: 'Failed to fetch deliveries', error: error.message });
  }
};

// Get all deliveries (admin only)
exports.getAllDeliveries = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT 
          d.delivery_id,
          d.order_id,
          d.delivery_time,
          d.status,
          d.customer_rating,
          d.feedback,
          c.first_name + ' ' + c.last_name as user_name,
          c.email,
          c.phone,
          m.plan_name as plan_name
        FROM Deliveries d
        JOIN Orders o ON d.order_id = o.order_id
        JOIN Subscriptions s ON o.subscription_id = s.subscription_id
        JOIN Customers c ON s.customer_id = c.customer_id
        JOIN Meal_Plans m ON s.plan_id = m.plan_id
        ORDER BY o.delivery_date DESC
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Get all deliveries error:', error);
    res.status(500).json({ message: 'Failed to fetch deliveries', error: error.message });
  }
};

// Update delivery status (admin only)
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const validStatuses = ['assigned', 'picked_up', 'on_way', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const pool = await getConnection();
    await pool.request()
      .input('deliveryId', sql.Int, deliveryId)
      .input('status', sql.VarChar, status)
      .query('UPDATE Deliveries SET status = @status WHERE delivery_id = @deliveryId');

    res.json({ message: 'Delivery status updated successfully' });
  } catch (error) {
    console.error('Update delivery error:', error);
    res.status(500).json({ message: 'Failed to update delivery', error: error.message });
  }
};
