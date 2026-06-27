import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAdminStats, fetchAdminUsers, updateUserRole, deleteAdminUser } from '../api/adminApi';
import UserSidebar from '../components/userSidebar';
import '../assets/dashboard.css';

export default function AdminDashboard() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [stats, setStats]     = useState(null);
  const [users, setUsers]     = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    fetchAdminStats()
      .then(setStats)
      .catch(() => setError('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setUsersLoading(true);
    fetchAdminUsers(page)
      .then((res) => { setUsers(res.data); setPagination(res.pagination); })
      .catch(() => setError('Failed to load users'))
      .finally(() => setUsersLoading(false));
  }, [page]);

  const handleRoleToggle = async (u) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change ${u.name}'s role to ${newRole}?`)) return;
    try {
      const updated = await updateUserRole(u._id, newRole);
      setUsers((prev) => prev.map((x) => (x._id === u._id ? updated : x)));
    } catch {
      alert('Failed to update role');
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete user ${u.name}? This cannot be undone.`)) return;
    try {
      await deleteAdminUser(u._id);
      setUsers((prev) => prev.filter((x) => x._id !== u._id));
      if (stats) setStats((s) => ({ ...s, totalUsers: s.totalUsers - 1 }));
    } catch {
      alert('Failed to delete user');
    }
  };

  return (
    <div className="cx-shell cx-admin">
      <UserSidebar />

      <div className="cx-main">
        <header className="cx-topbar">
          <div>
            <div className="cx-page-title">Admin Panel</div>
            <div className="cx-page-sub">
              Signed in as <span className="cx-highlight">{user?.name}</span> · Administrator
            </div>
          </div>
          <div className="cx-topbar-actions">
            <button className="cx-refresh-btn" onClick={() => window.location.reload()}>Refresh</button>
          </div>
        </header>

        <div className="cx-content">
          {error && <div className="pf-error">{error}</div>}

          {/* Stats */}
          <div className="cx-admin-stats">
            {[
              { label: 'Total Users',    value: loading ? '—' : stats?.totalUsers },
              { label: 'Regular Users',  value: loading ? '—' : stats?.regularUsers },
              { label: 'Admins',         value: loading ? '—' : stats?.adminCount },
              { label: 'Transactions',   value: loading ? '—' : stats?.totalTransactions },
            ].map(({ label, value }) => (
              <div key={label} className="cx-admin-stat-card">
                <div className="cx-stat-label">{label}</div>
                <div className="cx-stat-value cx-stat-value--admin">{value}</div>
              </div>
            ))}
          </div>

          {/* User management table */}
          <div className="pf-holdings-panel">
            <div className="pf-holdings-head">
              <span className="pf-holdings-title">User Management</span>
              <span className="pf-holdings-updated">
                {pagination.total ? `${pagination.total} total users` : ''}
              </span>
            </div>

            {usersLoading ? (
              <div className="pf-loading"><div className="pf-spinner" /><span>Loading users…</span></div>
            ) : (
              <div className="pf-table-wrap">
                <table className="pf-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th className="pf-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="pf-row">
                        <td className="pf-bold">{u.name}</td>
                        <td className="pf-mono" style={{ color: 'var(--cx-muted)', fontSize: '.8rem' }}>{u.email}</td>
                        <td>
                          <span
                            style={{
                              padding: '.2rem .6rem',
                              borderRadius: '999px',
                              fontSize: '.72rem',
                              fontWeight: 700,
                              background: u.role === 'admin' ? 'rgba(245,158,11,.15)' : 'rgba(59,127,255,.12)',
                              color: u.role === 'admin' ? 'var(--cx-admin)' : 'var(--cx-accent)',
                            }}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="pf-mono" style={{ color: 'var(--cx-sub)', fontSize: '.75rem' }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="pf-right">
                          <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
                            {u._id !== user?._id && (
                              <>
                                <button
                                  className="cx-action-btn"
                                  style={{ fontSize: '.72rem', padding: '.3rem .65rem' }}
                                  onClick={() => handleRoleToggle(u)}
                                >
                                  {u.role === 'admin' ? 'Make user' : 'Make admin'}
                                </button>
                                <button
                                  className="tx-del-btn"
                                  onClick={() => handleDelete(u)}
                                  title="Delete user"
                                >
                                  ✕
                                </button>
                              </>
                            )}
                            {u._id === user?._id && (
                              <span style={{ fontSize: '.72rem', color: 'var(--cx-sub)' }}>You</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {pagination.pages > 1 && (
              <div className="mk-pagination" style={{ padding: '1rem 1.5rem' }}>
                <button className="mk-page-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
                <span className="mk-page-num">Page {page} of {pagination.pages}</span>
                <button className="mk-page-btn" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
