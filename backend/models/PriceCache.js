const mongoose = require('mongoose');

const priceCacheSchema = new mongoose.Schema(
  {
    cacheKey: { type: String, required: true, unique: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { versionKey: false }
);

module.exports = mongoose.model('PriceCache', priceCacheSchema);
