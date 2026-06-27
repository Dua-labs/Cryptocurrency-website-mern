import { useState, useEffect, useCallback } from 'react';
import { fetchTransactions, createTransaction, deleteTransaction } from '../api/transactionApi';
import UserSidebar from '../components/userSidebar';
import { format } from 'date-fns';
import '../assets/dashboard.css';
import '../assets/transactions.css';

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

const TYPE_COLORS = { buy: 'tx-buy', sell: 'tx-sell', transfer: 'tx-transfer' };

const emptyForm = {
  type: 'buy',
  coinId: '',
  coinSymbol: '',
  coinName: '',
  quantity: '',
  priceAtTransaction: '',
  fee: '',
  notes: '',
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination]     = useState({});
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [page, setPage]                 = useState(1);
  const [typeFilter, setTypeFilter]     = useState('');
  const [showModal, setShowModal]       = useState(false);
  const [form, setForm]                 = useState(emptyForm);
  const [formErr, setFormErr]           = useState('');
  const [submitting, setSubmitting]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 20 };
      if (typeFilter) params.type = typeFilter;
      const res = await fetchTransactions(params);
      setTransactions(res.data);
      setPagination(res.pagination);
    } catch {
      setError('Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErr('');
    if (!form.coinId || !form.coinSymbol || !form.coinName) {
      setFormErr('Coin ID, symbol, and name are required'); return;
    }
    if (!form.quantity || !form.priceAtTransaction) {
      setFormErr('Quantity and price are required'); return;
    }
    setSubmitting(true);
    try {
      await createTransaction({
        ...form,
        quantity: Number(form.quantity),
        priceAtTransaction: Number(form.priceAtTransaction),
        fee: form.fee ? Number(form.fee) : 0,
      });
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (e) {
      setFormErr(e.response?.data?.message || 'Failed to create transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await deleteTransaction(id);
      load();
    } catch {
      alert('Failed to delete transaction');
    }
  };

  return (
    <div className="cx-shell">
      <UserSidebar />
      <div className="cx-main">
        <header className="cx-topbar">
          <div>
            <div className="cx-page-title">Transactions</div>
            <div className="cx-page-sub">Your full buy / sell / transfer history</div>
          </div>
          <div className="cx-topbar-actions">
            <select
              className="tx-filter-select"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            >
              <option value="">All types</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
              <option value="transfer">Transfer</option>
            </select>
            <button className="cx-refresh-btn" onClick={() => setShowModal(true)}>+ Log transaction</button>
          </div>
        </header>

        <div className="cx-content">
          {error && <div className="pf-error">{error}</div>}

          {loading ? (
            <div className="pf-loading"><div className="pf-spinner" /><span>Loading…</span></div>
          ) : transactions.length === 0 ? (
            <div className="pf-empty pf-empty--full">
              <div className="pf-empty-icon">◫</div>
              <div className="pf-empty-title">No transactions yet</div>
              <div className="pf-empty-sub">Log your first buy or sell to get started.</div>
              <button className="cx-refresh-btn" style={{ marginTop: '1rem' }} onClick={() => setShowModal(true)}>
                + Log transaction
              </button>
            </div>
          ) : (
            <>
              <div className="tx-table-wrap">
                <table className="tx-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Asset</th>
                      <th className="tx-right">Qty</th>
                      <th className="tx-right">Price</th>
                      <th className="tx-right">Total</th>
                      <th className="tx-right">Fee</th>
                      <th className="tx-right">Date</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx._id} className="tx-row">
                        <td>
                          <span className={`tx-badge ${TYPE_COLORS[tx.type]}`}>
                            {tx.type.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div className="tx-asset">
                            <span className="tx-coin-name">{tx.coinName}</span>
                            <span className="tx-coin-sym">{tx.coinSymbol}</span>
                          </div>
                        </td>
                        <td className="tx-right tx-mono">{tx.quantity}</td>
                        <td className="tx-right tx-mono">{fmt(tx.priceAtTransaction)}</td>
                        <td className="tx-right tx-mono tx-bold">{fmt(tx.totalValue)}</td>
                        <td className="tx-right tx-mono">{tx.fee ? fmt(tx.fee) : '—'}</td>
                        <td className="tx-right tx-mono tx-muted">
                          {format(new Date(tx.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td>
                          <button
                            className="tx-del-btn"
                            onClick={() => handleDelete(tx._id)}
                            title="Delete"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.pages > 1 && (
                <div className="mk-pagination">
                  <button className="mk-page-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    ← Prev
                  </button>
                  <span className="mk-page-num">Page {page} of {pagination.pages}</span>
                  <button className="mk-page-btn" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="pf-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pf-modal-head">
              <span className="pf-modal-title">Log Transaction</span>
              <button className="pf-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form className="pf-modal-form" onSubmit={handleSubmit}>
              <div className="pf-form-row">
                <div className="pf-field">
                  <label>Type</label>
                  <select name="type" value={form.type} onChange={handleChange} className="pf-select">
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>
              </div>
              <div className="pf-form-row pf-form-row--3">
                <div className="pf-field">
                  <label>Coin ID</label>
                  <input name="coinId" placeholder="bitcoin" value={form.coinId} onChange={handleChange} />
                </div>
                <div className="pf-field">
                  <label>Symbol</label>
                  <input name="coinSymbol" placeholder="BTC" value={form.coinSymbol} onChange={handleChange} />
                </div>
                <div className="pf-field">
                  <label>Name</label>
                  <input name="coinName" placeholder="Bitcoin" value={form.coinName} onChange={handleChange} />
                </div>
              </div>
              <div className="pf-form-row pf-form-row--3">
                <div className="pf-field">
                  <label>Quantity</label>
                  <input name="quantity" type="number" step="any" min="0" placeholder="0.5" value={form.quantity} onChange={handleChange} />
                </div>
                <div className="pf-field">
                  <label>Price (USD)</label>
                  <input name="priceAtTransaction" type="number" step="any" min="0" placeholder="60000" value={form.priceAtTransaction} onChange={handleChange} />
                </div>
                <div className="pf-field">
                  <label>Fee (USD)</label>
                  <input name="fee" type="number" step="any" min="0" placeholder="0" value={form.fee} onChange={handleChange} />
                </div>
              </div>
              <div className="pf-field">
                <label>Notes (optional)</label>
                <input name="notes" placeholder="e.g. DCA purchase" value={form.notes} onChange={handleChange} />
              </div>
              {form.quantity && form.priceAtTransaction && (
                <div className="pf-preview">
                  <span>Total: <strong>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                      Number(form.quantity) * Number(form.priceAtTransaction)
                    )}
                  </strong></span>
                </div>
              )}
              {formErr && <div className="pf-form-err">{formErr}</div>}
              <div className="pf-modal-actions">
                <button type="button" className="cx-action-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="cx-refresh-btn" disabled={submitting}>
                  {submitting ? 'Saving…' : 'Log transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
