import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PortfolioPage from './pages/portfolioPage';
import TransactionsPage from './pages/TransactionsPage';
import WatchlistPage from './pages/WatchlistPage';
import ProfilePage from './pages/ProfilePage';
import MarketsPage from './pages/MarketsPage';
import CoinDetailPage from './pages/CoinDetailPage';
import './assets/style/auth.css';

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Public market pages — accessible without login */}
      <Route path="/markets"         element={<MarketsPage />} />
      <Route path="/markets/:coinId" element={<CoinDetailPage />} />

      {/* Protected — user */}
      <Route path="/dashboard"    element={<ProtectedRoute allowedRole="user"><UserDashboard /></ProtectedRoute>} />
      <Route path="/portfolio"    element={<ProtectedRoute allowedRole="user"><PortfolioPage /></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute allowedRole="user"><TransactionsPage /></ProtectedRoute>} />
      <Route path="/watchlist"    element={<ProtectedRoute allowedRole="user"><WatchlistPage /></ProtectedRoute>} />
      <Route path="/settings"     element={<ProtectedRoute allowedRole="user"><ProfilePage /></ProtectedRoute>} />
      <Route path="/activity"     element={<ProtectedRoute allowedRole="user"><TransactionsPage /></ProtectedRoute>} />

      {/* Protected — admin */}
      <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
