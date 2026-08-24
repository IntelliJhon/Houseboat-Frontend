import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('CUSTOMER' | 'HOST' | 'ADMIN')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 font-medium animate-pulse">Verifying credentials...</div>
      </div>
    );
  }

  if (!user) {
    let roleParam = 'CUSTOMER';
    if (location.pathname.startsWith('/host')) {
      roleParam = 'HOST';
    } else if (location.pathname.startsWith('/admin')) {
      roleParam = 'ADMIN';
    }
    return <Navigate to={`/login?role=${roleParam}`} state={{ from: location }} replace />;
  }

  // Role verification
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // Account status check (Hosts only - Admins are always active)
  if (user.role === 'HOST' && user.status !== 'ACTIVE' && !user.hasProfile) {
    // Allow access to host/register onboarding wizard, vessel onboarding, and pending-approval pages
    if (location.pathname !== '/pending-approval' && location.pathname !== '/host/register' && location.pathname !== '/host/onboarding') {
      return <Navigate to="/pending-approval" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
