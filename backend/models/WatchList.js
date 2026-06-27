const mongoose = require('mongoose');

const coinEntrySchema = new mongoose.Schema(
  {
    coinId: { type: String, required: true },
    coinSymbol: { type: String, required: true },
    coinName: { type: String, required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const watchListSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one watchlist per user
    },
    coins: [coinEntrySchema],
  },
  { timestamps: { updatedAt: true, createdAt: false }, versionKey: false }
);

module.exports = mongoose.model('WatchList', watchListSchema);
