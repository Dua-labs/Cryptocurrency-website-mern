import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchCoin, fetchCoinChart } from '../api/cryptoApi';
import { addToWatchlist } from '../api/watchlistApi';
import { useAuth } from '../context/AuthContext';
import UserSidebar from '../components/userSidebar';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';
import '../assets/dashboard.css';
import '../assets/coinDetail.css';

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

const DAYS_OPTIONS = [
  { label: '1D',  value: 1   },
  { label: '7D',  value: 7   },
  { label: '30D', value: 30  },
  { label: '90D', value: 90  },
  { label: '1Y',  value: 365 },
];

export default function CoinDetailPage() {
  const { coinId } = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();

  const [coin, setCoin]               = useState(null);
  const [chart, setChart]             = useState([]);
  const [days, setDays]               = useState(7);
  const [loading, setLoading]         = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError]             = useState('');
  const [watchMsg, setWatchMsg]       = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchCoin(coinId);
        setCoin(data);
      } catch {
        setError('Failed to load coin data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [coinId]);

  useEffect(() => {
    const loadChart = async () => {
      setChartLoading(true);
      try {
        const data = await fetchCoinChart(coinId, days);
        const points = (data.prices || []).map(([ts, price]) => ({ time: ts, price }));
        setChart(points);
      } catch {
        setChart([]);
      } finally {
        setChartLoading(false);
      }
    };
    loadChart();
  }, [coinId, days]);

  const handleWatch = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      await addToWatchlist({
        coinId: coin.id,
        coinSymbol: coin.symbol?.toUpperCase(),
        coinName: coin.name,
      });
      setWatchMsg('Added to watchlist ✓');
      setTimeout(() => setWatchMsg(''), 3000);
    } catch (e) {
      const msg = e.response?.data?.message || 'Already in watchlist';
      setWatchMsg(msg);
      setTimeout(() => setWatchMsg(''), 3000);
    }
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="cx-shell">
        <UserSidebar />
        <div className="cx-main cd-center">
          <div className="cd-loading">
            <div className="cd-spinner" />
            <span>Loading…</span>
          </div>
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (error || !coin) {
    return (
      <div className="cx-shell">
        <UserSidebar />
        <div className="cx-main cd-center">
          <div className="cd-error">
            <p>{error || 'Coin not found'}</p>
            <button className="cd-back-btn" onClick={() => navigate('/markets')}>
              ← Back to Markets
            </button>
          </div>
        </div>
      </div>
    );
  }

  const price  = coin.market_data?.current_price?.usd;
  const pct24h = coin.market_data?.price_change_percentage_24h;
  const up     = pct24h >= 0;

  return (
    <div className="cx-shell">
      <UserSidebar />

      <div className="cx-main">
        {/* Topbar */}
        <header className="cx-topbar">
          <div className="cd-topbar-left">
            <button className="cd-back-btn" onClick={() => navigate('/markets')}>
              ← Markets
            </button>
            <div className="cd-coin-info">
              <img src={coin.image?.small} alt={coin.name} className="cd-coin-img" />
              <div>
                <div className="cx-page-title" style={{ fontSize: '1.25rem' }}>{coin.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginTop: '.15rem' }}>
                  <span className="cd-coin-sym">{coin.symbol?.toUpperCase()}</span>
                  {coin.market_cap_rank && (
                    <span className="cd-rank">#{coin.market_cap_rank}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="cx-topbar-actions">
            {watchMsg ? (
              <span className="cd-watch-msg">{watchMsg}</span>
            ) : (
              <button className="cx-action-btn" onClick={handleWatch}>☆ Watchlist</button>
            )}
          </div>
        </header>

        <div className="cx-content">

          {/* Price hero */}
          <div className="cd-price-hero">
            <div className="cd-price">{fmt(price)}</div>
            <div className={`cd-pct ${up ? 'up' : 'down'}`}>
              {up ? '▲' : '▼'} {Math.abs(pct24h || 0).toFixed(2)}% (24h)
            </div>
          </div>

          {/* Chart */}
          <div className="cd-chart-panel">
            <div className="cd-chart-controls">
              {DAYS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`cd-days-btn${days === opt.value ? ' active' : ''}`}
                  onClick={() => setDays(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {chartLoading ? (
              <div className="cd-chart-loading"><div className="cd-spinner" /></div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chart} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="#1a2235" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    tickFormatter={(ts) => format(new Date(ts), days <= 1 ? 'HH:mm' : 'MMM d')}
                    tick={{ fill: '#8896b0', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toFixed(2)}`}
                    tick={{ fill: '#8896b0', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{ background: '#0d1117', border: '1px solid #1a2235', borderRadius: 8, fontSize: 13 }}
                    labelFormatter={(ts) => format(new Date(ts), 'MMM d, yyyy HH:mm')}
                    formatter={(v) => [fmt(v), 'Price']}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={up ? '#22d3a0' : '#f43f5e'}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Stats grid */}
          <div className="cd-stats-grid">
            {[
              { label: 'Market Cap',        value: fmtLarge(coin.market_data?.market_cap?.usd) },
              { label: '24h Volume',         value: fmtLarge(coin.market_data?.total_volume?.usd) },
              { label: '24h High',           value: fmt(coin.market_data?.high_24h?.usd) },
              { label: '24h Low',            value: fmt(coin.market_data?.low_24h?.usd) },
              { label: 'All-Time High',      value: fmt(coin.market_data?.ath?.usd) },
              { label: 'Circulating Supply', value: coin.market_data?.circulating_supply
                  ? `${(coin.market_data.circulating_supply / 1e6).toFixed(2)}M ${coin.symbol?.toUpperCase()}`
                  : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="cd-stat-card">
                <div className="cd-stat-label">{label}</div>
                <div className="cd-stat-value">{value}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          {coin.description?.en && (
            <div className="cd-desc-panel">
              <h3 className="cd-desc-title">About {coin.name}</h3>
              <p
                className="cd-desc-text"
                dangerouslySetInnerHTML={{
                  __html: coin.description.en.split('. ').slice(0, 5).join('. ') + '.',
                }}
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
