// controllers/userController.js
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const { getConnection } = require('../config/database');

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT 
          customer_id as user_id, 
          first_name,
          last_name,
          email, 
          phone, 
          role, 
          registration_date as created_at 
        FROM Customers 
        ORDER BY registration_date DESC
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const pool = await getConnection();
    const result = await pool.request()
      .input('customerId', sql.Int, userId)
      .query(`
        SELECT 
          customer_id as user_id, 
          first_name,
          last_name,
          email, 
          phone, 
          role, 
          registration_date as created_at 
        FROM Customers 
        WHERE customer_id = @customerId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
};

// Update user profile
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { first_name, last_name, phone } = req.body;

    const pool = await getConnection();
    await pool.request()
      .input('customerId', sql.Int, userId)
      .input('firstName', sql.VarChar, first_name || null)
      .input('lastName', sql.VarChar, last_name || null)
      .input('phone', sql.VarChar, phone || null)
      .query(`
        UPDATE Customers 
        SET 
          first_name = COALESCE(@firstName, first_name),
          last_name = COALESCE(@lastName, last_name),
          phone = COALESCE(@phone, phone)
        WHERE customer_id = @customerId
      `);

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const pool = await getConnection();
    
    // Delete related data in order: Deliveries -> Orders -> Subscriptions -> Customers
    await pool.request()
      .input('customerId', sql.Int, userId)
      .query(`
        DELETE FROM Deliveries WHERE order_id IN 
          (SELECT order_id FROM Orders WHERE customer_id = @customerId);
        DELETE FROM Orders WHERE customer_id = @customerId;
        DELETE FROM Subscriptions WHERE customer_id = @customerId;
        DELETE FROM Customers WHERE customer_id = @customerId;
      `);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('customerId', sql.Int, userId)
      .query('SELECT password FROM Customers WHERE customer_id = @customerId');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, result.recordset[0].password);
    if (!isValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.request()
      .input('customerId', sql.Int, userId)
      .input('password', sql.VarChar, hashedPassword)
      .query('UPDATE Customers SET password = @password WHERE customer_id = @customerId');

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password', error: error.message });
  }
};
