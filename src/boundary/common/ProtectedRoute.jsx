/**
 * ProtectedRoute — gate routes by authentication and (optionally) role.
 * Redirects unauthenticated users to /login and wrong-role users to their own dashboard.
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Loader from './Loader.jsx';

const HOME_BY_ROLE = {
  ADMIN: '/admin',
  FUNDRAISER: '/fundraiser',
  DONEE: '/donee',
  PLATFORM_MANAGER: '/platform',
};

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader fullscreen />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={HOME_BY_ROLE[user.role] || '/login'} replace />;
  }
  return children;
}
