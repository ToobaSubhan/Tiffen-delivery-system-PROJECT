// routes/users.js
const express = require('express');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const { getAllUsers, getUserProfile, updateUser, deleteUser, changePassword } = require('../controllers/userController');
const router = express.Router();

// Admin: list and manage users
router.get('/', verifyAdmin, getAllUsers);
// Authenticated user profile
router.get('/profile', verifyToken, getUserProfile);
// Admin update / delete
router.put('/:id', verifyAdmin, updateUser);
router.delete('/:id', verifyAdmin, deleteUser);
// Change password for authenticated user
router.post('/change-password', verifyToken, changePassword);

module.exports = router;
