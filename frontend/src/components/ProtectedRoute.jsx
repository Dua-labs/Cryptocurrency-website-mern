import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a route and redirects if:
 * - Not logged in → /login
 * - Logged in but wrong role → their dashboard
 *
 * Usage:
 *   <ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>
 *   <ProtectedRoute><UserDashboard /></ProtectedRoute>  ← any authenticated user
 */
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <span style={{ color: '#888', fontFamily: 'monospace' }}>Loading...</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRole && user.role !== allowedRole) {
    // Send each role to their own dashboard
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return children;
};

export default ProtectedRoute;
