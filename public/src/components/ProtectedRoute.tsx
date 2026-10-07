import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // 1. Prevent early redirect while checking initial auth session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // 2. Redirect unauthenticated users with current path preserved
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Prevent privilege escalation: if route requires 'admin', check user role
  if (requiredRole) {
    const userRole = (user.role || '').toLowerCase();
    const hasRole = userRole === requiredRole.toLowerCase() || 
                    (user.roles && user.roles.some((r) => r.toLowerCase() === requiredRole.toLowerCase()));

    if (!hasRole) {
      // Non-admins attempting to access /admin get safely routed back to /dashboard
      return <Navigate to="/dashboard" replace />;
    }
  }

  // 4. Render children if provided, otherwise render nested Outlet routes
  return children ? <>{children}</> : <Outlet />;
}