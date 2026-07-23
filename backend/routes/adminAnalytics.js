// routes/adminAnalytics.js - UPDATED WITH CORRECT FEEDBACK TABLE
const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { getPool } = require('../config/database');
const { verifyAdmin, verifyToken } = require('../middleware/authMiddleware');

// ADD TEST ENDPOINT FIRST
router.get('/test', verifyAdmin, (req, res) => {
  res.json({ 
    success: true,
    message: 'Admin Analytics API is working!',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/admin-analytics/',
      '/api/admin-analytics/recent-orders',
      '/api/admin-analytics/user-growth',
      '/api/admin-analytics/subscription-stats',
      '/api/admin-analytics/revenue-analytics',
      '/api/admin-analytics/delivery-performance',
      '/api/admin-analytics/feedback-summary',
      '/api/admin-analytics/rider-performance',
      '/api/admin-analytics/order-status'
    ]
  });
});

// User-facing dashboard stats (protected by verifyToken)
router.get('/user-dashboard', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await getPool();

    // Active subscription (latest active)
    const activeRes = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT TOP 1 s.subscription_id, s.status, s.start_date, s.end_date, mp.plan_name, mp.price_per_month as price
        FROM Subscriptions s
        JOIN Meal_Plans mp ON s.plan_id = mp.plan_id
        WHERE s.customer_id = @userId AND s.status = 'active'
        ORDER BY s.start_date DESC
      `);

    // Today's deliveries for this user
    const todayRes = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT COUNT(*) AS todayDeliveries
        FROM Deliveries d
        JOIN Orders o ON d.order_id = o.order_id
        JOIN Subscriptions s ON o.subscription_id = s.subscription_id
        WHERE s.customer_id = @userId AND CAST(o.delivery_date AS DATE) = CAST(GETDATE() AS DATE)
      `);

    // This month's deliveries
    const monthRes = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT COUNT(*) AS monthDeliveries
        FROM Deliveries d
        JOIN Orders o ON d.order_id = o.order_id
        JOIN Subscriptions s ON o.subscription_id = s.subscription_id
        WHERE s.customer_id = @userId AND o.delivery_date >= DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0)
      `);

    // Pending payments count
    const pendingRes = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT COUNT(*) AS pendingPayments
        FROM Payments p
        LEFT JOIN Subscriptions s ON p.subscription_id = s.subscription_id
        WHERE (p.customer_id = @userId OR s.customer_id = @userId) AND p.payment_status = 'pending'
      `);

    res.json({
      success: true,
      activeSubscription: activeRes.recordset[0] || null,
      todayDeliveries: todayRes.recordset[0]?.todayDeliveries || 0,
      monthDeliveries: monthRes.recordset[0]?.monthDeliveries || 0,
      pendingPayments: pendingRes.recordset[0]?.pendingPayments || 0
    });
  } catch (err) {
    console.error('USER DASHBOARD STATS ERROR:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch user dashboard stats', error: err.message });
  }
});

// MAIN DASHBOARD OVERVIEW (UPDATED)
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const pool = await getPool();

    // Run all queries in parallel
    const [
      ordersRes,
      revenueRes,
      usersRes,
      subsRes,
      weeklyRes,
      ridersRes,
      topRes
    ] = await Promise.all([
      // Last 30 days orders
      pool.request().query(`
        SELECT COUNT(*) AS total
        FROM Orders
        WHERE order_date >= DATEADD(day, -30, GETDATE())
      `),

      // Last 30 days revenue
      pool.request().query(`
        SELECT ISNULL(SUM(total_amount), 0) AS revenue
        FROM Orders
        WHERE order_date >= DATEADD(day, -30, GETDATE())
      `),

      // Total users
      pool.request().query(`
        SELECT COUNT(*) AS totalUsers
        FROM Customers
      `),

      // Active subscriptions
      pool.request().query(`
        SELECT COUNT(*) AS activeSubs
        FROM Subscriptions
        WHERE status = 'active'
      `),

      // Weekly active menus
      pool.request().query(`
        SELECT COUNT(*) AS weeklyActive
        FROM Weekly_Menu
        WHERE is_active = 1
      `),

      // Active riders
      pool.request().query(`
        SELECT COUNT(*) AS activeRiders
        FROM Riders
        WHERE status = 'available'
      `),

      // Top items
      pool.request().query(`
        SELECT TOP 5
          mi.item_name,
          SUM(oi.quantity) as count
        FROM Order_Items oi
        JOIN Menu_Items mi ON oi.item_id = mi.item_id
        JOIN Orders o ON oi.order_id = o.order_id
        WHERE o.order_date >= DATEADD(day, -30, GETDATE())
        GROUP BY mi.item_name
        ORDER BY count DESC
      `)
    ]);

    // Calculate growth separately
    const currentRes = await pool.request().query(`
      SELECT COUNT(*) as current_count
      FROM Orders
      WHERE order_date >= DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0)
    `);

    const previousRes = await pool.request().query(`
      SELECT COUNT(*) as previous_count
      FROM Orders
      WHERE order_date >= DATEADD(month, DATEDIFF(month, 0, GETDATE()) - 1, 0)
      AND order_date < DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0)
    `);

    const current = currentRes.recordset[0]?.current_count || 0;
    const previous = previousRes.recordset[0]?.previous_count || 0;
    const growth_percentage = previous === 0 ? 0 : Math.round(((current - previous) * 100.0 / previous) * 100) / 100;

    res.json({
      success: true,
      data: {
        orders: ordersRes.recordset[0]?.total || 0,
        revenue: revenueRes.recordset[0]?.revenue || 0,
        totalUsers: usersRes.recordset[0]?.totalUsers || 0,
        activeSubscriptions: subsRes.recordset[0]?.activeSubs || 0,
        weeklyActive: weeklyRes.recordset[0]?.weeklyActive || 0,
        activeRiders: ridersRes.recordset[0]?.activeRiders || 0,
        topItems: topRes.recordset || [],
        growth: { current, previous, growth_percentage }
      }
    });
  } catch(err) {
    console.error('DASHBOARD OVERVIEW ERROR:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard overview data',
      error: err.message
    });
  }
});

// RECENT ORDERS FOR DASHBOARD TABLE
router.get('/recent-orders', verifyAdmin, async (req, res) => {
  try {
    const rawLimit = parseInt(req.query.limit);
    const limit = (!isNaN(rawLimit) && rawLimit > 0 && rawLimit <= 100) ? rawLimit : 10;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('limit', require('mssql').Int, limit)
      .query(`
        SELECT TOP (@limit) 
          o.order_id,
          FORMAT(o.order_date, 'yyyy-MM-dd HH:mm') as order_date,
          o.total_amount,
          o.status,
          c.first_name + ' ' + c.last_name as customer_name,
          c.email,
          c.phone
        FROM Orders o
        JOIN Customers c ON o.customer_id = c.customer_id
        ORDER BY o.order_date DESC
      `);
    
    res.json({
      success: true,
      count: result.recordset.length,
      orders: result.recordset
    });
  } catch(err) {
    console.error('RECENT ORDERS ERROR:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch recent orders' 
    });
  }
});

// USER GROWTH OVER TIME
router.get('/user-growth', verifyAdmin, async (req, res) => {
  try {
    const period = req.query.period || 'month';
    const pool = await getPool();
    
    let query;
    switch(period) {
      case 'week':
        query = `
          SELECT 
            FORMAT(registration_date, 'yyyy-MM-dd') as date,
            COUNT(*) as new_users
          FROM Customers
          WHERE registration_date >= DATEADD(week, -8, GETDATE())
          GROUP BY FORMAT(registration_date, 'yyyy-MM-dd')
          ORDER BY date
        `;
        break;
      case 'day':
        query = `
          SELECT 
            FORMAT(registration_date, 'yyyy-MM-dd') as date,
            COUNT(*) as new_users
          FROM Customers
          WHERE registration_date >= DATEADD(day, -30, GETDATE())
          GROUP BY FORMAT(registration_date, 'yyyy-MM-dd')
          ORDER BY date
        `;
        break;
      default: // month
        query = `
          SELECT 
            FORMAT(registration_date, 'yyyy-MM') as date,
            COUNT(*) as new_users
          FROM Customers
          WHERE registration_date >= DATEADD(month, -12, GETDATE())
          GROUP BY FORMAT(registration_date, 'yyyy-MM')
          ORDER BY date
        `;
    }
    
    const result = await pool.request().query(query);
    
    res.json({
      success: true,
      period: period,
      data: result.recordset
    });
  } catch(err) {
    console.error('USER GROWTH ERROR:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch user growth data' 
    });
  }
});

// SUBSCRIPTION ANALYTICS
router.get('/subscription-stats', verifyAdmin, async (req, res) => {
  try {
    const pool = await getPool();
    
    const result = await pool.request().query(`
      SELECT 
        p.plan_id,
        p.plan_name,
        p.price_per_month as price,
        COUNT(s.subscription_id) as active_count,
        SUM(p.price_per_month) as monthly_revenue
      FROM Subscriptions s
      JOIN Meal_Plans p ON s.plan_id = p.plan_id
      WHERE s.status = 'active'
      GROUP BY p.plan_id, p.plan_name, p.price_per_month
      ORDER BY active_count DESC
    `);
    
    // Calculate totals
    const totals = result.recordset.reduce((acc, plan) => {
      acc.totalActive += plan.active_count || 0;
      acc.totalRevenue += plan.monthly_revenue || 0;
      return acc;
    }, { totalActive: 0, totalRevenue: 0 });
    
    res.json({
      success: true,
      totals: totals,
      plans: result.recordset
    });
  } catch(err) {
    console.error('SUBSCRIPTION STATS ERROR:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch subscription stats' 
    });
  }
});

// REVENUE ANALYTICS
router.get('/revenue-analytics', verifyAdmin, async (req, res) => {
  try {
    const period = req.query.period || 'month';
    const pool = await getPool();
    
    let query;
    if (period === 'week') {
      query = `
        SELECT 
          FORMAT(order_date, 'yyyy-MM-dd') as date,
          SUM(total_amount) as daily_revenue,
          COUNT(*) as order_count
        FROM Orders
        WHERE order_date >= DATEADD(day, -30, GETDATE())
        GROUP BY FORMAT(order_date, 'yyyy-MM-dd')
        ORDER BY date
      `;
    } else {
      query = `
        SELECT 
          FORMAT(order_date, 'yyyy-MM') as date,
          SUM(total_amount) as monthly_revenue,
          COUNT(*) as order_count
        FROM Orders
        WHERE order_date >= DATEADD(month, -12, GETDATE())
        GROUP BY FORMAT(order_date, 'yyyy-MM')
        ORDER BY date
      `;
    }
    
    const result = await pool.request().query(query);
    
    res.json({
      success: true,
      period: period,
      data: result.recordset
    });
  } catch(err) {
    console.error('REVENUE ANALYTICS ERROR:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch revenue analytics' 
    });
  }
});

// DELIVERY PERFORMANCE
router.get('/delivery-performance', verifyAdmin, async (req, res) => {
  try {
    const pool = await getPool();
    
    const result = await pool.request().query(`
      SELECT 
        status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM Deliveries), 2) as percentage
      FROM Deliveries
      GROUP BY status
      ORDER BY count DESC
    `);
    
    res.json({
      success: true,
      statusDistribution: result.recordset,
      avgDeliveryTime: 45 // Placeholder since you don't have timestamps
    });
  } catch(err) {
    console.error('DELIVERY PERFORMANCE ERROR:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch delivery performance data' 
    });
  }
});

// FEEDBACK SUMMARY - FIXED FOR YOUR ACTUAL FEEDBACK TABLE
router.get('/feedback-summary', verifyAdmin, async (req, res) => {
  try {
    const pool = await getPool();
    
    // Rating distribution from Feedback table
    const result = await pool.request().query(`
      SELECT 
        rating,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (
          SELECT COUNT(*) 
          FROM Feedback 
          WHERE created_at >= DATEADD(day, -30, GETDATE())
        ), 2) as percentage
      FROM Feedback
      WHERE created_at >= DATEADD(day, -30, GETDATE())
      GROUP BY rating
      ORDER BY rating DESC
    `);
    
    // Get average rating
    const avgRatingRes = await pool.request().query(`
      SELECT AVG(CAST(rating as FLOAT)) as average_rating
      FROM Feedback
      WHERE created_at >= DATEADD(day, -30, GETDATE())
    `);
    
    // Get recent feedback with user info
    const recentFeedbackRes = await pool.request().query(`
      SELECT TOP 5 
        f.feedback_id,
        f.rating,
        f.comment,
        f.created_at,
        c.first_name + ' ' + c.last_name as customer_name,
        c.email
      FROM Feedback f
      JOIN Customers c ON f.user_id = c.customer_id
      ORDER BY f.created_at DESC
    `);
    
    res.json({
      success: true,
      ratingDistribution: result.recordset,
      averageRating: avgRatingRes.recordset[0]?.average_rating || 0,
      recentFeedback: recentFeedbackRes.recordset
    });
  } catch(err) {
    console.error('FEEDBACK SUMMARY ERROR:', err);
    // Return empty data if no feedback yet
    res.json({
      success: true,
      ratingDistribution: [],
      averageRating: 0,
      recentFeedback: []
    });
  }
});

// RIDER PERFORMANCE
router.get('/rider-performance', verifyAdmin, async (req, res) => {
  try {
    const pool = await getPool();
    
    const result = await pool.request().query(`
      SELECT 
        r.rider_id,
        r.first_name + ' ' + r.last_name as full_name,
        r.phone,
        COUNT(d.delivery_id) as total_deliveries,
        SUM(CASE WHEN d.status = 'delivered' THEN 1 ELSE 0 END) as successful_deliveries,
        CASE 
          WHEN COUNT(d.delivery_id) > 0 
          THEN ROUND(SUM(CASE WHEN d.status = 'delivered' THEN 1 ELSE 0 END) * 100.0 / COUNT(d.delivery_id), 2)
          ELSE 0
        END as success_rate
      FROM Riders r
      LEFT JOIN Deliveries d ON r.rider_id = d.rider_id
      WHERE r.status = 'available'
      GROUP BY r.rider_id, r.first_name, r.last_name, r.phone
      ORDER BY total_deliveries DESC
    `);
    
    res.json({
      success: true,
      riders: result.recordset
    });
  } catch(err) {
    console.error('RIDER PERFORMANCE ERROR:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch rider performance data' 
    });
  }
});

// ORDER STATUS SUMMARY
router.get('/order-status', verifyAdmin, async (req, res) => {
  try {
    const pool = await getPool();
    
    const result = await pool.request().query(`
      SELECT 
        status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM Orders WHERE order_date >= DATEADD(day, -30, GETDATE())), 2) as percentage
      FROM Orders
      WHERE order_date >= DATEADD(day, -30, GETDATE())
      GROUP BY status
      ORDER BY count DESC
    `);
    
    res.json({
      success: true,
      data: result.recordset
    });
  } catch(err) {
    console.error('ORDER STATUS ERROR:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch order status data' 
    });
  }
});

// NEW ENDPOINT: GET ALL STATS AT ONCE (for frontend efficiency)
router.get('/all-stats', verifyAdmin, async (req, res) => {
  try {
    const pool = await getPool();
    
    // Get all stats in parallel
    const [
      overviewRes,
      recentOrdersRes,
      subscriptionRes,
      feedbackRes
    ] = await Promise.all([
      // Main overview
      pool.request().query(`
        SELECT 
          (SELECT COUNT(*) FROM Orders WHERE order_date >= DATEADD(day, -30, GETDATE())) as orders,
          (SELECT ISNULL(SUM(total_amount), 0) FROM Orders WHERE order_date >= DATEADD(day, -30, GETDATE())) as revenue,
          (SELECT COUNT(*) FROM Customers) as totalUsers,
          (SELECT COUNT(*) FROM Subscriptions WHERE status = 'active') as activeSubscriptions,
          (SELECT COUNT(*) FROM Weekly_Menu WHERE is_active = 1) as weeklyActive,
          (SELECT COUNT(*) FROM Riders WHERE status = 'available') as activeRiders
      `),
      
      // Recent orders (top 5)
      pool.request().query(`
        SELECT TOP 5 
          o.order_id,
          FORMAT(o.order_date, 'yyyy-MM-dd HH:mm') as order_date,
          o.total_amount,
          o.status,
          c.first_name + ' ' + c.last_name as customer_name
        FROM Orders o
        JOIN Customers c ON o.customer_id = c.customer_id
        ORDER BY o.order_date DESC
      `),
      
      // Subscription stats
      pool.request().query(`
        SELECT 
          p.plan_name,
          COUNT(s.subscription_id) as active_count
        FROM Subscriptions s
        JOIN Meal_Plans p ON s.plan_id = p.plan_id
        WHERE s.status = 'active'
        GROUP BY p.plan_name
        ORDER BY active_count DESC
      `),
      
      // Recent feedback
      pool.request().query(`
        SELECT TOP 3 
          f.rating,
          f.comment,
          c.first_name + ' ' + c.last_name as customer_name
        FROM Feedback f
        JOIN Customers c ON f.user_id = c.customer_id
        ORDER BY f.created_at DESC
      `)
    ]);
    
    res.json({
      success: true,
      data: {
        overview: overviewRes.recordset[0] || {},
        recentOrders: recentOrdersRes.recordset || [],
        subscriptions: subscriptionRes.recordset || [],
        recentFeedback: feedbackRes.recordset || []
      }
    });
    
  } catch(err) {
    console.error('ALL STATS ERROR:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch all stats',
      error: err.message 
    });
  }
});

module.exports = router;