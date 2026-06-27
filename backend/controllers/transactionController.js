const Transaction = require('../models/Transaction');

// GET /api/transactions?page=1&limit=20&type=buy&coinId=bitcoin
exports.getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, coinId } = req.query;
    const filter = { user: req.user.id };
    if (type) filter.type = type;
    if (coinId) filter.coinId = coinId;

    const skip = (Number(page) - 1) * Number(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/transactions
exports.createTransaction = async (req, res, next) => {
  try {
    const { type, coinId, coinSymbol, coinName, quantity, priceAtTransaction, fee, notes } =
      req.body;

    if (!type || !coinId || !coinSymbol || !coinName || !quantity || !priceAtTransaction) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const totalValue = Number(quantity) * Number(priceAtTransaction);

    const transaction = await Transaction.create({
      user: req.user.id,
      type,
      coinId,
      coinSymbol,
      coinName,
      quantity: Number(quantity),
      priceAtTransaction: Number(priceAtTransaction),
      totalValue,
      fee: fee ? Number(fee) : 0,
      notes: notes || '',
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
};

// GET /api/transactions/:id
exports.getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/transactions/:id
exports.deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    next(err);
  }
};
