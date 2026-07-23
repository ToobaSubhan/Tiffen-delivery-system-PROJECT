const router = require("express").Router();
const sql = require("mssql");
const { getConnection } = require("../config/database");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

// Admin route - get all deliveries (admin only)
router.get("/", verifyAdmin, async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT d.delivery_id,
             d.order_id,
             d.status,
             o.delivery_date,
             d.delivery_time,
             c.first_name + ' ' + c.last_name AS customer_name,
             c.phone AS customer_phone,
             c.address,
             r.first_name + ' ' + r.last_name AS rider_name,
             r.phone AS rider_phone,
             r.vehicle_number AS rider_vehicle_number,
             r.status AS rider_status
      FROM Deliveries d
      LEFT JOIN Orders o ON d.order_id = o.order_id
      LEFT JOIN Subscriptions s ON o.subscription_id = s.subscription_id
      LEFT JOIN Customers c ON s.customer_id = c.customer_id
      LEFT JOIN Riders r ON d.rider_id = r.rider_id
      ORDER BY o.delivery_date DESC, d.delivery_time DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error('GET ADMIN DELIVERIES ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

// Assign rider to a delivery (admin only)
router.put('/assign-rider', verifyAdmin, async (req, res) => {
  try {
    const { delivery_id, rider_id } = req.body;
    if (!delivery_id || !rider_id) return res.status(400).json({ message: 'delivery_id and rider_id are required' });

    const pool = await getConnection();
    await pool.request()
      .input('deliveryId', sql.Int, delivery_id)
      .input('riderId', sql.Int, rider_id)
      .query('UPDATE Deliveries SET rider_id = @riderId WHERE delivery_id = @deliveryId');

    res.json({ success: true, message: 'Rider assigned to delivery' });
  } catch (err) {
    console.error('ASSIGN RIDER ERROR:', err);
    res.status(500).json({ message: 'Failed to assign rider', error: err.message });
  }
});

// Update delivery status (admin only)
router.put('/update-status', verifyAdmin, async (req, res) => {
  try {
    const { delivery_id, status } = req.body;
    if (!delivery_id || !status) return res.status(400).json({ message: 'delivery_id and status are required' });

    const valid = ['assigned', 'picked_up', 'on_way', 'delivered', 'cancelled', 'in transit'];
    if (!valid.includes(status)) return res.status(400).json({ message: `Invalid status. Allowed: ${valid.join(', ')}` });

    const normalizedStatus = status === 'in transit' ? 'on_way' : status;

    const pool = await getConnection();
    await pool.request()
      .input('deliveryId', sql.Int, delivery_id)
      .input('status', sql.VarChar(50), normalizedStatus)
      .query('UPDATE Deliveries SET status = @status WHERE delivery_id = @deliveryId');

    res.json({ success: true, message: 'Delivery status updated' });
  } catch (err) {
    console.error('UPDATE DELIVERY STATUS ERROR:', err);
    res.status(500).json({ message: 'Failed to update delivery status', error: err.message });
  }
});

// User route - get user's deliveries
router.get("/user", verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.customer_id || req.user?.user_id;
    const pool = await getConnection();

    const result = await pool.request()
      .input("userId", sql.Int, userId)
      .query(`
        SELECT
          d.delivery_id,
          d.order_id,
          d.status,
          d.delivery_time,
          o.order_date,
          o.total_amount,
          o.delivery_date,
          m.plan_name,
          r.first_name + ' ' + r.last_name AS rider_name
        FROM Deliveries d
        JOIN Orders o ON d.order_id = o.order_id
        JOIN Subscriptions s ON o.subscription_id = s.subscription_id
        JOIN Meal_Plans m ON s.plan_id = m.plan_id
        LEFT JOIN Riders r ON d.rider_id = r.rider_id
        WHERE o.customer_id = @userId
        ORDER BY o.order_date DESC
      `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("Error fetching user deliveries:", err);
    res.status(500).json({ message: 'Failed to fetch deliveries', error: err.message });
  }
});

// Get delivery by id (admin only)
router.get('/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT d.*, o.delivery_date, o.order_id, r.rider_id,
               r.first_name + ' ' + r.last_name AS rider_name,
               c.customer_id, c.first_name + ' ' + c.last_name AS customer_name,
               c.email, c.phone, c.address
        FROM Deliveries d
        LEFT JOIN Orders o ON d.order_id = o.order_id
        LEFT JOIN Subscriptions s ON o.subscription_id = s.subscription_id
        LEFT JOIN Customers c ON s.customer_id = c.customer_id
        LEFT JOIN Riders r ON d.rider_id = r.rider_id
        WHERE d.delivery_id = @id
      `);

    if (result.recordset.length === 0) return res.status(404).json({ message: 'Delivery not found' });
    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    console.error('GET DELIVERY BY ID ERROR:', err);
    res.status(500).json({ message: 'Failed to fetch delivery', error: err.message });
  }
});

module.exports = router;
