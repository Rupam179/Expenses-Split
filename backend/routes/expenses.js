const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createExpense, getGroupExpenses, getExpenseById, deleteExpense, getFriendExpenses,
} = require('../controllers/expenseController');

router.post('/', auth, createExpense);
router.get('/group/:groupId', auth, getGroupExpenses);
router.get('/friend/:friendId', auth, getFriendExpenses);
router.get('/:id', auth, getExpenseById);
router.delete('/:id', auth, deleteExpense);

module.exports = router;
