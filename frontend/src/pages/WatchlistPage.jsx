import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWatchlist, removeFromWatchlist } from '../api/watchlistApi';
import useSocketStore from '../store/socketStore';
import UserSidebar from '../components/userSidebar';
import '../assets/dashboard.css';
import '../assets/markets.css';

const fmt = (n) =>
  n == null
    ? '—'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

export default function WatchlistPage() {
  const navigate = useNavigate();
  const { prices, connect } = useSocketStore();

  const [coins, setCoins]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => { connect(); }, [connect]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchWatchlist();
      setCoins(data.coins || []);
    } catch {
      setError('Failed to load watchlist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRemove = async (coinId) => {
    try {
      const updated = await removeFromWatchlist(coinId);
      setCoins(updated.coins || []);
    } catch {
      alert('Failed to remove coin');
    }
  };

  return (
    <div className="cx-shell">
      <UserSidebar />
      <div className="cx-main">
        <header className="cx-topbar">
          <div>
            <div className="cx-page-title">Watchlist</div>
            <div className="cx-page-sub">Track coins you care about</div>
          </div>
          <div className="cx-topbar-actions">
            <button className="cx-action-btn" onClick={() => navigate('/markets')}>+ Add coins</button>
            <button className="cx-refresh-btn" onClick={load}>Refresh</button>
          </div>
        </header>

        <div className="cx-content">
          {error && <div className="pf-error">{error}</div>}

          {loading ? (
            <div className="pf-loading"><div className="pf-spinner" /><span>Loading…</span></div>
          ) : coins.length === 0 ? (
            <div className="pf-empty pf-empty--full">
              <div className="pf-empty-icon">☆</div>
              <div className="pf-empty-title">Your watchlist is empty</div>
              <div className="pf-empty-sub">Browse markets and click ☆ Watchlist on any coin to add it here.</div>
              <button className="cx-refresh-btn" style={{ marginTop: '1rem' }} onClick={() => navigate('/markets')}>
                Browse Markets
              </button>
            </div>
          ) : (
            <div className="mk-table-wrap">
              <table className="mk-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th className="mk-right">Live Price</th>
                    <th className="mk-right">24h %</th>
                    <th className="mk-right">Added</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {coins.map((coin) => {
                    const live = prices[coin.coinId];
                    const pct  = live?.usd_24h_change;
                    const up   = pct >= 0;
                    return (
                      <tr
                        key={coin.coinId}
                        className="mk-row"
                        onClick={() => navigate(`/markets/${coin.coinId}`)}
                      >
                        <td>
                          <div className="mk-asset">
                            <div className="mk-coin-placeholder">{coin.coinSymbol?.[0]}</div>
                            <div>
                              <div className="mk-coin-name">{coin.coinName}</div>
                              <div className="mk-coin-sym">{coin.coinSymbol}</div>
                            </div>
                          </div>
                        </td>
                        <td className="mk-right mk-mono mk-bold">
                          {live ? fmt(live.usd) : '—'}
                        </td>
                        <td className={`mk-right mk-mono mk-bold ${pct == null ? '' : up ? 'mk-up' : 'mk-down'}`}>
                          {pct != null ? `${up ? '+' : ''}${pct.toFixed(2)}%` : '—'}
                        </td>
                        <td className="mk-right mk-mono" style={{ color: 'var(--cx-sub)', fontSize: '.75rem' }}>
                          {new Date(coin.addedAt).toLocaleDateString()}
                        </td>
                        <td>
                          <button
                            className="tx-del-btn"
                            onClick={(e) => { e.stopPropagation(); handleRemove(coin.coinId); }}
                            title="Remove"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
