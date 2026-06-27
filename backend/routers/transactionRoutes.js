const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

router.get('/',    protect, ctrl.getTransactions);
router.post('/',   protect, ctrl.createTransaction);
router.get('/:id', protect, ctrl.getTransaction);
router.delete('/:id', protect, ctrl.deleteTransaction);

module.exports = router;
