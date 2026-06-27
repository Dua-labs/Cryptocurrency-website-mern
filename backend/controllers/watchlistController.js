const WatchList = require('../models/WatchList');

// GET /api/watchlist
exports.getWatchlist = async (req, res, next) => {
  try {
    let watchlist = await WatchList.findOne({ user: req.user.id });
    if (!watchlist) {
      watchlist = await WatchList.create({ user: req.user.id, coins: [] });
    }
    res.json({ success: true, data: watchlist });
  } catch (err) {
    next(err);
  }
};

// POST /api/watchlist/coin
exports.addCoin = async (req, res, next) => {
  try {
    const { coinId, coinSymbol, coinName } = req.body;

    if (!coinId || !coinSymbol || !coinName) {
      return res.status(400).json({ success: false, message: 'coinId, coinSymbol, and coinName are required' });
    }

    let watchlist = await WatchList.findOne({ user: req.user.id });
    if (!watchlist) {
      watchlist = new WatchList({ user: req.user.id, coins: [] });
    }

    const alreadyAdded = watchlist.coins.some((c) => c.coinId === coinId);
    if (alreadyAdded) {
      return res.status(409).json({ success: false, message: 'Coin already in watchlist' });
    }

    watchlist.coins.push({ coinId, coinSymbol, coinName });
    await watchlist.save();

    res.status(201).json({ success: true, data: watchlist });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/watchlist/coin/:coinId
exports.removeCoin = async (req, res, next) => {
  try {
    const { coinId } = req.params;
    const watchlist = await WatchList.findOne({ user: req.user.id });

    if (!watchlist) {
      return res.status(404).json({ success: false, message: 'Watchlist not found' });
    }

    watchlist.coins = watchlist.coins.filter((c) => c.coinId !== coinId);
    await watchlist.save();

    res.json({ success: true, data: watchlist });
  } catch (err) {
    next(err);
  }
};
