const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(protect, admin);

router.get('/stats',          ctrl.getStats);
router.get('/users',          ctrl.getUsers);
router.get('/users/:id',      ctrl.getUser);
router.put('/users/:id/role', ctrl.updateRole);
router.delete('/users/:id',   ctrl.deleteUser);

module.exports = router;
