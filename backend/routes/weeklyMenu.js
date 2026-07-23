// routes/weeklyMenu.js
const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/database');
const { verifyAdmin } = require('../middleware/authMiddleware');

// Validation helper
const validateWeekday = (weekday) => {
  const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return validDays.includes(weekday);
};

// Public view weekly schedule for users (GET /api/weekly-menu/public)
router.get('/public', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        w.weekly_menu_id,
        w.weekday,
        w.item_id,
        w.price,
        w.available_quantity,
        w.is_active,
        mi.item_name,
        mi.description,
        mi.category,
        mi.cuisine_type,
        mi.price as original_price,
        mi.image_url
      FROM Weekly_Menu w
      LEFT JOIN Menu_Items mi ON w.item_id = mi.item_id
      WHERE mi.is_available = 1 AND w.is_active = 1
      ORDER BY
        CASE
          WHEN w.weekday='Monday' THEN 1
          WHEN w.weekday='Tuesday' THEN 2
          WHEN w.weekday='Wednesday' THEN 3
          WHEN w.weekday='Thursday' THEN 4
          WHEN w.weekday='Friday' THEN 5
          WHEN w.weekday='Saturday' THEN 6
          WHEN w.weekday='Sunday' THEN 7
          ELSE 8
        END,
        mi.item_name
    `);

    // Group by weekday for better frontend consumption
    const schedule = result.recordset.reduce((acc, item) => {
      if (!acc[item.weekday]) {
        acc[item.weekday] = [];
      }
      acc[item.weekday].push(item);
      return acc;
    }, {});

    res.json({
      success: true,
      data: schedule,
      totalItems: result.recordset.length
    });
  } catch (err) {
    console.error('PUBLIC WEEKLY MENU GET ERROR:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weekly menu schedule',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// View weekly schedule (GET /api/weekly-menu)
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        w.weekly_menu_id,
        w.weekday,
        w.item_id,
        w.price,
        w.available_quantity,
        w.is_active,
        w.created_at,
        mi.item_name,
        mi.description,
        mi.category,
        mi.cuisine_type,
        mi.price as original_price,
        mi.image_url
      FROM Weekly_Menu w
      LEFT JOIN Menu_Items mi ON w.item_id = mi.item_id
      WHERE mi.is_available = 1
      ORDER BY
        CASE
          WHEN w.weekday='Monday' THEN 1
          WHEN w.weekday='Tuesday' THEN 2
          WHEN w.weekday='Wednesday' THEN 3
          WHEN w.weekday='Thursday' THEN 4
          WHEN w.weekday='Friday' THEN 5
          WHEN w.weekday='Saturday' THEN 6
          WHEN w.weekday='Sunday' THEN 7
          ELSE 8
        END,
        mi.item_name
    `);

    // Group by weekday for better frontend consumption
    const schedule = result.recordset.reduce((acc, item) => {
      if (!acc[item.weekday]) {
        acc[item.weekday] = [];
      }
      acc[item.weekday].push(item);
      return acc;
    }, {});

    res.json({
      success: true,
      data: schedule,
      totalItems: result.recordset.length
    });
  } catch (err) {
    console.error('WEEKLY MENU GET ERROR:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weekly menu schedule',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get schedule for specific weekday (GET /api/weekly-menu/:weekday)
router.get('/:weekday', verifyAdmin, async (req, res) => {
  try {
    const { weekday } = req.params;

    if (!validateWeekday(weekday)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid weekday. Must be Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, or Sunday'
      });
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('weekday', sql.VarChar(20), weekday)
      .query(`
        SELECT
          w.weekly_menu_id,
          w.weekday,
          w.item_id,
          w.price,
          w.available_quantity,
          w.is_active,
          w.created_at,
          mi.item_name,
          mi.description,
          mi.category,
          mi.cuisine_type,
          mi.image_url
        FROM Weekly_Menu w
        LEFT JOIN Menu_Items mi ON w.item_id = mi.item_id
        WHERE w.weekday = @weekday AND mi.is_available = 1
        ORDER BY mi.item_name
      `);

    // Resolve image URLs
    const dataWithImages = result.recordset.map(item => ({ ...item, image_url: item.image_url ? `${req.protocol}://${req.get('host')}${item.image_url}` : null }));

    res.json({
      success: true,
      data: dataWithImages,
      weekday: weekday,
      count: dataWithImages.length
    });
  } catch (err) {
    console.error('WEEKLY MENU GET BY DAY ERROR:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weekly menu for specified day'
    });
  }
});

// Add weekly schedule item (POST /api/weekly-menu)
router.post('/', verifyAdmin, async (req, res) => {
  try {
    const { weekday, item_id, price, available_quantity } = req.body;

    // Validation
    if (!weekday || !item_id) {
      return res.status(400).json({
        success: false,
        message: 'weekday and item_id are required fields'
      });
    }

    if (!validateWeekday(weekday)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid weekday. Must be Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, or Sunday'
      });
    }

    if (price !== undefined && (isNaN(price) || price < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a positive number'
      });
    }

    if (available_quantity !== undefined && (isNaN(available_quantity) || available_quantity < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Available quantity must be a non-negative number'
      });
    }

    const pool = await getPool();

    // Check if item exists and is available
    const itemCheck = await pool.request()
      .input('item_id', sql.Int, item_id)
      .query('SELECT item_name FROM Menu_Items WHERE item_id = @item_id AND is_available = 1');

    if (itemCheck.recordset.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or unavailable menu item'
      });
    }

    // Check if item is already scheduled for this weekday
    const duplicateCheck = await pool.request()
      .input('weekday', sql.VarChar(20), weekday)
      .input('item_id', sql.Int, item_id)
      .query('SELECT weekly_menu_id FROM Weekly_Menu WHERE weekday = @weekday AND item_id = @item_id');

    if (duplicateCheck.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This item is already scheduled for the selected weekday'
      });
    }

    // Insert new weekly menu item
    const insertResult = await pool.request()
      .input('weekday', sql.VarChar(20), weekday)
      .input('item_id', sql.Int, item_id)
      .input('price', sql.Decimal(8,2), price || null)
      .input('available_quantity', sql.Int, available_quantity || 0)
      .query(`
        INSERT INTO Weekly_Menu (weekday, item_id, price, available_quantity, is_active)
        OUTPUT INSERTED.weekly_menu_id, INSERTED.created_at
        VALUES (@weekday, @item_id, @price, @available_quantity, 1)
      `);

    res.status(201).json({
      success: true,
      message: 'Item successfully scheduled for weekly menu',
      data: {
        weekly_menu_id: insertResult.recordset[0].weekly_menu_id,
        weekday,
        item_id,
        price,
        available_quantity,
        created_at: insertResult.recordset[0].created_at
      }
    });
  } catch (err) {
    console.error('WEEKLY MENU ADD ERROR:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to weekly schedule',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Update weekly schedule item (PUT /api/weekly-menu/:id)
router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { price, available_quantity, is_active } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid weekly menu ID'
      });
    }

    // Validation
    if (price !== undefined && (isNaN(price) || price < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a positive number'
      });
    }

    if (available_quantity !== undefined && (isNaN(available_quantity) || available_quantity < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Available quantity must be a non-negative number'
      });
    }

    if (is_active !== undefined && typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'is_active must be a boolean value'
      });
    }

    const pool = await getPool();

    // Check if item exists
    const existsCheck = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT weekly_menu_id FROM Weekly_Menu WHERE weekly_menu_id = @id');

    if (existsCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Weekly menu item not found'
      });
    }

    // Build dynamic update query
    let updateFields = [];
    let request = pool.request().input('id', sql.Int, id);

    if (price !== undefined) {
      updateFields.push('price = @price');
      request = request.input('price', sql.Decimal(8,2), price);
    }

    if (available_quantity !== undefined) {
      updateFields.push('available_quantity = @available_quantity');
      request = request.input('available_quantity', sql.Int, available_quantity);
    }

    if (is_active !== undefined) {
      updateFields.push('is_active = @is_active');
      request = request.input('is_active', sql.Bit, is_active);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update'
      });
    }

    const updateQuery = `
      UPDATE Weekly_Menu
      SET ${updateFields.join(', ')}
      WHERE weekly_menu_id = @id
    `;

    await request.query(updateQuery);

    res.json({
      success: true,
      message: 'Weekly menu item updated successfully'
    });
  } catch (err) {
    console.error('WEEKLY MENU UPDATE ERROR:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update weekly menu item',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Delete scheduled item (DELETE /api/weekly-menu/:id)
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid weekly menu ID'
      });
    }

    const pool = await getPool();

    // Check if item exists
    const existsCheck = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT weekly_menu_id, weekday FROM Weekly_Menu WHERE weekly_menu_id = @id');

    if (existsCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Weekly menu item not found'
      });
    }

    const weekday = existsCheck.recordset[0].weekday;

    // Delete the item
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Weekly_Menu WHERE weekly_menu_id = @id');

    res.json({
      success: true,
      message: 'Weekly menu item deleted successfully',
      data: { deleted_id: id, weekday }
    });
  } catch (err) {
    console.error('WEEKLY MENU DELETE ERROR:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete weekly menu item',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Bulk update for a weekday (PUT /api/weekly-menu/bulk/:weekday)
router.put('/bulk/:weekday', verifyAdmin, async (req, res) => {
  try {
    const { weekday } = req.params;
    const { items } = req.body; // Array of { item_id, price, available_quantity }

    if (!validateWeekday(weekday)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid weekday'
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required and cannot be empty'
      });
    }

    const pool = await getPool();

    // Use transaction for bulk update
    const transaction = pool.transaction();
    await transaction.begin();

    try {
      for (const item of items) {
        const { item_id, price, available_quantity } = item;

        if (!item_id) continue;

        // Check if item exists for this weekday
        const existing = await transaction.request()
          .input('weekday', sql.VarChar(20), weekday)
          .input('item_id', sql.Int, item_id)
          .query('SELECT weekly_menu_id FROM Weekly_Menu WHERE weekday = @weekday AND item_id = @item_id');

        if (existing.recordset.length > 0) {
          // Update existing
          await transaction.request()
            .input('weekday', sql.VarChar(20), weekday)
            .input('item_id', sql.Int, item_id)
            .input('price', sql.Decimal(8,2), price || null)
            .input('available_quantity', sql.Int, available_quantity || 0)
            .query(`
              UPDATE Weekly_Menu
              SET price = @price, available_quantity = @available_quantity
              WHERE weekday = @weekday AND item_id = @item_id
            `);
        } else {
          // Insert new
          await transaction.request()
            .input('weekday', sql.VarChar(20), weekday)
            .input('item_id', sql.Int, item_id)
            .input('price', sql.Decimal(8,2), price || null)
            .input('available_quantity', sql.Int, available_quantity || 0)
            .query(`
              INSERT INTO Weekly_Menu (weekday, item_id, price, available_quantity, is_active)
              VALUES (@weekday, @item_id, @price, @available_quantity, 1)
            `);
        }
      }

      await transaction.commit();

      res.json({
        success: true,
        message: `Weekly schedule updated for ${weekday}`,
        updatedItems: items.length
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('WEEKLY MENU BULK UPDATE ERROR:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update weekly schedule',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;
