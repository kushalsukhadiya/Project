import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('citizen' | 'collector' | 'recycler' | 'admin' | 'municipal')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
          <span className="text-slate-500 dark:text-slate-400 font-medium animate-pulse text-sm">
            Initializing secure session...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized attempts to their default role dashboard
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'municipal':
        return <Navigate to="/municipal" replace />;
      case 'collector':
        return <Navigate to="/collector" replace />;
      case 'recycler':
        return <Navigate to="/recycler" replace />;
      case 'citizen':
      default:
        return <Navigate to="/citizen" replace />;
    }
  }

  return <>{children}</>;
};
