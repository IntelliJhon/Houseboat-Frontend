import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

import Footer from '../components/Footer';

const RootLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Premium Navigation Header */}
      <Navbar />

      {/* Main Page Content */}
      <main className="flex-1 w-full pt-24">
        <Outlet />
      </main>

      {/* Premium Footer */}
      <Footer />
    </div>
  );
};

export default RootLayout;
