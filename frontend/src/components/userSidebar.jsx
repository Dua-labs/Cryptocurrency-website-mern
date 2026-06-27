import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const USER_NAV = [
  { label: 'Dashboard',    icon: '▣', to: '/dashboard' },
  { label: 'Portfolio',    icon: '◈', to: '/portfolio' },
  { label: 'Markets',      icon: '◉', to: '/markets' },
  { label: 'Watchlist',    icon: '☆', to: '/watchlist' },
  { label: 'Transactions', icon: '◫', to: '/transactions' },
  { label: 'Settings',     icon: '⚙', to: '/settings' },
];

const ADMIN_NAV = [
  { label: 'Admin Panel', icon: '🛡', to: '/admin' },
  { label: 'Markets',     icon: '◉', to: '/markets' },
  { label: 'Settings',    icon: '⚙', to: '/settings' },
];

export default function UserSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin  = user?.role === 'admin';
  const navItems = isAdmin ? ADMIN_NAV : USER_NAV;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className={`cx-sidebar${isAdmin ? ' cx-admin' : ''}`}>
      {/* Brand */}
      <div className="cx-brand">
        <span className="cx-brand-icon">⬡</span>
        <div>
          <div className="cx-brand-name">CryptoVault</div>
          <div className="cx-brand-sub">{isAdmin ? 'Admin Console' : 'Portfolio · Markets'}</div>
        </div>
      </div>

      <div className="cx-workspace-label">Navigation</div>

      {/* Nav */}
      <nav className="cx-nav">
        {navItems.map(({ label, icon, to }) => (
          <NavLink
            key={label}
            to={to}
            className={({ isActive }) =>
              `cx-nav-item${isActive ? ' active' : ''}`
            }
          >
            <span className="cx-nav-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Promo */}
      <div className={`cx-promo${isAdmin ? ' cx-promo--admin' : ''}`}>
        <div className="cx-promo-icon">{isAdmin ? '🛡' : '📈'}</div>
        <div className="cx-promo-title">{isAdmin ? 'Admin access' : 'Live prices'}</div>
        <div className="cx-promo-text">
          {isAdmin
            ? 'Manage users, roles, and platform settings.'
            : 'Real-time crypto prices via CoinGecko API.'}
        </div>
        <button
          className="cx-promo-btn"
          onClick={() => navigate(isAdmin ? '/admin' : '/markets')}
        >
          {isAdmin ? '→ Admin panel' : '→ View markets'}
        </button>
      </div>

      {/* User strip */}
      <div className="cx-user-strip">
        <div className={`cx-avatar${isAdmin ? ' cx-avatar--admin' : ''}`}>
          {user?.name?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <div className="cx-user-info">
          <div className="cx-user-name">{user?.name}</div>
          <div className="cx-user-email">{user?.email}</div>
        </div>
        <button className="cx-logout-btn" onClick={handleLogout} title="Sign out">
          ⇥
        </button>
      </div>
    </aside>
  );
}
