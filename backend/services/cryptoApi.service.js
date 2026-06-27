const axios = require('axios');
const PriceCache = require('../models/PriceCache');

const BASE_URL =
  process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';

// Build axios instance — attach API key if provided
const cgClient = axios.create({ baseURL: BASE_URL, timeout: 10000 });
cgClient.interceptors.request.use((config) => {
  const key = process.env.COINGECKO_API_KEY;
  if (key) config.headers['x-cg-demo-api-key'] = key;
  return config;
});

/**
 * Fetch with MongoDB cache.
 * @param {string} cacheKey  - unique key for this request
 * @param {Function} fetcher - async fn that returns data
 * @param {number} ttlSeconds - cache TTL (default 60 s)
 */
const withCache = async (cacheKey, fetcher, ttlSeconds = 60) => {
  const cached = await PriceCache.findOne({ cacheKey });
  if (cached) return cached.data;

  const data = await fetcher();
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  await PriceCache.findOneAndUpdate(
    { cacheKey },
    { data, expiresAt },
    { upsert: true, new: true }
  );

  return data;
};

// ── Public API helpers ──────────────────────────────────────────────────────

/** Top coins by market cap */
const getMarkets = (page = 1, perPage = 50, currency = 'usd') =>
  withCache(
    `markets:${currency}:${page}:${perPage}`,
    async () => {
      const { data } = await cgClient.get('/coins/markets', {
        params: {
          vs_currency: currency,
          order: 'market_cap_desc',
          per_page: perPage,
          page,
          sparkline: false,
          price_change_percentage: '24h',
        },
      });
      return data;
    },
    60 // 1 min cache
  );

/** Single coin detail */
const getCoinDetail = (coinId) =>
  withCache(
    `coin:${coinId}`,
    async () => {
      const { data } = await cgClient.get(`/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: false,
          community_data: false,
          developer_data: false,
        },
      });
      return data;
    },
    120 // 2 min cache
  );

/** Price history chart */
const getCoinChart = (coinId, days = 7, currency = 'usd') =>
  withCache(
    `chart:${coinId}:${days}:${currency}`,
    async () => {
      const { data } = await cgClient.get(`/coins/${coinId}/market_chart`, {
        params: { vs_currency: currency, days },
      });
      return data;
    },
    300 // 5 min cache
  );

/** Search coins */
const searchCoins = (query) =>
  withCache(
    `search:${query.toLowerCase()}`,
    async () => {
      const { data } = await cgClient.get('/search', { params: { query } });
      return data;
    },
    300
  );

/** Global market data */
const getGlobal = () =>
  withCache(
    'global',
    async () => {
      const { data } = await cgClient.get('/global');
      return data;
    },
    120
  );

/** Trending coins */
const getTrending = () =>
  withCache(
    'trending',
    async () => {
      const { data } = await cgClient.get('/search/trending');
      return data;
    },
    300
  );

/** Simple prices for a list of coin IDs */
const getSimplePrices = (ids) =>
  cgClient
    .get('/simple/price', {
      params: {
        ids: ids.join(','),
        vs_currencies: 'usd',
        include_24hr_change: true,
      },
    })
    .then((r) => r.data);

module.exports = {
  getMarkets,
  getCoinDetail,
  getCoinChart,
  searchCoins,
  getGlobal,
  getTrending,
  getSimplePrices,
};
