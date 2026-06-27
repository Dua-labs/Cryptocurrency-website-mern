const mongoose = require("mongoose");

const holdingSchema = new mongoose.Schema({
  coinId: {
    type: String,
    required: true
  },
  coinSymbol: {
    type: String,
    required: true
  },
  coinName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  avgBuyPrice: {
    type: Number,
    required: true
  },
  currentPrice: {
    type: Number,
    required: true
  }
}, { _id: false });

const portfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  holdings: [holdingSchema],
  totalInvested: {
    type: Number,
    default: 0
  },
  totalCurrentValue: {
    type: Number,
    default: 0
  }
}, { timestamps: { updatedAt: true, createdAt: false } });


// 🔹 Virtual: value (per holding)
portfolioSchema.virtual("holdingsWithValue").get(function () {
  return this.holdings.map(h => ({
    ...h.toObject(),
    value: h.quantity * h.currentPrice
  }));
});


// 🔹 Virtual: profit/loss
portfolioSchema.virtual("profitLoss").get(function () {
  return this.totalCurrentValue - this.totalInvested;
});


// 🔹 Virtual: profit/loss %
portfolioSchema.virtual("profitLossPercentage").get(function () {
  if (this.totalInvested === 0) return 0;
  return ((this.totalCurrentValue - this.totalInvested) / this.totalInvested) * 100;
});


// Important: virtuals ko JSON me show karne ke liye
portfolioSchema.set("toJSON", { virtuals: true });
portfolioSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Portfolio", portfolioSchema);