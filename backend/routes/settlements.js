const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createSettlement, getGroupSettlements } = require('../controllers/settlementController');

router.post('/', auth, createSettlement);
router.get('/group/:groupId', auth, getGroupSettlements);

module.exports = router;
