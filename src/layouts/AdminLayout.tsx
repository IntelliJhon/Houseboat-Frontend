import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, ShieldCheck, Users, BookOpen, BarChart3,
  Settings, LogOut, BellRing, LifeBuoy, Menu, X, ArrowLeftRight, Star 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { NotificationBell } from '../components/notifications/NotificationBell';

import { useLanguage } from '../context/LanguageContext';

import { usePlatformLogo, useFavicon } from '../hooks/usePlatformLogo';
import { useAppName, useDarkMode } from '../hooks/useSystemSettings';

const AdminLayout: React.FC = () => {
  const { logout } = useAuth();
  const { t } = useLanguage();
  const customLogoUrl = usePlatformLogo();
  const appName = useAppName();
  useFavicon();
  useDarkMode();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { key: 'overview', label: t('overview'), path: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: 'verify_vessels', label: t('verify_vessels'), path: '/admin/dashboard#verify', icon: <ShieldCheck className="w-4 h-4" /> },
    { key: 'manage_hosts', label: t('manage_hosts'), path: '/admin/dashboard#hosts', icon: <Users className="w-4 h-4" /> },
    { key: 'bookings_ledger', label: t('bookings_ledger'), path: '/admin/dashboard#ledger', icon: <BookOpen className="w-4 h-4" /> },
    { key: 'reports_analytics', label: t('reports_analytics'), path: '/admin/dashboard#analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'notifications', label: t('notifications'), path: '/admin/dashboard#notifications', icon: <BellRing className="w-4 h-4" /> },
    { key: 'reviews_trust', label: t('reviews_trust'), path: '/admin/dashboard#reviews', icon: <Star className="w-4 h-4" /> },
    { key: 'support_center', label: t('support_center'), path: '/admin/dashboard#support', icon: <LifeBuoy className="w-4 h-4" /> },
    { key: 'settings', label: t('settings'), path: '/admin/dashboard#settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleLogout = () => {
    toast.success('Signed out of Admin Workspace.');
    logout('/');
  };

  const currentHash = location.hash || '';
  const currentPath = location.pathname;

  const isItemActive = (itemPath: string) => {
    const hashIndex = itemPath.indexOf('#');
    if (hashIndex !== -1) {
      const itemHash = itemPath.substring(hashIndex);
      return currentHash === itemHash;
    }
    return currentPath === itemPath && currentHash === '';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      
      {/* 1. Top Admin Header / Navbar */}
      <header className="bg-primary-deep text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link to="/admin/dashboard" className="flex items-center gap-2 group">
              <span className="font-heading text-xl font-extrabold tracking-tight flex items-center gap-2">
                <span className="text-white group-hover:text-primary-light transition-colors">
                  {appName}
                </span>
                {customLogoUrl && (
                  <img src={customLogoUrl} alt="Platform Logo" className="h-7 max-h-7 object-contain rounded" />
                )}
                <span className="text-accent-gold text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 uppercase tracking-widest">Admin</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Switch Mode Button */}
            <Link
              to="/host/dashboard"
              className="hidden md:flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/10 transition-all"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Switch to Host Portal
            </Link>

            {/* Notification Bell */}
            <NotificationBell role="ADMIN" />

            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </header>

      {/* 2. Main Page Layout (Sidebar + Content) */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block lg:col-span-3 space-y-2 bg-white rounded-3xl p-5 border border-slate-100 shadow-premium h-fit sticky top-24">
          <div className="border-b border-slate-50 pb-4 mb-4">
            <h4 className="font-heading text-xs font-bold text-slate-400 uppercase tracking-wider">Admin Workspace</h4>
          </div>
          
          <nav className="space-y-1.5">
            {navigationItems.map((item, idx) => {
              const isActive = isItemActive(item.path);
              return (
                <Link
                  key={idx}
                  to={item.path}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-secondary-emerald/10 text-secondary-emerald shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-slate-50 mt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider text-red-500 hover:bg-red-50 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Page Content Panel */}
        <main className="lg:col-span-9 w-full">
          <Outlet />
        </main>

      </div>

      {/* 3. Mobile Floating Navigation Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 lg:hidden flex justify-end animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="w-full max-w-xs bg-white h-full p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <span className="font-heading text-lg font-extrabold text-primary-deep flex items-center">
                  b4boat <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded ml-1">Admin</span>
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <nav className="space-y-2">
                {navigationItems.map((item, idx) => {
                  const active = isItemActive(item.path);
                  return (
                    <Link
                      key={idx}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${
                        active
                          ? 'bg-secondary-emerald/10 text-secondary-emerald shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-100">
              <Link
                to="/host/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3.5 rounded-xl transition-all"
              >
                <ArrowLeftRight className="w-4 h-4" /> Switch to Host Portal
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-500 font-bold text-xs py-3.5 rounded-xl transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminLayout;
