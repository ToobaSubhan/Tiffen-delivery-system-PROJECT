const express = require('express');
const sql = require('mssql');
const router = express.Router();
const { getConnection } = require('../config/database');
const { verifyAdmin } = require('../middleware/authMiddleware');

// GET all categories — public
router.get('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query('SELECT * FROM Categories ORDER BY category_name');

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch categories', error: err.message });
  }
});

// POST add new category — admin only
router.post('/', verifyAdmin, async (req, res) => {
  try {
    const { category_name } = req.body;
    if (!category_name?.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const pool = await getConnection();
    await pool.request()
      .input('name', sql.VarChar(50), category_name.toLowerCase().trim())
      .query(`
        IF NOT EXISTS (SELECT 1 FROM Categories WHERE category_name = @name)
          INSERT INTO Categories (category_name) VALUES (@name)
      `);

    res.json({ message: 'Category added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add category', error: err.message });
  }
});

// DELETE category — admin only
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const pool = await getConnection();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM Categories WHERE category_id = @id');

    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete category', error: err.message });
  }
});

module.exports = router;
