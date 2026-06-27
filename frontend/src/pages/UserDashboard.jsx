import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserSidebar from '../components/userSidebar';
import useSocketStore from '../store/socketStore';
import api from '../api/axiosConfig';
import { fetchTrending, fetchMarkets } from '../api/cryptoApi';
import '../assets/dashboard.css';

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n || 0);

const fmtPct = (n) => `${n >= 0 ? '+' : ''}${(n || 0).toFixed(2)}%`;

export default function UserDashboard() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const { prices, connect } = useSocketStore();

  const [summary, setSummary]     = useState(null);
  const [trending, setTrending]   = useState([]);
  const [gainers, setGainers]     = useState([]);
  const [losers, setLosers]       = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => { connect(); }, [connect]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [summaryRes, trendingRes, marketsRes] = await Promise.allSettled([
          api.get('/portfolio/summary').then((r) => r.data),
          fetchTrending(),
          fetchMarkets(1, 50),
        ]);

        if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value);
        if (trendingRes.status === 'fulfilled') {
          setTrending(trendingRes.value?.coins?.slice(0, 5) || []);
        }
        if (marketsRes.status === 'fulfilled') {
          const coins = marketsRes.value || [];
          const sorted = [...coins].sort(
            (a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0)
          );
          setGainers(sorted.slice(0, 5));
          setLosers(sorted.slice(-5).reverse());
        }
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  const profitLoss = summary?.profitLoss || 0;
  const pnlPct     = summary?.profitLossPercentage || 0;
  const up         = profitLoss >= 0;

  return (
    <div className="cx-shell">
      <UserSidebar />

      <div className="cx-main">
        <header className="cx-topbar">
          <div>
            <div className="cx-page-title">Dashboard</div>
            <div className="cx-page-sub">
              Good to see you, <span className="cx-highlight">{user?.name}</span>. Here's the pulse of your vault.
            </div>
          </div>
          <div className="cx-topbar-actions">
            <button className="cx-action-btn" onClick={() => navigate('/watchlist')}>☆ Watchlist</button>
            <button className="cx-action-btn" onClick={() => navigate('/transactions')}>◫ Activity</button>
            <button className="cx-refresh-btn" onClick={() => window.location.reload()}>Refresh</button>
          </div>
        </header>

        <div className="cx-content">
          {/* Stats */}
          <div className="cx-stats-row">
            <div className="cx-stat-card">
              <div className="cx-stat-label">Portfolio value</div>
              <div className="cx-stat-value">
                {loading ? '—' : fmt(summary?.totalCurrentValue)}
              </div>
              <div className="cx-stat-sub">
                {loading ? '' : `Invested: ${fmt(summary?.totalInvested)}`}
              </div>
              <div className="cx-sparkline" />
            </div>
            <div className="cx-stat-card">
              <div className="cx-stat-label">Profit / Loss</div>
              <div
                className="cx-stat-value"
                style={{ color: loading ? 'inherit' : up ? 'var(--cx-up)' : 'var(--cx-down)' }}
              >
                {loading ? '—' : `${fmt(profitLoss)} · ${fmtPct(pnlPct)}`}
              </div>
              <div className="cx-stat-sub">All-time unrealised P&amp;L</div>
              <div className="cx-sparkline" />
            </div>
          </div>

          {/* Gainers / Losers */}
          <div className="cx-mid-row">
            <div className="cx-panel">
              <div className="cx-panel-head">
                <span>Top gainers</span>
                <span className="cx-arrow-up">↗</span>
              </div>
              <div className="cx-panel-divider" />
              {loading ? (
                <div className="cx-panel-empty">Loading…</div>
              ) : gainers.length === 0 ? (
                <div className="cx-panel-empty">Waiting for market feed</div>
              ) : (
                gainers.map((c) => (
                  <div
                    key={c.id}
                    className="cx-mover-row"
                    onClick={() => navigate(`/markets/${c.id}`)}
                  >
                    <img src={c.image} alt={c.name} className="cx-mover-img" />
                    <span className="cx-mover-name">{c.name}</span>
                    <span className="cx-mover-pct up">
                      +{(c.price_change_percentage_24h || 0).toFixed(2)}%
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="cx-panel">
              <div className="cx-panel-head">
                <span>Top losers</span>
                <span className="cx-arrow-down">↘</span>
              </div>
              <div className="cx-panel-divider" />
              {loading ? (
                <div className="cx-panel-empty">Loading…</div>
              ) : losers.length === 0 ? (
                <div className="cx-panel-empty">Waiting for market feed</div>
              ) : (
                losers.map((c) => (
                  <div
                    key={c.id}
                    className="cx-mover-row"
                    onClick={() => navigate(`/markets/${c.id}`)}
                  >
                    <img src={c.image} alt={c.name} className="cx-mover-img" />
                    <span className="cx-mover-name">{c.name}</span>
                    <span className="cx-mover-pct down">
                      {(c.price_change_percentage_24h || 0).toFixed(2)}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Trending */}
          <div className="cx-bottom-row">
            <div className="cx-movers-panel">
              <div className="cx-movers-head">
                <div>
                  <div className="cx-movers-title">Market movers</div>
                  <div className="cx-movers-sub">Top 50 coins by market cap · 24h change</div>
                </div>
                <button className="cx-action-btn" onClick={() => navigate('/markets')}>View markets</button>
              </div>
              {loading ? (
                <div className="cx-movers-empty">Loading…</div>
              ) : gainers.length === 0 ? (
                <div className="cx-movers-empty">No market data available.</div>
              ) : (
                <div className="cx-movers-list">
                  {[...gainers, ...losers].map((c) => {
                    const live = prices[c.id];
                    const pct  = live?.usd_24h_change ?? c.price_change_percentage_24h;
                    const up   = pct >= 0;
                    return (
                      <div
                        key={c.id}
                        className="cx-mover-item"
                        onClick={() => navigate(`/markets/${c.id}`)}
                      >
                        <img src={c.image} alt={c.name} className="cx-mover-img" />
                        <span className="cx-mover-name">{c.symbol?.toUpperCase()}</span>
                        <span className={`cx-mover-pct ${up ? 'up' : 'down'}`}>
                          {up ? '+' : ''}{(pct || 0).toFixed(2)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="cx-trending-panel">
              <div className="cx-trending-head">
                <span>Trending</span>
                <span className="cx-trend-icon">⟳</span>
              </div>
              <div className="cx-trending-sub">Momentum coins from CoinGecko</div>
              {loading ? (
                <div className="cx-trending-empty-box">
                  <div className="cx-trend-empty-text">Loading…</div>
                </div>
              ) : trending.length === 0 ? (
                <div className="cx-trending-empty-box">
                  <div className="cx-trend-empty-icon">⟳</div>
                  <div className="cx-trend-empty-title">No trending list yet</div>
                  <div className="cx-trend-empty-text">Check back soon.</div>
                </div>
              ) : (
                <div className="cx-trending-actions">
                  {trending.map((t) => (
                    <button
                      key={t.item.id}
                      className="cx-trend-action-btn"
                      onClick={() => navigate(`/markets/${t.item.id}`)}
                    >
                      <span style={{ marginRight: '.5rem' }}>🔥</span>
                      {t.item.name}
                      <span style={{ marginLeft: 'auto', color: 'var(--cx-sub)', fontSize: '.7rem' }}>
                        #{t.item.market_cap_rank || '—'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
