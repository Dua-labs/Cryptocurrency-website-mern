const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['buy', 'sell', 'transfer'],
      required: true,
    },
    coinId: { type: String, required: true },
    coinSymbol: { type: String, required: true },
    coinName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    priceAtTransaction: { type: Number, required: true, min: 0 },
    totalValue: { type: Number, required: true },
    fee: { type: Number, default: 0 },
    notes: { type: String, default: '' },
  },
  { timestamps: true, versionKey: false }
);

// Compound index for efficient user + date queries
transactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
