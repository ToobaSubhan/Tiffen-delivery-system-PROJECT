const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { getConnection } = require('../config/database');
const { verifyAdmin } = require('../middleware/authMiddleware');

// ================================
// GET ALL MENU ITEMS
// ================================
router.get("/items", verifyAdmin, async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT item_id, item_name, description, category, cuisine_type, price,
             is_available, ingredients, calories, image_url
      FROM Menu_Items
      ORDER BY item_name
    `);

    // Transform ingredients from string to array
    const transformedData = result.recordset.map(item => ({
      ...item,
      ingredients: item.ingredients ? item.ingredients.split(',').map(ing => ing.trim()) : [],
      image_url: item.image_url || null
    }));

    res.json(transformedData);
  } catch (err) {
    console.error("GET ITEMS ERROR:", err);
    res.status(500).json({ message: "Failed to load menu items" });
  }
});

// ================================
// ADD NEW MENU ITEM
// ================================
router.post("/items", verifyAdmin, async (req, res) => {
  try {
    const { item_name, description, category, cuisine_type, price, is_available, ingredients, calories } = req.body;

    if (!item_name || !category || !price) {
      return res.status(400).json({ message: "item_name, category, and price are required" });
    }

    const pool = await getConnection();
    await pool.request()
      .input("item_name", sql.VarChar(100), item_name)
      .input("description", sql.Text, description || "")
      .input("category", sql.VarChar(10), category)
      .input("cuisine_type", sql.VarChar(50), cuisine_type || "")
      .input("price", sql.Decimal(6, 2), price)
      .input("is_available", sql.Bit, is_available ?? 1)
      .input("ingredients", sql.Text, ingredients || "")
      .input("calories", sql.Int, calories || 0)
      .query(`
        INSERT INTO Menu_Items (item_name, description, category, cuisine_type, price, is_available, ingredients, calories)
        VALUES (@item_name, @description, @category, @cuisine_type, @price, @is_available, @ingredients, @calories)
      `);

    res.json({ message: "Item added successfully" });
  } catch (err) {
    console.error("ADD ITEM ERROR:", err);
    res.status(500).json({ message: "Failed to add item" });
  }
});

// ================================
// GET TODAY'S MENU
// ================================
router.get("/today", verifyAdmin, async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT dm.daily_menu_id, dm.item_id, dm.available_quantity,
             mi.item_name, mi.description, mi.category, mi.price, mi.ingredients, mi.calories, mi.image_url
      FROM Daily_Menu dm
      JOIN Menu_Items mi ON dm.item_id = mi.item_id
      WHERE dm.menu_date = CAST(GETDATE() AS DATE)
      ORDER BY dm.daily_menu_id
    `);

    // Transform ingredients from string to array
    const transformedData = result.recordset.map(item => ({
      ...item,
      ingredients: item.ingredients ? item.ingredients.split(',').map(ing => ing.trim()) : [],
      image_url: item.image_url || null
    }));

    res.json(transformedData);
  } catch (err) {
    console.error("GET TODAY MENU ERROR:", err);
    res.status(500).json({ message: "Failed to load today's menu" });
  }
});

// ================================
// ADD ITEM TO TODAY'S MENU
// ================================
router.post("/add", verifyAdmin, async (req, res) => {
  try {
    const { item_id, quantity } = req.body;

    if (!item_id || !quantity) {
      return res.status(400).json({ message: "item_id and quantity are required" });
    }

    const pool = await getConnection();
    await pool.request()
      .input("item_id", sql.Int, item_id)
      .input("available_quantity", sql.Int, quantity)
      .query(`
        INSERT INTO Daily_Menu (item_id, menu_date, available_quantity)
        VALUES (@item_id, CAST(GETDATE() AS DATE), @available_quantity)
      `);

    res.json({ message: "Item added to today's menu" });
  } catch (err) {
    console.error("ADD TO TODAY MENU ERROR:", err);
    res.status(500).json({ message: "Failed to add item to today's menu" });
  }
});

// ================================
// REMOVE ITEM FROM TODAY'S MENU
// ================================
router.delete("/remove/:daily_menu_id", verifyAdmin, async (req, res) => {
  try {
    const { daily_menu_id } = req.params;

    const pool = await getConnection();
    await pool.request()
      .input("daily_menu_id", sql.Int, daily_menu_id)
      .query(`
        DELETE FROM Daily_Menu WHERE daily_menu_id = @daily_menu_id
      `);

    res.json({ message: "Item removed from today's menu" });
  } catch (err) {
    console.error("REMOVE FROM TODAY MENU ERROR:", err);
    res.status(500).json({ message: "Failed to remove item from today's menu" });
  }
});

// ================================
// UPDATE QUANTITY
// ================================
router.put("/update-quantity/:daily_menu_id", verifyAdmin, async (req, res) => {
  try {
    const { daily_menu_id } = req.params;
    const { available_quantity } = req.body;

    if (available_quantity < 0) {
      return res.status(400).json({ message: "Quantity cannot be negative" });
    }

    const pool = await getConnection();
    await pool.request()
      .input("daily_menu_id", sql.Int, daily_menu_id)
      .input("available_quantity", sql.Int, available_quantity)
      .query(`
        UPDATE Daily_Menu
        SET available_quantity = @available_quantity
        WHERE daily_menu_id = @daily_menu_id
      `);

    res.json({ message: "Quantity updated successfully" });
  } catch (err) {
    console.error("UPDATE QUANTITY ERROR:", err);
    res.status(500).json({ message: "Failed to update quantity" });
  }
});

// ================================
// UPDATE MENU ITEM
// ================================
router.put('/items/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { item_name, description, category, cuisine_type, price, is_available, ingredients, calories } = req.body;

    const pool = await getConnection();
    await pool.request()
      .input('id', sql.Int, id)
      .input('item_name', sql.VarChar(100), item_name || null)
      .input('description', sql.Text, description || null)
      .input('category', sql.VarChar(50), category || null)
      .input('cuisine_type', sql.VarChar(50), cuisine_type || null)
      .input('price', sql.Decimal(8,2), price || null)
      .input('is_available', sql.Bit, is_available === undefined ? null : is_available)
      .input('ingredients', sql.Text, ingredients || null)
      .input('calories', sql.Int, calories || null)
      .query(`
        UPDATE Menu_Items
        SET
          item_name = COALESCE(@item_name, item_name),
          description = COALESCE(@description, description),
          category = COALESCE(@category, category),
          cuisine_type = COALESCE(@cuisine_type, cuisine_type),
          price = COALESCE(@price, price),
          is_available = COALESCE(@is_available, is_available),
          ingredients = COALESCE(@ingredients, ingredients),
          calories = COALESCE(@calories, calories)
        WHERE item_id = @id
      `);

    res.json({ message: 'Item updated successfully' });
  } catch (err) {
    console.error('UPDATE ITEM ERROR:', err);
    res.status(500).json({ message: 'Failed to update item', error: err.message });
  }
});

// ================================
// DELETE MENU ITEM
// ================================
router.delete('/items/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Menu_Items WHERE item_id = @id');

    res.json({ message: 'Item deleted' });
  } catch (err) {
    console.error('DELETE ITEM ERROR:', err);
    res.status(500).json({ message: 'Failed to delete item' });
  }
});

// ================================
// TOGGLE AVAILABILITY
// ================================
router.put('/toggle-availability/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    // Flip the is_available flag
    await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE Menu_Items SET is_available = CASE WHEN is_available = 1 THEN 0 ELSE 1 END WHERE item_id = @id');

    res.json({ message: 'Availability toggled' });
  } catch (err) {
    console.error('TOGGLE AVAILABILITY ERROR:', err);
    res.status(500).json({ message: 'Failed to toggle availability' });
  }
});

module.exports = router;
