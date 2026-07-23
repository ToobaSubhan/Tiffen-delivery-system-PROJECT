// routes/subscriptions.js
const express = require('express');
const { isAuth } = require('../middleware/auth');
const { getUserSubscriptions, createSubscription } = require('../controllers/subscriptionController');
const router = express.Router();

router.get('/', isAuth, getUserSubscriptions);
router.post('/', isAuth, createSubscription);

module.exports = router;
