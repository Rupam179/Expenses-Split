const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getGroupBalances, getMySummary } = require('../controllers/balanceController');

router.get('/group/:groupId', auth, getGroupBalances);
router.get('/summary', auth, getMySummary);

module.exports = router;
