const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createGroup, getMyGroups, getGroupById, addMember, removeMember, deleteGroup,
} = require('../controllers/groupController');

router.post('/', auth, createGroup);
router.get('/', auth, getMyGroups);
router.get('/:id', auth, getGroupById);
router.post('/:id/members', auth, addMember);
router.delete('/:id/members/:userId', auth, removeMember);
router.delete('/:id', auth, deleteGroup);

module.exports = router;
