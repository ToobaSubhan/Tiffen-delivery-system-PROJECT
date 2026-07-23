// controllers/planController.js
const sql = require('mssql');
const { getConnection } = require('../config/database');

// Get all meal plans
exports.getPlans = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query('SELECT plan_id, plan_name, description, price_per_month, NULL as type FROM Meal_Plans WHERE is_available = 1');

    res.json(result.recordset);
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ message: 'Failed to fetch plans', error: error.message });
  }
};

// Add meal plan (admin only)
exports.addPlan = async (req, res) => {
  try {
    const { plan_name, description, price_per_month, meals_per_day, subscription_type, plan_type, is_available } = req.body;

    if (!plan_name || !price_per_month) {
      return res.status(400).json({ message: 'Plan name and price are required' });
    }

    const pool = await getConnection();

    // Auto-create category from plan_name if not exists
    const categoryName = plan_name.toLowerCase().trim();
    await pool.request()
      .input('name', sql.VarChar(50), categoryName)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM Categories WHERE category_name = @name)
          INSERT INTO Categories (category_name) VALUES (@name)
      `);

    const result = await pool.request()
      .input('planName', sql.VarChar(100), plan_name)
      .input('description', sql.Text, description || null)
      .input('pricePerMonth', sql.Decimal(8, 2), price_per_month)
      .input('mealsPerDay', sql.Int, meals_per_day || null)
      .input('subscriptionType', sql.VarChar(50), subscription_type || 'Monthly')
      .input('planType', sql.VarChar(50), plan_type || null)
      .input('isAvailable', sql.Bit, is_available ?? 1)
      .query(`
        INSERT INTO Meal_Plans 
          (plan_name, description, price_per_month, meals_per_day, subscription_type, plan_type, is_available)
        VALUES 
          (@planName, @description, @pricePerMonth, @mealsPerDay, @subscriptionType, @planType, @isAvailable);
        SELECT @@IDENTITY as plan_id;
      `);

    res.status(201).json({ 
      message: 'Plan created and category added successfully', 
      plan_id: result.recordset[0].plan_id 
    });
  } catch (error) {
    console.error('Add plan error:', error);
    res.status(500).json({ message: 'Failed to create plan', error: error.message });
  }
};

// Update meal plan (admin only)
exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan_name, description, price_per_month } = req.body;

    const pool = await getConnection();
    await pool.request()
      .input('id', sql.Int, id)
      .input('planName', sql.VarChar, plan_name || null)
      .input('description', sql.Text, description || null)
      .input('pricePerMonth', sql.Decimal(8, 2), price_per_month || null)
      .query(`
        UPDATE Meal_Plans 
        SET 
          plan_name = COALESCE(@planName, plan_name),
          description = COALESCE(@description, description),
          price_per_month = COALESCE(@pricePerMonth, price_per_month)
        WHERE plan_id = @id
      `);

    res.json({ message: 'Plan updated successfully' });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ message: 'Failed to update plan', error: error.message });
  }
};

// Delete meal plan (admin only)
exports.deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await getConnection();
    await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE Meal_Plans SET is_available = 0 WHERE plan_id = @id');

    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({ message: 'Failed to delete plan', error: error.message });
  }
};
