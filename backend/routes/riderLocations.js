const router = require('express').Router();
const sql = require('mssql');
const { getConnection } = require('../config/database');
const { verifyToken } = require('../middleware/authMiddleware');

// Rider submission endpoint (NO login required)
// POST /api/rider-locations/update
// body: { rider_id, latitude, longitude }
router.post('/update', async (req, res) => {
  try {
    const { rider_id, latitude, longitude } = req.body;

    if (rider_id === undefined || rider_id === null) {
      return res.status(400).json({ message: 'rider_id is required' });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: 'latitude and longitude must be valid numbers' });
    }

    const pool = await getConnection();

    // Ensure rider exists
    const riderCheck = await pool.request()
      .input('riderId', sql.Int, rider_id)
      .query('SELECT rider_id FROM Riders WHERE rider_id = @riderId');

    if (riderCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    await pool.request()
      .input('riderId', sql.Int, rider_id)
      .input('latitude', sql.Decimal(10, 7), lat)
      .input('longitude', sql.Decimal(10, 7), lng)
      .query(`
        UPDATE Riders
        SET current_lat = @latitude,
            current_lng = @longitude,
            location_updated_at = GETDATE()
        WHERE rider_id = @riderId
      `);

    res.json({ success: true });
  } catch (err) {
    console.error('RIDER LOCATION UPDATE ERROR:', err);
    res.status(500).json({ message: 'Failed to update rider location', error: err.message });
  }
});

// Customer endpoint (AUTHENTICATED)
// GET /api/rider-locations/:riderId
router.get('/:riderId', verifyToken, async (req, res) => {
  try {
    const { riderId } = req.params;

    const pool = await getConnection();
    const result = await pool.request()
      .input('riderId', sql.Int, riderId)
      .query(`
        SELECT 
          rider_id,
          current_lat AS latitude,
          current_lng AS longitude,
          location_updated_at AS last_updated
        FROM Riders
        WHERE rider_id = @riderId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    const row = result.recordset[0];

    // If rider never shared location yet
    if (row.latitude === null || row.longitude === null || row.last_updated === null) {
      return res.json({ available: false, rider_id: row.rider_id });
    }

    res.json({ available: true, ...row });
  } catch (err) {
    console.error('RIDER LOCATION GET ERROR:', err);
    res.status(500).json({ message: 'Failed to fetch rider location', error: err.message });
  }
});

module.exports = router;

