import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthLayout: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 font-medium animate-pulse">Loading auth status...</div>
      </div>
    );
  }



  return (
    <div className="min-h-screen w-full bg-slate-50">
      <Outlet />
    </div>
  );
};

export default AuthLayout;
