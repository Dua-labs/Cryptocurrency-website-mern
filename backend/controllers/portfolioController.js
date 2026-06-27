const Portfolio = require("../models/Portfolio");


// 🔹 GET /api/portfolio
exports.getPortfolio = async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne({ user: req.user.id });

    if (!portfolio) {
      portfolio = await Portfolio.create({ user: req.user.id, holdings: [] });
    }

    res.json(portfolio);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// 🔹 POST /api/portfolio/holding
exports.addOrUpdateHolding = async (req, res) => {
  try {
    const { coinId, quantity, avgBuyPrice, coinSymbol, coinName, currentPrice } = req.body;

    let portfolio = await Portfolio.findOne({ user: req.user.id });

    if (!portfolio) {
      portfolio = new Portfolio({ user: req.user.id, holdings: [] });
    }

    const existingHolding = portfolio.holdings.find(h => h.coinId === coinId);

    if (existingHolding) {
      // Update existing
      existingHolding.quantity = quantity;
      existingHolding.avgBuyPrice = avgBuyPrice;
      existingHolding.currentPrice = currentPrice || existingHolding.currentPrice;
      existingHolding.coinSymbol = coinSymbol || existingHolding.coinSymbol;
      existingHolding.coinName = coinName || existingHolding.coinName;
    } else {
      // Add new
      portfolio.holdings.push({
        coinId,
        quantity,
        avgBuyPrice,
        coinSymbol,
        coinName,
        currentPrice: currentPrice || 0
      });
    }

    // 🔹 Recalculate totals
    let totalInvested = 0;
    let totalCurrentValue = 0;

    portfolio.holdings.forEach(h => {
      totalInvested += h.quantity * h.avgBuyPrice;
      totalCurrentValue += h.quantity * h.currentPrice;
    });

    portfolio.totalInvested = totalInvested;
    portfolio.totalCurrentValue = totalCurrentValue;

    await portfolio.save();

    res.json(portfolio);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// 🔹 DELETE /api/portfolio/holding/:coinId
exports.deleteHolding = async (req, res) => {
  try {
    const { coinId } = req.params;

    let portfolio = await Portfolio.findOne({ user: req.user.id });

    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    portfolio.holdings = portfolio.holdings.filter(h => h.coinId !== coinId);

    // 🔹 Recalculate totals
    let totalInvested = 0;
    let totalCurrentValue = 0;

    portfolio.holdings.forEach(h => {
      totalInvested += h.quantity * h.avgBuyPrice;
      totalCurrentValue += h.quantity * h.currentPrice;
    });

    portfolio.totalInvested = totalInvested;
    portfolio.totalCurrentValue = totalCurrentValue;

    await portfolio.save();

    res.json({ message: "Holding removed", portfolio });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// 🔹 GET /api/portfolio/summary
exports.getSummary = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user.id });

    if (!portfolio) {
      return res.json({
        totalInvested: 0,
        totalCurrentValue: 0,
        profitLoss: 0,
        profitLossPercentage: 0
      });
    }

    const profitLoss = portfolio.totalCurrentValue - portfolio.totalInvested;

    const profitLossPercentage =
      portfolio.totalInvested === 0
        ? 0
        : (profitLoss / portfolio.totalInvested) * 100;

    res.json({
      totalInvested: portfolio.totalInvested,
      totalCurrentValue: portfolio.totalCurrentValue,
      profitLoss,
      profitLossPercentage
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};