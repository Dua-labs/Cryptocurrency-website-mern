import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMarkets, fetchSearch } from '../api/cryptoApi';
import useSocketStore from '../store/socketStore';
import UserSidebar from '../components/userSidebar';
import { useAuth } from '../context/AuthContext';
import '../assets/dashboard.css';
import '../assets/markets.css';

const fmt = (n) =>
  n == null
    ? '—'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

const fmtLarge = (n) => {
  if (n == null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return fmt(n);
};

const fmtPct = (n) => {
  if (n == null) return '—';
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
};

export default function MarketsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { prices, connect } = useSocketStore();

  const [coins, setCoins]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [page, setPage]         = useState(1);
  const [query, setQuery]       = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => { connect(); }, [connect]);

  const loadMarkets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchMarkets(page, 50);
      setCoins(data);
    } catch {
      setError('Failed to load market data. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadMarkets(); }, [loadMarkets]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setSearchResults(null); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await fetchSearch(query.trim());
        setSearchResults(data.coins?.slice(0, 20) || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const displayCoins = searchResults
    ? searchResults.map((c) => ({
        id: c.id,
        name: c.name,
        symbol: c.symbol,
        image: c.large || c.thumb,
        current_price: null,
        price_change_percentage_24h: null,
        market_cap: null,
        total_volume: null,
      }))
    : coins;

  // Merge live socket prices
  const enriched = displayCoins.map((c) => {
    const live = prices[c.id];
    return {
      ...c,
      current_price: live?.usd ?? c.current_price,
      price_change_percentage_24h: live?.usd_24h_change ?? c.price_change_percentage_24h,
    };
  });

  return (
    <div className="cx-shell">
      {user && <UserSidebar />}

      <div className="cx-main">
        <header className="cx-topbar">
          <div>
            <div className="cx-page-title">Markets</div>
            <div className="cx-page-sub">Live prices powered by CoinGecko</div>
          </div>
          <div className="cx-topbar-actions">
            <div className="mk-search-wrap">
              <span className="mk-search-icon">⌕</span>
              <input
                className="mk-search"
                type="text"
                placeholder="Search coins…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {searching && <span className="mk-search-spin" />}
            </div>
            <button className="cx-refresh-btn" onClick={() => { setPage(1); loadMarkets(); }}>
              Refresh
            </button>
          </div>
        </header>

        <div className="cx-content">
          {error && <div className="mk-error">{error}</div>}

          {loading && !coins.length ? (
            <div className="mk-loading">
              <div className="mk-spinner" />
              <span>Loading market data…</span>
            </div>
          ) : (
            <>
              <div className="mk-table-wrap">
                <table className="mk-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Asset</th>
                      <th className="mk-right">Price</th>
                      <th className="mk-right">24h %</th>
                      <th className="mk-right mk-hide-sm">Market Cap</th>
                      <th className="mk-right mk-hide-sm">Volume (24h)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enriched.map((coin, i) => {
                      const pct = coin.price_change_percentage_24h;
                      const up  = pct >= 0;
                      return (
                        <tr
                          key={coin.id}
                          className="mk-row"
                          onClick={() => navigate(`/markets/${coin.id}`)}
                        >
                          <td className="mk-rank">{searchResults ? '—' : (page - 1) * 50 + i + 1}</td>
                          <td>
                            <div className="mk-asset">
                              {coin.image ? (
                                <img src={coin.image} alt={coin.name} className="mk-coin-img" />
                              ) : (
                                <div className="mk-coin-placeholder">{coin.symbol?.[0]?.toUpperCase()}</div>
                              )}
                              <div>
                                <div className="mk-coin-name">{coin.name}</div>
                                <div className="mk-coin-sym">{coin.symbol?.toUpperCase()}</div>
                              </div>
                            </div>
                          </td>
                          <td className="mk-right mk-mono mk-bold">
                            {coin.current_price != null ? fmt(coin.current_price) : '—'}
                          </td>
                          <td className={`mk-right mk-mono mk-bold ${pct == null ? '' : up ? 'mk-up' : 'mk-down'}`}>
                            {fmtPct(pct)}
                          </td>
                          <td className="mk-right mk-mono mk-hide-sm">{fmtLarge(coin.market_cap)}</td>
                          <td className="mk-right mk-mono mk-hide-sm">{fmtLarge(coin.total_volume)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {!searchResults && (
                <div className="mk-pagination">
                  <button
                    className="mk-page-btn"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    ← Prev
                  </button>
                  <span className="mk-page-num">Page {page}</span>
                  <button
                    className="mk-page-btn"
                    disabled={enriched.length < 50}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
