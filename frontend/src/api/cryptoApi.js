import api from './axiosConfig';

export const fetchMarkets = (page = 1, perPage = 50, currency = 'usd') =>
  api.get('/crypto/markets', { params: { page, per_page: perPage, currency } }).then((r) => r.data.data);

export const fetchCoin = (coinId) =>
  api.get(`/crypto/coin/${coinId}`).then((r) => r.data.data);

export const fetchCoinChart = (coinId, days = 7, currency = 'usd') =>
  api.get(`/crypto/coin/${coinId}/chart`, { params: { days, currency } }).then((r) => r.data.data);

export const fetchSearch = (q) =>
  api.get('/crypto/search', { params: { q } }).then((r) => r.data.data);

export const fetchGlobal = () =>
  api.get('/crypto/global').then((r) => r.data.data);

export const fetchTrending = () =>
  api.get('/crypto/trending').then((r) => r.data.data);
