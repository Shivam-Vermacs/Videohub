/**
 * Protected Route Component
 * =========================
 * Handles authentication and role-based access
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AlertTriangle } from 'lucide-react';

function ProtectedRoute({ children, allowedRoles = null }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card p-8 max-w-md text-center">
          <div 
            className="icon-box icon-box-lg mx-auto mb-4"
            style={{ background: 'var(--color-error-light)', color: 'var(--color-error)' }}
          >
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-secondary mb-6">
            You don't have permission to access this page.
          </p>
          <a href="/" className="btn btn-primary">
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
