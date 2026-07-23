// tiffin-backend/routes/menuUpload.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { getPool, sql } = require('../config/database');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Admin middleware
const requireAdmin = (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message: 'No token' });

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin')
      return res.status(403).json({ message: 'Admin access only' });

    next();
  } catch (err) {
    console.log(err);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save files into the project's top-level `Uploads` directory so the static route can serve them
    cb(null, path.join(__dirname, '..', 'Uploads'));
  },
  filename: (req, file, cb) => {
  const ext = path.extname(file.originalname);
  const name = path.basename(file.originalname, ext).replace(/\s+/g, '');
  cb(null, Date.now() + '-' + name + ext);
}
});

const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error("Only JPG/PNG allowed"));
    } else cb(null, true);
  }
});

// Upload route
router.post('/upload-image', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const itemId = req.body.item_id;
    const imageUrl = `/uploads/${req.file.filename}`;

    const pool = await getPool();
    await pool.request()
      .input('img', sql.VarChar, imageUrl)
      .input('id', sql.Int, itemId)
      .query(`UPDATE Menu_Items SET image_url = @img WHERE item_id = @id`);

    const fullImageUrl = `${req.protocol}://${req.get('host')}${imageUrl}`;
    res.json({
      message: 'Image uploaded successfully',
      image_url: fullImageUrl
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed' });
  }
});

module.exports = router;
