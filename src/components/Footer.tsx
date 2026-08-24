import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, PhoneCall, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary-deep text-slate-400 border-t border-slate-900 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 mb-12">
        
        {/* Brand Column */}
        <div className="lg:col-span-4 space-y-4">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-heading text-2xl font-extrabold tracking-tight flex items-center">
              <span className="text-white group-hover:text-primary-light transition-colors">b4</span>
              <span className="text-secondary-emerald">boat</span>
            </span>
          </Link>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
            b4boat is Kerala's premium houseboat booking marketplace. We connect luxury-seeking travelers with verified, high-quality local boat owners for unforgettable journeys.
          </p>
          <div className="flex gap-4.5 pt-2">
            <a href="#" className="hover:text-white transition-colors">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
              </svg>
            </a>
            <a href="#" className="hover:text-white transition-colors">
              <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a href="#" className="hover:text-white transition-colors">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.52 3.5 12 3.5 12 3.5s-7.52 0-9.388.555a3.002 3.002 0 0 0-2.11 2.108C0 8.03 0 12 0 12s0 3.97.502 5.837a3.003 3.003 0 0 0 2.11 2.108C4.48 20.5 12 20.5 12 20.5s7.52 0 9.388-.555a3.003 3.003 0 0 0 2.11-2.108C24 15.97 24 12 24 12s0-3.97-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Quick Links Column */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="font-heading text-white text-sm font-bold uppercase tracking-wider">Quick Links</h4>
          <ul className="space-y-2.5 text-xs sm:text-sm">
            <li><a href="#featured" className="hover:text-white transition-colors">Featured Boats</a></li>
            <li><a href="#destinations" className="hover:text-white transition-colors">Destinations</a></li>
            <li><a href="#why-choose" className="hover:text-white transition-colors">Why Choose Us</a></li>
            <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
          </ul>
        </div>

        {/* Partners Column */}
        <div className="lg:col-span-3 space-y-4">
          <h4 className="font-heading text-white text-sm font-bold uppercase tracking-wider">Partner Portals</h4>
          <ul className="space-y-2.5 text-xs sm:text-sm">
            <li><Link to="/login" className="hover:text-white transition-colors">Host Dashboard</Link></li>
            <li><a href="#" className="hover:text-white transition-colors">List Your Houseboat</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Agent Registration</a></li>
            <li><a href="#" className="hover:text-white transition-colors">OTA Integrations</a></li>
          </ul>
        </div>

        {/* Contact Information Column */}
        <div className="lg:col-span-3 space-y-4">
          <h4 className="font-heading text-white text-sm font-bold uppercase tracking-wider">Contact Us</h4>
          <ul className="space-y-3.5 text-xs sm:text-sm">
            <li className="flex gap-2.5">
              <MapPin className="w-5 h-5 text-secondary-emerald shrink-0" />
              <span>Finishing Point, Punnamada, Alleppey, Kerala - 688006</span>
            </li>
            <li className="flex items-center gap-2.5">
              <PhoneCall className="w-4 h-4 text-secondary-emerald shrink-0" />
              <span>+91 98765 43210</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-secondary-emerald shrink-0" />
              <span>support@b4boat.com</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Footer Bottom Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-900/60 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
        <span>© {new Date().getFullYear()} b4boat. All rights reserved. Made for premium tourism.</span>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Cookies Policy</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
