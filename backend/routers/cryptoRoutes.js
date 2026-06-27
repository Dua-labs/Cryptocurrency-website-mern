const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/cryptoController');

// Public routes — no auth needed
router.get('/markets',          ctrl.getMarkets);
router.get('/global',           ctrl.getGlobal);
router.get('/trending',         ctrl.getTrending);
router.get('/search',           ctrl.search);
router.get('/coin/:coinId',     ctrl.getCoin);
router.get('/coin/:coinId/chart', ctrl.getCoinChart);

module.exports = router;
