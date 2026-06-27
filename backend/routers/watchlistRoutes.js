const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/watchlistController');
const { protect } = require('../middleware/auth');

router.get('/',                protect, ctrl.getWatchlist);
router.post('/coin',           protect, ctrl.addCoin);
router.delete('/coin/:coinId', protect, ctrl.removeCoin);

module.exports = router;
