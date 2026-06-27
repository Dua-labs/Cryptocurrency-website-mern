const {
  getMarkets,
  getCoinDetail,
  getCoinChart,
  searchCoins,
  getGlobal,
  getTrending,
} = require('../services/cryptoApi.service');

// GET /api/crypto/markets?page=1&per_page=50&currency=usd
exports.getMarkets = async (req, res, next) => {
  try {
    const { page = 1, per_page = 50, currency = 'usd' } = req.query;
    const data = await getMarkets(Number(page), Number(per_page), currency);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// GET /api/crypto/coin/:coinId
exports.getCoin = async (req, res, next) => {
  try {
    const data = await getCoinDetail(req.params.coinId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// GET /api/crypto/coin/:coinId/chart?days=7&currency=usd
exports.getCoinChart = async (req, res, next) => {
  try {
    const { days = 7, currency = 'usd' } = req.query;
    const data = await getCoinChart(req.params.coinId, Number(days), currency);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// GET /api/crypto/search?q=bitcoin
exports.search = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) {
      return res.status(400).json({ success: false, message: 'Query param q is required' });
    }
    const data = await searchCoins(q.trim());
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// GET /api/crypto/global
exports.getGlobal = async (req, res, next) => {
  try {
    const data = await getGlobal();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// GET /api/crypto/trending
exports.getTrending = async (req, res, next) => {
  try {
    const data = await getTrending();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
