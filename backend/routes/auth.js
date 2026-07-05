const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { signup, login, me } = require('../controllers/authController');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', auth, me);

module.exports = router;
