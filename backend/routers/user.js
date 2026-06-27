const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  deleteAccount,
} = require('../controllers/user');
const { protect } = require('../middleware/auth');

router.post('/register',         registerUser);
router.post('/login',            loginUser);
router.get('/profile',           protect, getUserProfile);
router.put('/profile',           protect, updateUserProfile);
router.put('/change-password',   protect, changePassword);
router.delete('/account',        protect, deleteAccount);

module.exports = router;
