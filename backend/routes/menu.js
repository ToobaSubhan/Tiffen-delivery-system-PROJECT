// routes/menu.js
const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { getConnection } = require('../config/database');

router.get('/today', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
  dm.daily_menu_id as id,
  dm.item_id,
  mi.item_name as meal_name,      -- Changed from item_name
  mi.description,
  mi.category as meal_type,        -- Changed from category
  mi.price,
  mi.ingredients,
  mi.calories,
  mi.image_url as image,           -- Changed from image_url
  dm.available_quantity
FROM Daily_Menu dm
JOIN Menu_Items mi ON dm.item_id = mi.item_id
WHERE dm.menu_date = CAST(GETDATE() AS DATE)
    `);

    // Transform ingredients from string to array and include full image URL
    const transformedData = result.recordset.map(item => ({
      ...item,
      ingredients: item.ingredients ? 
        item.ingredients.split(',').map(ing => ing.trim()) : [],
      image: item.image ? `${req.protocol}://${req.get('host')}${item.image}` : null,
    }));

    res.json(transformedData);
  } catch (err) {
    console.error('Error fetching today menu:', err);
    res.status(500).json({ message: 'Failed to load today menu' });
  }
});

module.exports = router;
