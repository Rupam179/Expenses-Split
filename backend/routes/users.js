const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { searchUsers, getFriends } = require('../controllers/userController');

router.get('/search', auth, searchUsers);
router.get('/friends', auth, getFriends);

module.exports = router;
