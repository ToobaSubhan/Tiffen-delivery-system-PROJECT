const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { getConnection } = require('../config/database');
const { verifyToken } = require('../middleware/authMiddleware');
  
// GET /api/dashboard/user/stats
router.get('/user/stats', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await getConnection();

    // Active subscription (latest active)
    const activeSubResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT TOP 1 s.*, m.plan_name, m.price_per_month
        FROM Subscriptions s
        LEFT JOIN Meal_Plans m ON s.plan_id = m.plan_id
        WHERE s.customer_id = @userId AND s.status = 'active'
        ORDER BY s.start_date DESC
      `);

    const activeSubscription = activeSubResult.recordset[0] || null;

    // Today's deliveries
    const todayDeliveriesResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT COUNT(*) AS count
        FROM Deliveries
        WHERE customer_id = @userId AND CAST(delivery_date AS DATE) = CAST(GETDATE() AS DATE)
      `);

    const todayDeliveries = todayDeliveriesResult.recordset[0].count || 0;

    // This month deliveries
    const monthDeliveriesResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT COUNT(*) AS count
        FROM Deliveries
        WHERE customer_id = @userId AND MONTH(delivery_date) = MONTH(GETDATE()) AND YEAR(delivery_date) = YEAR(GETDATE())
      `);

    const monthDeliveries = monthDeliveriesResult.recordset[0].count || 0;

    // Pending payments count
    const pendingPaymentsResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT COUNT(*) AS count
        FROM Payments p
        LEFT JOIN Subscriptions s ON p.subscription_id = s.subscription_id
        WHERE s.customer_id = @userId AND p.payment_status = 'pending'
      `);

    const pendingPayments = pendingPaymentsResult.recordset[0].count || 0;

    res.json({
      activeSubscription,
      todayDeliveries,
      monthDeliveries,
      pendingPayments
    });
  } catch (err) {
    console.error('Error fetching user dashboard stats:', err);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;
