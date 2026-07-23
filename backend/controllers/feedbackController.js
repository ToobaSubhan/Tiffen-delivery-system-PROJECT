// controllers/feedbackController.js
const sql = require('mssql');
const { getConnection } = require('../config/database');

// Submit feedback
exports.submitFeedback = async (req, res) => {
  try {
    const userId = req.user.id;
    const { delivery_id, rating, comment } = req.body;

    if (!delivery_id || !rating) {
      return res.status(400).json({ message: 'Delivery ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const pool = await getConnection();

    // Verify delivery belongs to user
    const deliveryCheck = await pool.request()
      .input('deliveryId', sql.Int, delivery_id)
      .input('customerId', sql.Int, userId)
      .query(`
        SELECT d.delivery_id 
        FROM Deliveries d
        JOIN Orders o ON d.order_id = o.order_id
        JOIN Subscriptions s ON o.subscription_id = s.subscription_id
        WHERE d.delivery_id = @deliveryId AND s.customer_id = @customerId
      `);

    if (deliveryCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    // Submit feedback by updating Deliveries table
    await pool.request()
      .input('deliveryId', sql.Int, delivery_id)
      .input('rating', sql.Int, rating)
      .input('feedback', sql.Text, comment || '')
      .query(`
        UPDATE Deliveries 
        SET customer_rating = @rating, feedback = @feedback 
        WHERE delivery_id = @deliveryId
      `);

    res.status(201).json({
      message: 'Feedback submitted successfully',
      delivery_id: delivery_id
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ message: 'Failed to submit feedback', error: error.message });
  }
};

// Get all feedback (admin only)
exports.getAllFeedback = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT 
          d.delivery_id,
          d.order_id,
          d.customer_rating as rating,
          d.feedback as comment,
          c.first_name + ' ' + c.last_name as user_name,
          c.email,
          m.plan_name,
          o.delivery_date as created_at
        FROM Deliveries d
        JOIN Orders o ON d.order_id = o.order_id
        JOIN Subscriptions s ON o.subscription_id = s.subscription_id
        JOIN Customers c ON s.customer_id = c.customer_id
        JOIN Meal_Plans m ON s.plan_id = m.plan_id
        WHERE d.customer_rating IS NOT NULL
        ORDER BY o.delivery_date DESC
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ message: 'Failed to fetch feedback', error: error.message });
  }
};

// Get feedback for a specific delivery
exports.getFeedbackByDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    const pool = await getConnection();
    const result = await pool.request()
      .input('deliveryId', sql.Int, deliveryId)
      .query(`
        SELECT 
          d.delivery_id,
          d.order_id,
          d.customer_rating as rating,
          d.feedback as comment,
          c.first_name + ' ' + c.last_name as user_name,
          o.delivery_date as created_at
        FROM Deliveries d
        JOIN Orders o ON d.order_id = o.order_id
        JOIN Subscriptions s ON o.subscription_id = s.subscription_id
        JOIN Customers c ON s.customer_id = c.customer_id
        WHERE d.delivery_id = @deliveryId
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ message: 'Failed to fetch feedback', error: error.message });
  }
};
