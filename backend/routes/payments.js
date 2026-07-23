const express = require("express");
const router = express.Router();
const sql = require("mssql");
const crypto = require("crypto");
const { getConnection } = require("../config/database");
const { verifyAdmin, verifyToken } = require("../middleware/authMiddleware");

// Create payment (logged-in user)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { subscription_id, amount, payment_method } = req.body;
    const allowedMethods = ["cash", "card", "upi", "net_banking"];

    if (!subscription_id || !amount || !payment_method) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (!allowedMethods.includes(payment_method)) {
      return res.status(400).json({ success: false, message: "Invalid payment method" });
    }

    const customerId = req.user?.id;
    if (!customerId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const transactionId = crypto.randomBytes(12).toString("hex");

    const pool = await getConnection();

    const insertResult = await pool.request()
      .input("customer_id", sql.Int, customerId)
      .input("subscription_id", sql.Int, subscription_id)
      .input("amount", sql.Decimal(10,2), amount)
      .input("payment_method", sql.VarChar(20), payment_method)
      .input("payment_status", sql.VarChar(20), "pending")
      .input("transaction_id", sql.VarChar(100), transactionId)
      .query(`
        INSERT INTO Payments (customer_id, subscription_id, amount, payment_method, payment_status, transaction_id, created_at)
        VALUES (@customer_id, @subscription_id, @amount, @payment_method, @payment_status, @transaction_id, GETDATE());
        SELECT @@IDENTITY AS payment_id;
      `);

    const paymentId = insertResult.recordset && insertResult.recordset[0] ? insertResult.recordset[0].payment_id : null;

    res.status(201).json({ success: true, message: "Payment created", transaction_id: transactionId, payment_id: paymentId });
  } catch (err) {
    console.error("CREATE PAYMENT ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to create payment", error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
});

// Get payments for current user
router.get("/user", verifyToken, async (req, res) => {
  try {
    const customerId = req.user?.id;
    console.log('GET /api/payments/user requested by userId=', customerId);
    const pool = await getConnection();

    const result = await pool.request()
      .input("customerId", sql.Int, customerId)
      .query(`
        SELECT
          p.payment_id,
          p.customer_id AS customer_id,
          p.subscription_id,
          p.amount,
          ISNULL(p.paid_at, p.created_at) AS paid_at,
          p.created_at AS created_at,
          p.payment_method,
          p.payment_status AS status,
          p.transaction_id,
          mp.plan_name
        FROM Payments p
        LEFT JOIN Subscriptions s ON p.subscription_id = s.subscription_id
        LEFT JOIN Meal_Plans mp ON s.plan_id = mp.plan_id
        WHERE (p.customer_id = @customerId OR s.customer_id = @customerId)
        ORDER BY p.created_at DESC, p.payment_id DESC
      `);

    console.log('GET /api/payments/user - returned', result.recordset.length, 'rows for user', customerId);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("GET USER PAYMENTS ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch user payments", error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
});

// Get all payments (admin) with customer name + plan
router.get("/admin", verifyAdmin, async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT
        p.payment_id,
        p.subscription_id,
        p.customer_id,
        p.amount,
        ISNULL(p.paid_at, p.created_at) AS paid_at,
        p.created_at AS created_at,
        p.payment_method,
        p.payment_status AS status,
        p.transaction_id,
        c.customer_id AS customer_id,
        c.first_name + ' ' + c.last_name AS customer_name,
        c.email AS customer_email,
        mp.plan_name,
        s.subscription_type,
        s.start_date,
        s.end_date
      FROM Payments p
      LEFT JOIN Subscriptions s ON p.subscription_id = s.subscription_id
      LEFT JOIN Customers c ON s.customer_id = c.customer_id OR p.customer_id = c.customer_id
      LEFT JOIN Meal_Plans mp ON s.plan_id = mp.plan_id
      ORDER BY p.created_at DESC, p.payment_id DESC
    `);

    res.json({ success: true, data: result.recordset, total: result.recordset.length });
  } catch (err) {
    console.error("GET ADMIN PAYMENTS ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch payments", error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
});

// Mark payment as completed (admin only)
router.put("/:id/complete", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    // Ensure payment exists
    const existing = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT payment_id, payment_status FROM Payments WHERE payment_id = @id');

    if (existing.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    await pool.request()
      .input('id', sql.Int, id)
      .query("UPDATE Payments SET payment_status = 'completed', paid_at = GETDATE() WHERE payment_id = @id");

    res.json({ success: true, message: 'Payment marked as completed' });
  } catch (err) {
    console.error('COMPLETE PAYMENT ERROR:', err);
    res.status(500).json({ success: false, message: 'Failed to complete payment', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
});

// Get payment by ID (admin only)
router.get('/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT
          p.payment_id,
          p.subscription_id,
          p.customer_id,
          p.amount,
          p.payment_method,
          p.payment_status AS status,
          p.transaction_id,
          p.paid_at,
          p.created_at,
          c.customer_id AS customer_id,
          c.first_name + ' ' + c.last_name AS customer_name,
          c.email AS customer_email,
          c.phone AS customer_phone,
          mp.plan_name,
          s.subscription_type,
          s.start_date,
          s.end_date
        FROM Payments p
        LEFT JOIN Subscriptions s ON p.subscription_id = s.subscription_id
        LEFT JOIN Customers c ON s.customer_id = c.customer_id OR p.customer_id = c.customer_id
        LEFT JOIN Meal_Plans mp ON s.plan_id = mp.plan_id
        WHERE p.payment_id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    console.error('GET PAYMENT BY ID ERROR:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch payment details', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
});

// Allow the payment owner to 'pay' their pending payment (user or admin)
router.post('/:id/pay', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const pool = await getConnection();

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`SELECT p.payment_id, p.customer_id, s.customer_id AS subscription_owner
                    FROM Payments p
                    LEFT JOIN Subscriptions s ON p.subscription_id = s.subscription_id
                    WHERE p.payment_id = @id`);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const row = result.recordset[0];
    const ownerId = row.customer_id || row.subscription_owner;

    if (ownerId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to pay this payment' });
    }

    await pool.request()
      .input('id', sql.Int, id)
      .query("UPDATE Payments SET payment_status = 'completed', paid_at = GETDATE() WHERE payment_id = @id");

    res.json({ success: true, message: 'Payment completed' });
  } catch (err) {
    console.error('PAY PAYMENT ERROR:', err);
    res.status(500).json({ success: false, message: 'Failed to process payment', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
});

// Update payment status (admin only)
router.put("/:id/status", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'completed', 'failed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'pending', 'completed', or 'failed'"
      });
    }

    const pool = await getConnection();

    // Check if payment exists
    const existing = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT payment_id FROM Payments WHERE payment_id = @id');

    if (existing.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    // Update payment status
    await pool.request()
      .input('id', sql.Int, id)
      .input('status', sql.VarChar(20), status)
      .query('UPDATE Payments SET payment_status = @status WHERE payment_id = @id');

    res.json({
      success: true,
      message: "Payment status updated successfully"
    });
  } catch (err) {
    console.error("UPDATE PAYMENT STATUS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update payment status",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;
