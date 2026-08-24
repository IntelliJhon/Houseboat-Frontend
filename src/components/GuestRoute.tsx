import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface GuestRouteProps {
  children: React.ReactNode;
}

const GuestRoute: React.FC<GuestRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 font-medium animate-pulse">Checking credentials...</div>
      </div>
    );
  }

  if (user) {
    const redirectPath = searchParams.get('redirect');
    if (redirectPath) {
      return <Navigate to={redirectPath} replace />;
    }

    if (user.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === 'HOST') {
      if (user.hasProfile || user.status === 'ACTIVE') {
        return <Navigate to="/host/dashboard" replace />;
      } else {
        return <Navigate to="/host/register" replace />;
      }
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default GuestRoute;
