// controllers/authController.js
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection } = require('../config/database');

// Register User
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const pool = await getConnection();
    
    // Check if user already exists
    const checkUser = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Customers WHERE email = @email');

    if (checkUser.recordset.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Split name into first and last name
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Insert user into Customers table
    const result = await pool.request()
      .input('firstName', sql.VarChar, firstName)
      .input('lastName', sql.VarChar, lastName)
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, hashedPassword)
      .input('phone', sql.VarChar, phone)
      .input('address', sql.Text, '')
      .input('pincode', sql.VarChar, '')
      .input('role', sql.VarChar, 'user')
      .query(`
        INSERT INTO Customers (first_name, last_name, email, password, phone, address, pincode, role, registration_date, status)
        VALUES (@firstName, @lastName, @email, @password, @phone, @address, @pincode, @role, GETDATE(), 'active');
        SELECT @@IDENTITY as customer_id;
      `);

    const customerId = result.recordset[0].customer_id;

    // Generate token
    const token = jwt.sign(
      { id: customerId, email, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: { 
        user_id: customerId, 
        name: name, 
        email, 
        phone, 
        role: 'user' 
      },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login User
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const pool = await getConnection();
    
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Customers WHERE email = @email');

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.recordset[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.customer_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        user_id: user.customer_id,
        name: user.first_name + ' ' + user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
