import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import UserSidebar from '../components/UserSidebar';
import '../assets/dashboard.css';
import '../assets/portfolio.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const COIN_PRESETS = [
  { coinId: 'bitcoin',  coinSymbol: 'BTC', coinName: 'Bitcoin',  icon: '₿' },
  { coinId: 'ethereum', coinSymbol: 'ETH', coinName: 'Ethereum', icon: 'Ξ' },
  { coinId: 'solana',   coinSymbol: 'SOL', coinName: 'Solana',   icon: '◎' },
  { coinId: 'bnb',      coinSymbol: 'BNB', coinName: 'BNB',      icon: '⬡' },
  { coinId: 'xrp',      coinSymbol: 'XRP', coinName: 'XRP',      icon: '✕' },
  { coinId: 'other',    coinSymbol: '',    coinName: '',          icon: '◈' },
];

const COIN_ICONS = {
  bitcoin: '₿', ethereum: 'Ξ', solana: '◎', bnb: '⬡', xrp: '✕',
};

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

const fmtPct = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

export default function PortfolioPage() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr]     = useState('');

  // confirm-delete modal state
  const [confirmTarget, setConfirmTarget] = useState(null); // { coinId, coinName }
  const [deleting, setDeleting]           = useState(false);
  const [deleteErr, setDeleteErr]         = useState('');

  const emptyForm = { coinId: 'bitcoin', coinSymbol: 'BTC', coinName: 'Bitcoin', quantity: '', avgBuyPrice: '', currentPrice: '' };
  const [form, setForm] = useState(emptyForm);

  /* ── fetch portfolio ── */
  const fetchPortfolio = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/portfolio`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load portfolio');
      setPortfolio(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPortfolio(); }, []);

  /* ── form helpers ── */
  const handlePreset = (preset) => {
    if (preset.coinId === 'other') {
      setForm((p) => ({ ...p, coinId: '', coinSymbol: '', coinName: '' }));
    } else {
      setForm((p) => ({ ...p, coinId: preset.coinId, coinSymbol: preset.coinSymbol, coinName: preset.coinName }));
    }
  };

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  /* ── add holding ── */
  const handleAdd = async (e) => {
    e.preventDefault();
    setFormErr('');
    if (!form.coinId || !form.coinSymbol || !form.coinName) {
      setFormErr('Please fill in all coin details'); return;
    }
    if (!form.quantity || !form.avgBuyPrice || !form.currentPrice) {
      setFormErr('Quantity and prices are required'); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/portfolio/holding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          coinId:       form.coinId,
          coinSymbol:   form.coinSymbol.toUpperCase(),
          coinName:     form.coinName,
          quantity:     Number(form.quantity),
          avgBuyPrice:  Number(form.avgBuyPrice),
          currentPrice: Number(form.currentPrice),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add holding');
      setPortfolio(data);
      setShowModal(false);
      setForm(emptyForm);
    } catch (e) {
      setFormErr(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── delete holding ── */
  const confirmDelete = (coinId, coinName) => {
    setDeleteErr('');
    setConfirmTarget({ coinId, coinName });
  };

  const handleDelete = async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    setDeleteErr('');
    try {
      const res = await fetch(`${API}/portfolio/holding/${confirmTarget.coinId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete holding');
      setPortfolio(data.portfolio);
      setConfirmTarget(null);
    } catch (e) {
      setDeleteErr(e.message);
    } finally {
      setDeleting(false);
    }
  };

  /* ── derived ── */
  const pnl     = portfolio?.profitLoss ?? 0;
  const pnlPct  = portfolio?.profitLossPercentage ?? 0;
  const pnlUp   = pnl >= 0;

  return (
    <div className="cx-shell">
      <UserSidebar />

      <div className="cx-main">
        {/* Topbar */}
        <header className="cx-topbar">
          <div>
            <div className="cx-page-title">Portfolio</div>
            <div className="cx-page-sub">
              Track your holdings · <span className="cx-highlight">{user?.name}</span>
            </div>
          </div>
          <div className="cx-topbar-actions">
            <button className="cx-action-btn" onClick={fetchPortfolio}>↺ Refresh</button>
            <button className="cx-refresh-btn" onClick={() => setShowModal(true)}>+ Add holding</button>
          </div>
        </header>

        <div className="cx-content">

          {/* ── Loading ── */}
          {loading && (
            <div className="pf-loading">
              <div className="pf-spinner" />
              <span>Loading portfolio…</span>
            </div>
          )}

          {/* ── Error ── */}
          {!loading && error && (
            <div className="pf-error">
              <span>⚠ {error}</span>
              <button className="cx-action-btn" onClick={fetchPortfolio}>Retry</button>
            </div>
          )}

          {/* ── Portfolio data ── */}
          {!loading && !error && portfolio && (
            <>
              {/* Summary cards */}
              <div className="pf-summary-row">
                <div className="pf-summary-card pf-summary-card--main">
                  <div className="pf-sum-label">Total value</div>
                  <div className="pf-sum-value">{fmt(portfolio.totalCurrentValue)}</div>
                  <div className="pf-sum-sub">
                    {portfolio.holdings?.length ?? 0} holding{portfolio.holdings?.length !== 1 ? 's' : ''} · Aggregated USD
                  </div>
                  <div className="pf-sum-glow" />
                </div>

                <div className="pf-summary-card">
                  <div className="pf-sum-label">Total invested</div>
                  <div className="pf-sum-value">{fmt(portfolio.totalInvested)}</div>
                  <div className="pf-sum-sub">Cost basis</div>
                </div>

                <div className={`pf-summary-card pf-summary-card--pnl ${pnlUp ? 'up' : 'down'}`}>
                  <div className="pf-sum-label">Profit / Loss</div>
                  <div className="pf-sum-value pf-pnl-value">
                    {fmt(Math.abs(pnl))}
                  </div>
                  <div className={`pf-pnl-badge ${pnlUp ? 'up' : 'down'}`}>
                    {pnlUp ? '↗' : '↘'} {fmtPct(pnlPct)}
                  </div>
                </div>
              </div>

              {/* Holdings table */}
              <div className="pf-holdings-panel">
                <div className="pf-holdings-head">
                  <div className="pf-holdings-title">Holdings</div>
                  <div className="pf-holdings-updated">
                    Updated {new Date(portfolio.updatedAt).toLocaleString()}
                  </div>
                </div>

                {portfolio.holdingsWithValue?.length === 0 ? (
                  <div className="pf-empty">
                    <div className="pf-empty-icon">◈</div>
                    <div className="pf-empty-title">No holdings yet</div>
                    <div className="pf-empty-sub">Click "Add holding" to start tracking your portfolio.</div>
                  </div>
                ) : (
                  <div className="pf-table-wrap">
                    <table className="pf-table">
                      <thead>
                        <tr>
                          <th>Asset</th>
                          <th className="pf-right">Qty</th>
                          <th className="pf-right">Avg buy</th>
                          <th className="pf-right">Current</th>
                          <th className="pf-right">Value</th>
                          <th className="pf-right">P / L</th>
                          <th className="pf-right">Allocation</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {portfolio.holdingsWithValue.map((h) => {
                          const cost    = h.quantity * h.avgBuyPrice;
                          const pl      = h.value - cost;
                          const plPct   = cost > 0 ? (pl / cost) * 100 : 0;
                          const alloc   = portfolio.totalCurrentValue > 0
                            ? (h.value / portfolio.totalCurrentValue) * 100
                            : 0;
                          const isUp    = pl >= 0;
                          const icon    = COIN_ICONS[h.coinId] ?? '◈';

                          return (
                            <tr key={h.coinId} className="pf-row">
                              <td>
                                <div className="pf-asset-cell">
                                  <div className="pf-coin-icon">{icon}</div>
                                  <div>
                                    <div className="pf-coin-name">{h.coinName}</div>
                                    <div className="pf-coin-symbol">{h.coinSymbol}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="pf-right pf-mono">{h.quantity}</td>
                              <td className="pf-right pf-mono">{fmt(h.avgBuyPrice)}</td>
                              <td className="pf-right pf-mono">{fmt(h.currentPrice)}</td>
                              <td className="pf-right pf-mono pf-bold">{fmt(h.value)}</td>
                              <td className="pf-right">
                                <div className={`pf-pl-cell ${isUp ? 'up' : 'down'}`}>
                                  <span className="pf-mono">{fmt(Math.abs(pl))}</span>
                                  <span className="pf-pl-pct">{fmtPct(plPct)}</span>
                                </div>
                              </td>
                              <td className="pf-right">
                                <div className="pf-alloc-cell">
                                  <span className="pf-mono">{alloc.toFixed(1)}%</span>
                                  <div className="pf-alloc-bar">
                                    <div className="pf-alloc-fill" style={{ width: `${alloc}%` }} />
                                  </div>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="pf-delete-btn"
                                  onClick={() => confirmDelete(h.coinId, h.coinName)}
                                  title={`Remove ${h.coinName}`}
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
            </>
          )}

          {/* ── Empty state (no portfolio yet) ── */}
          {!loading && !error && !portfolio && (
            <div className="pf-empty pf-empty--full">
              <div className="pf-empty-icon">◈</div>
              <div className="pf-empty-title">No portfolio found</div>
              <div className="pf-empty-sub">Add your first holding to create your portfolio.</div>
              <button className="cx-refresh-btn" style={{ marginTop: '1.25rem' }} onClick={() => setShowModal(true)}>
                + Add holding
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Add Holding Modal ── */}
      {showModal && (
        <div className="pf-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pf-modal-head">
              <div className="pf-modal-title">Add holding</div>
              <button className="pf-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {/* Coin presets */}
            <div className="pf-presets">
              {COIN_PRESETS.map((p) => (
                <button
                  key={p.coinId}
                  className={`pf-preset-btn ${form.coinId === p.coinId ? 'active' : ''}`}
                  onClick={() => handlePreset(p)}
                  type="button"
                >
                  <span className="pf-preset-icon">{p.icon}</span>
                  <span>{p.coinId === 'other' ? 'Other' : p.coinSymbol}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleAdd} className="pf-modal-form">
              {/* Custom coin fields (shown when Other) */}
              {(form.coinId === '' || !COIN_PRESETS.slice(0, -1).find(p => p.coinId === form.coinId)) && (
                <div className="pf-form-row pf-form-row--3">
                  <div className="pf-field">
                    <label>Coin ID</label>
                    <input name="coinId" value={form.coinId} onChange={handleChange} placeholder="e.g. cardano" />
                  </div>
                  <div className="pf-field">
                    <label>Symbol</label>
                    <input name="coinSymbol" value={form.coinSymbol} onChange={handleChange} placeholder="ADA" />
                  </div>
                  <div className="pf-field">
                    <label>Name</label>
                    <input name="coinName" value={form.coinName} onChange={handleChange} placeholder="Cardano" />
                  </div>
                </div>
              )}

              <div className="pf-form-row pf-form-row--3">
                <div className="pf-field">
                  <label>Quantity</label>
                  <input name="quantity" type="number" min="0" step="any" value={form.quantity} onChange={handleChange} placeholder="0.00" />
                </div>
                <div className="pf-field">
                  <label>Avg buy price (USD)</label>
                  <input name="avgBuyPrice" type="number" min="0" step="any" value={form.avgBuyPrice} onChange={handleChange} placeholder="0.00" />
                </div>
                <div className="pf-field">
                  <label>Current price (USD)</label>
                  <input name="currentPrice" type="number" min="0" step="any" value={form.currentPrice} onChange={handleChange} placeholder="0.00" />
                </div>
              </div>

              {/* Preview */}
              {form.quantity && form.avgBuyPrice && form.currentPrice && (
                <div className="pf-preview">
                  <span>Value: <strong>{fmt(Number(form.quantity) * Number(form.currentPrice))}</strong></span>
                  <span>Cost: <strong>{fmt(Number(form.quantity) * Number(form.avgBuyPrice))}</strong></span>
                  <span className={Number(form.currentPrice) >= Number(form.avgBuyPrice) ? 'up' : 'down'}>
                    P/L: <strong>{fmt((Number(form.currentPrice) - Number(form.avgBuyPrice)) * Number(form.quantity))}</strong>
                  </span>
                </div>
              )}

              {formErr && <div className="pf-form-err">⚠ {formErr}</div>}

              <div className="pf-modal-actions">
                <button type="button" className="cx-action-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="cx-refresh-btn" disabled={submitting}>
                  {submitting ? 'Adding…' : 'Add holding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── Confirm Delete Modal ── */}
      {confirmTarget && (
        <div className="pf-modal-overlay" onClick={() => !deleting && setConfirmTarget(null)}>
          <div className="pf-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pf-confirm-icon">🗑</div>
            <div className="pf-confirm-title">Remove holding</div>
            <div className="pf-confirm-body">
              Are you sure you want to remove{' '}
              <strong>{confirmTarget.coinName}</strong> from your portfolio?
              <br />
              <span className="pf-confirm-sub">This action cannot be undone.</span>
            </div>
            {deleteErr && <div className="pf-form-err">⚠ {deleteErr}</div>}
            <div className="pf-confirm-actions">
              <button
                className="cx-action-btn"
                onClick={() => setConfirmTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="pf-confirm-delete-btn"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Removing…' : 'Yes, remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}