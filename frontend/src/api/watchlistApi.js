import api from './axiosConfig';

export const fetchWatchlist = () =>
  api.get('/watchlist').then((r) => r.data.data);

export const addToWatchlist = (coin) =>
  api.post('/watchlist/coin', coin).then((r) => r.data.data);

export const removeFromWatchlist = (coinId) =>
  api.delete(`/watchlist/coin/${coinId}`).then((r) => r.data.data);
