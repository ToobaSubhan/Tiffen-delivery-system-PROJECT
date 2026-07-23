const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { getConnection } = require('../config/database');
const { verifyToken } = require('../middleware/authMiddleware');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'client.log');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  try { fs.mkdirSync(LOG_DIR); } catch (err) { console.error('Failed to create logs dir:', err); }
}

// POST /api/logs  (authenticated)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { type, message, meta } = req.body || {};
    const userId = req.user?.id || null;
    const logEntry = {
      ts: new Date().toISOString(),
      userId,
      type: type || 'client:event',
      message: message || '',
      meta: meta || {}
    };

    // Console log for immediate visibility
    console.log('CLIENT LOG:', JSON.stringify(logEntry));

    // Append to file (async) -- best effort
    try {
      fs.appendFile(LOG_FILE, JSON.stringify(logEntry) + '\n', (err) => {
        if (err) console.error('Failed to append client log:', err);
      });
    } catch (err) {
      console.error('Error writing client log:', err);
    }

    res.status(204).end();
  } catch (err) {
    console.error('LOGS ENDPOINT ERROR:', err);
    res.status(500).json({ success: false, message: 'Failed to write log' });
  }
});

module.exports = router;