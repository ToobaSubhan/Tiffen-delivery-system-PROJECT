const router = require("express").Router();
const { getConnection } = require("../config/database");
const sql = require("mssql");
const { verifyAdmin, verifyToken } = require("../middleware/authMiddleware");

// List riders (admin only)
router.get("/", verifyAdmin, async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query("SELECT * FROM Riders");
    res.json(result.recordset);
  } catch (err) {
    console.error('GET RIDERS ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

// Add rider (admin only)
router.post("/", verifyAdmin, async (req, res) => {
  try {
    const { first_name, last_name, phone, vehicle_number, status } = req.body;
    if (!first_name || !last_name) {
      return res.status(400).json({ message: "First name and last name are required" });
    }

    const allowedStatuses = ['available', 'busy', 'offline'];
    const normalizedStatus = allowedStatuses.includes(status) ? status : 'available';

    const pool = await getConnection();
    await pool.request()
      .input("first_name", sql.VarChar(100), first_name)
      .input("last_name", sql.VarChar(100), last_name)
      .input("phone", sql.VarChar(20), phone || null)
      .input("vehicle_number", sql.VarChar(50), vehicle_number || null)
      .input("status", sql.VarChar(20), normalizedStatus)
      .query("INSERT INTO Riders (first_name, last_name, phone, vehicle_number, status) VALUES (@first_name, @last_name, @phone, @vehicle_number, @status)");
    res.json({ success: true, message: "Rider added" });
  } catch (err) {
    console.error('ADD RIDER ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update rider (admin only)
router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, phone, vehicle_number, status } = req.body;
    if (!first_name || !last_name) return res.status(400).json({ message: 'First name and last name are required' });

    const allowedStatuses = ['available', 'busy', 'offline'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid rider status. Allowed: ${allowedStatuses.join(', ')}` });
    }

    const pool = await getConnection();
    await pool.request()
      .input('id', sql.Int, id)
      .input('first_name', sql.VarChar(100), first_name)
      .input('last_name', sql.VarChar(100), last_name)
      .input('phone', sql.VarChar(20), phone || null)
      .input('vehicle_number', sql.VarChar(50), vehicle_number || null)
      .input('status', sql.VarChar(20), status || 'available')
      .query('UPDATE Riders SET first_name = @first_name, last_name = @last_name, phone = @phone, vehicle_number = @vehicle_number, status = @status WHERE rider_id = @id');

    res.json({ success: true, message: 'Rider updated' });
  } catch (err) {
    console.error('UPDATE RIDER ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

// Delete rider (admin only)
router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    await pool.request()
      .input("id", sql.Int, id)
      .query("DELETE FROM Riders WHERE rider_id = @id");
    res.json({ success: true, message: "Rider deleted" });
  } catch (err) {
    console.error('DELETE RIDER ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
