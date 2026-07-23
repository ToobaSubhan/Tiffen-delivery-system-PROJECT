// routes/plans.js
const express = require('express');
const { isAuth, isAdmin } = require('../middleware/auth');
const { getPlans, addPlan, updatePlan, deletePlan } = require('../controllers/planController');
const router = express.Router();

router.get('/', getPlans);
router.post('/', isAuth, isAdmin, addPlan);
router.put('/:id', isAuth, isAdmin, updatePlan);
router.delete('/:id', isAuth, isAdmin, deletePlan);

module.exports = router;
