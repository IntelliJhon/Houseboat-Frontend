import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Compass, Briefcase, ChevronDown, User, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePlatformLogo, useFavicon } from '../hooks/usePlatformLogo';
import { useAppName, useDarkMode } from '../hooks/useSystemSettings';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const customLogoUrl = usePlatformLogo();
  const appName = useAppName();
  useFavicon();
  useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = useState(false);

  const isHomePage = location.pathname === '/';
  const isLightText = isHomePage && !isScrolled;

  const dashboardPath = user
    ? user.role === 'ADMIN'
      ? '/admin/dashboard'
      : user.role === 'HOST'
        ? '/host/dashboard'
        : '/dashboard'
    : '/dashboard';

  // Scroll Listener to trigger glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent, sectionHash: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    if (location.pathname === '/') {
      const targetId = sectionHash.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.hash = sectionHash;
      }
    } else {
      navigate(`/${sectionHash}`);
    }
  };

  useEffect(() => {
    if (location.pathname === '/' && location.hash) {
      const targetId = location.hash.replace('#', '');
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location.pathname, location.hash]);

  const handleLogout = () => {
    logout();
    setIsProfileDropdownOpen(false);
    navigate('/');
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isLightText
          ? 'bg-transparent py-5'
          : 'bg-white/95 backdrop-blur-md shadow-premium border-b border-slate-100 py-3 sm:py-3.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-heading text-2xl font-extrabold tracking-tight flex items-center gap-2">
              <span className={`transition-colors ${
                isLightText 
                  ? 'text-white drop-shadow-md group-hover:text-amber-200' 
                  : 'text-primary-deep group-hover:text-primary-light'
              }`}>
                {appName}
              </span>
              {customLogoUrl && (
                <img src={customLogoUrl} alt="Platform Logo" className="h-8 max-h-8 object-contain rounded" />
              )}
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className={`text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                isLightText ? 'text-white/90 hover:text-white drop-shadow-xs' : 'text-slate-700 hover:text-primary-deep'
              }`}
            >
              <Compass className="w-4 h-4 text-secondary-emerald" />
              Explore
            </Link>
            <a
              href="/#destinations"
              onClick={(e) => handleNavClick(e, '#destinations')}
              className={`text-sm font-semibold transition-colors ${
                isLightText ? 'text-white/90 hover:text-white drop-shadow-xs' : 'text-slate-700 hover:text-primary-deep'
              }`}
            >
              Destinations
            </a>
            <a
              href="/#why-choose"
              onClick={(e) => handleNavClick(e, '#why-choose')}
              className={`text-sm font-semibold transition-colors ${
                isLightText ? 'text-white/90 hover:text-white drop-shadow-xs' : 'text-slate-700 hover:text-primary-deep'
              }`}
            >
              Why Us
            </a>
            <a
              href="/#reviews"
              onClick={(e) => handleNavClick(e, '#reviews')}
              className={`text-sm font-semibold transition-colors ${
                isLightText ? 'text-white/90 hover:text-white drop-shadow-xs' : 'text-slate-700 hover:text-primary-deep'
              }`}
            >
              Reviews
            </a>
          </nav>

          {/* User Account Controls */}
          <div className="hidden md:flex items-center gap-4">
            
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 bg-slate-900 text-white pl-3 pr-4 py-2 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
                >
                  <div className="w-5 h-5 bg-secondary-emerald rounded-full flex items-center justify-center text-[10px] uppercase font-bold text-white">
                    {(user.name || user.firstName || '').charAt(0)}
                  </div>
                  <span>{(user.name || user.firstName || '').split(' ')[0]}</span>
                </button>
                
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-premium border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                    <Link
                      to={dashboardPath}
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Briefcase className="w-4 h-4 text-slate-400" />
                      Dashboard
                    </Link>
                    <hr className="my-1 border-slate-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50/50 transition-colors cursor-pointer"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsLoginDropdownOpen(!isLoginDropdownOpen)}
                  className="flex items-center gap-1.5 bg-primary-deep text-white hover:bg-primary-light px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
                >
                  Login Portal
                  <ChevronDown className={`w-4 h-4 transition-transform ${isLoginDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLoginDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-premium border border-slate-100 py-2.5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                    <div className="text-[10px] font-bold text-slate-400 px-4 py-1.5 uppercase tracking-widest">Select Portal</div>
                    
                    <Link
                      to="/login?role=CUSTOMER"
                      onClick={() => setIsLoginDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      Guest Login
                    </Link>
                    
                    <Link
                      to="/login?role=HOST"
                      onClick={() => setIsLoginDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <Briefcase className="w-4 h-4 text-slate-400" />
                      Host Login
                    </Link>
                    
                    <Link
                      to="/login?role=ADMIN"
                      onClick={() => setIsLoginDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <ShieldAlert className="w-4 h-4 text-slate-400" />
                      Admin Login
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isLightText 
                  ? 'text-white hover:bg-white/10' 
                  : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-premium border-b border-slate-100 py-4 px-6 z-50 animate-in slide-in-from-top duration-300">
          <nav className="flex flex-col gap-4.5">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-base font-semibold text-slate-800 hover:text-primary-deep"
            >
              Explore
            </Link>
            <a
              href="/#destinations"
              onClick={(e) => handleNavClick(e, '#destinations')}
              className="text-base font-semibold text-slate-800 hover:text-primary-deep"
            >
              Destinations
            </a>
            <a
              href="/#why-choose"
              onClick={(e) => handleNavClick(e, '#why-choose')}
              className="text-base font-semibold text-slate-800 hover:text-primary-deep"
            >
              Why Us
            </a>
            <a
              href="/#reviews"
              onClick={(e) => handleNavClick(e, '#reviews')}
              className="text-base font-semibold text-slate-800 hover:text-primary-deep"
            >
              Reviews
            </a>
            
            <hr className="border-slate-100 my-1" />
            
            {user ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-secondary-emerald rounded-full flex items-center justify-center text-xs uppercase font-bold text-white">
                    {(user.name || user.firstName || '').charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{user.name || `${user.firstName} ${user.lastName}` || 'User'}</div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </div>
                </div>
                <Link
                  to={dashboardPath}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm font-semibold text-slate-700 hover:text-primary-deep py-1"
                >
                  Go to Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left text-sm font-semibold text-red-500 py-1"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Access Portals</span>
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-left font-semibold text-slate-700 py-2 hover:bg-slate-50 transition-all text-sm flex items-center gap-2"
                >
                  <User className="w-4.5 h-4.5 text-slate-400" /> Guest Login
                </Link>
                <Link
                  to="/host/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-left font-semibold text-slate-700 py-2 hover:bg-slate-50 transition-all text-sm flex items-center gap-2"
                >
                  <Briefcase className="w-4.5 h-4.5 text-slate-400" /> Host Login
                </Link>
                <Link
                  to="/admin/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-left font-semibold text-slate-700 py-2 hover:bg-slate-50 transition-all text-sm flex items-center gap-2"
                >
                  <ShieldAlert className="w-4.5 h-4.5 text-slate-400" /> Admin Login
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
