import React, { useState, useEffect } from 'react';
import { 
  Settings, Shield, Percent, Globe, Sun, Moon, Plus, Trash2, Upload, RefreshCcw, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { useLanguage, type LanguageCode } from '../../../context/LanguageContext';
import { savePricingPolicy, getPricingPolicy } from '../../../utils/pricingPolicy';

import { setStoredLogoUrl, setStoredFaviconUrl, compressImageBase64 } from '../../../hooks/usePlatformLogo';
import { setStoredAppName, setStoredDarkMode, getStoredAppName, getStoredDarkMode } from '../../../hooks/useSystemSettings';

const SETTINGS_STORAGE_KEY = 'b4boat_admin_system_settings';

interface DBAdminUser {
  id: string;
  uuid: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status?: string;
  createdAt: string;
}

interface CustomRole {
  id: string;
  name: string;
  users: number;
  permissions: string;
}

const DEFAULT_SETTINGS = {
  appName: 'b4boat Portal',
  language: 'en',
  darkMode: false,
  logoUrl: '',
  faviconUrl: '',
  commissionPercent: '5.0',
  gstPercent: '18.0',
  bookingFee: '250',
  cancellationPolicy: 'Moderate (100% refund up to 7 days before check-in)',
  roles: [] as CustomRole[]
};

export const AdminSettingsSection: React.FC = () => {
  const { language: currentLang, setLanguage: setGlobalLanguage, t } = useLanguage();
  const [settingsTab, setSettingsTab] = useState<'general' | 'pricing' | 'roles'>('general');

  // Real DB Admins state
  const [dbAdmins, setDbAdmins] = useState<DBAdminUser[]>([]);

  // General settings state initialized from live system settings
  const [appName, setAppName] = useState(() => getStoredAppName());
  const [darkMode, setDarkMode] = useState(() => getStoredDarkMode());
  const [logoUrl, setLogoUrl] = useState(DEFAULT_SETTINGS.logoUrl);
  const [faviconUrl, setFaviconUrl] = useState(DEFAULT_SETTINGS.faviconUrl);

  // Pricing policies initialized from live pricing policy
  const livePolicy = getPricingPolicy();
  const [commissionPercent, setCommissionPercent] = useState(String(livePolicy.commissionPercent));
  const [gstPercent, setGstPercent] = useState(String(livePolicy.gstPercent));
  const [bookingFee, setBookingFee] = useState(String(livePolicy.bookingFee));
  const [cancellationPolicy, setCancellationPolicy] = useState(livePolicy.cancellationPolicy);

  // Custom Roles list
  const [rolesList, setRolesList] = useState<CustomRole[]>([]);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleUsers, setNewRoleUsers] = useState('1');
  const [newRolePermissions, setNewRolePermissions] = useState('');

  // Fetch real DB admins & load saved settings from localStorage
  useEffect(() => {
    const fetchRealDbAdminsAndSettings = async () => {
      try {
        const response = await api.get('/v1/admin/admins');
        if (response.data?.data?.admins && Array.isArray(response.data.data.admins)) {
          setDbAdmins(response.data.data.admins);
        }
      } catch (err) {
        console.warn('Could not fetch real admin users from DB:', err);
      }

      try {
        const p = getPricingPolicy();
        setCommissionPercent(String(p.commissionPercent));
        setGstPercent(String(p.gstPercent));
        setBookingFee(String(p.bookingFee));
        setCancellationPolicy(p.cancellationPolicy);

        const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.appName) setAppName(parsed.appName);
          if (parsed.language) setGlobalLanguage(parsed.language as LanguageCode);
          if (typeof parsed.darkMode === 'boolean') setDarkMode(parsed.darkMode);
          if (parsed.logoUrl) setLogoUrl(parsed.logoUrl);
          if (parsed.faviconUrl) setFaviconUrl(parsed.faviconUrl);
          if (Array.isArray(parsed.roles)) setRolesList(parsed.roles);
        }
      } catch (e) {
        console.error('Failed to parse admin settings from localStorage:', e);
      }
    };

    fetchRealDbAdminsAndSettings();
  }, []);

  // Save settings to localStorage & sync pricing policy dynamically across bookings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      savePricingPolicy({
        commissionPercent: Number(commissionPercent),
        gstPercent: Number(gstPercent),
        bookingFee: Number(bookingFee),
        cancellationPolicy: cancellationPolicy,
      });

      const compressedLogo = logoUrl ? await compressImageBase64(logoUrl, 300, 120) : '';
      const compressedFavicon = faviconUrl ? await compressImageBase64(faviconUrl, 64, 64) : '';

      setStoredLogoUrl(compressedLogo);
      setStoredFaviconUrl(compressedFavicon);
      setStoredAppName(appName);
      setStoredDarkMode(darkMode);

      const configPayload = {
        appName,
        language: currentLang,
        darkMode,
        logoUrl: compressedLogo,
        faviconUrl: compressedFavicon,
        commissionPercent,
        gstPercent,
        bookingFee,
        cancellationPolicy,
        roles: rolesList,
        updatedAt: new Date().toISOString()
      };

      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(configPayload));
      } catch (quotaErr) {
        console.warn('LocalStorage quota limit reached, saved essential configuration settings:', quotaErr);
      }
      toast.success('Platform application name, dark mode, logo & favicon saved successfully!');
    } catch (err) {
      console.error('Save settings error:', err);
      toast.error('Failed to save settings.');
    }
  };

  // Reset to default settings
  const handleResetDefaults = () => {
    savePricingPolicy({
      commissionPercent: 5.0,
      gstPercent: 18.0,
      bookingFee: 250,
      cancellationPolicy: 'Moderate (100% refund up to 7 days before check-in)',
    });

    setStoredLogoUrl('');
    setStoredFaviconUrl('');
    setStoredAppName('b4boat');
    setStoredDarkMode(false);

    setAppName('b4boat');
    setGlobalLanguage('en');
    setDarkMode(false);
    setLogoUrl(DEFAULT_SETTINGS.logoUrl);
    setFaviconUrl(DEFAULT_SETTINGS.faviconUrl);
    setCommissionPercent('5.0');
    setGstPercent('18.0');
    setBookingFee('250');
    setCancellationPolicy('Moderate (100% refund up to 7 days before check-in)');
    setRolesList(DEFAULT_SETTINGS.roles);
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
    toast.success('Settings & themes reset to system defaults.');
  };

  // Logo file upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const rawUrl = reader.result as string;
      const compressed = await compressImageBase64(rawUrl, 300, 120);
      setLogoUrl(compressed);
      setStoredLogoUrl(compressed);
      toast.success('Platform logo uploaded & placed on right of app name!');
    };
    reader.readAsDataURL(file);
  };

  // Favicon file upload handler
  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const rawUrl = reader.result as string;
      const compressed = await compressImageBase64(rawUrl, 64, 64);
      setFaviconUrl(compressed);
      setStoredFaviconUrl(compressed);
      toast.success('Favicon updated! Browser tab logo refreshed.');
    };
    reader.readAsDataURL(file);
  };

  // Add new administrative role
  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim() || !newRolePermissions.trim()) {
      toast.error('Please fill in role name and permissions description.');
      return;
    }
    const newRole = {
      id: `role_${Date.now()}`,
      name: newRoleName.trim(),
      users: parseInt(newRoleUsers, 10) || 1,
      permissions: newRolePermissions.trim()
    };
    const updated = [...rolesList, newRole];
    setRolesList(updated);
    setNewRoleName('');
    setNewRoleUsers('1');
    setNewRolePermissions('');
    setShowAddRoleModal(false);
    toast.success(`Role "${newRole.name}" registered successfully!`);
  };

  // Delete role
  const handleDeleteRole = (id: string) => {
    const updated = rolesList.filter(r => r.id !== id);
    setRolesList(updated);
    toast.success('Role removed from registry.');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-extrabold text-primary-deep flex items-center gap-2">
            Platform System Settings <Settings className="w-5 h-5 text-accent-gold" />
          </h1>
          <p className="text-xs text-slate-400 font-semibold font-sans">
            Manage global branding configurations, transaction commission rates, and administrative access levels.
          </p>
        </div>
      </div>

      {/* Main Settings Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Navigation Tabs menu */}
        <aside className="lg:col-span-3 space-y-1.5 bg-white rounded-3xl p-5 border border-slate-100 shadow-premium h-fit">
          <div className="border-b border-slate-50 pb-3 mb-3">
            <h4 className="font-heading text-xs font-bold text-slate-400 uppercase tracking-wider">Settings Menu</h4>
          </div>

          {[
            { label: 'General & Branding', key: 'general', icon: <Globe className="w-4 h-4" /> },
            { label: 'Pricing & Policies', key: 'pricing', icon: <Percent className="w-4 h-4" /> },
            { label: 'Roles & Permissions', key: 'roles', icon: <Shield className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSettingsTab(tab.key as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                settingsTab === tab.key
                  ? 'bg-secondary-emerald/10 text-secondary-emerald shadow-xs font-extrabold border border-secondary-emerald/20'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Right Side: Form workspace */}
        <div className="lg:col-span-9 bg-white rounded-3xl p-6 border border-slate-100 shadow-premium">
          <form onSubmit={handleSaveSettings} className="space-y-6 text-xs font-bold text-slate-700">
            
            {/* 1. General & Branding tab */}
            {settingsTab === 'general' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="border-b border-slate-50 pb-2">
                  <h3 className="font-heading text-sm font-bold text-primary-deep flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-secondary-emerald" /> General & Branding System
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase">Application Name</label>
                    <input
                      type="text"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none focus:border-secondary-emerald font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase">{t('default_language')}</label>
                    <select
                      value={currentLang}
                      onChange={(e) => {
                        const newLang = e.target.value as LanguageCode;
                        setGlobalLanguage(newLang);
                        toast.success(`Language set to ${newLang.toUpperCase()}`);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none cursor-pointer font-semibold"
                    >
                      <option value="en">English (US/UK)</option>
                      <option value="es">Español (Spanish)</option>
                      <option value="ml">മലയാളം (Malayalam)</option>
                      <option value="de">Deutsch (German)</option>
                      <option value="fr">Français (French)</option>
                    </select>
                  </div>
                </div>

                {/* Dark Mode toggle */}
                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                  <div className="space-y-0.5">
                    <span className="text-slate-800 font-extrabold text-xs flex items-center gap-1.5">
                      {darkMode ? <Moon className="w-4 h-4 text-indigo-500" /> : <Sun className="w-4 h-4 text-amber-500" />} System Theme mode
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold block font-sans">
                      Toggle portal dark mode configuration.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !darkMode;
                      setDarkMode(next);
                      setStoredDarkMode(next);
                      toast.success(next ? 'Theme set to Dark mode' : 'Theme set to Light mode');
                    }}
                    className={`w-12 h-6.5 rounded-full p-1 transition-colors cursor-pointer relative ${
                      darkMode ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${darkMode ? 'translate-x-5.5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Branding media elements dropzone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-50/50 transition-all space-y-2">
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Upload Platform Logo</span>
                    {logoUrl ? (
                      <div className="space-y-2">
                        <img src={logoUrl} alt="Platform Logo" className="h-10 mx-auto object-contain" />
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="text-[9px] text-rose-500 font-bold hover:underline cursor-pointer"
                        >
                          Remove Logo
                        </button>
                      </div>
                    ) : (
                      <label className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-[10px] font-bold cursor-pointer transition-all">
                        <Upload className="w-3.5 h-3.5" /> Select File
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                    )}
                  </div>

                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-50/50 transition-all space-y-2">
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Upload Favicon Element</span>
                    {faviconUrl ? (
                      <div className="space-y-2">
                        <img src={faviconUrl} alt="Favicon" className="w-8 h-8 mx-auto object-contain" />
                        <button
                          type="button"
                          onClick={() => setFaviconUrl('')}
                          className="text-[9px] text-rose-500 font-bold hover:underline cursor-pointer"
                        >
                          Remove Favicon
                        </button>
                      </div>
                    ) : (
                      <label className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-[10px] font-bold cursor-pointer transition-all">
                        <Upload className="w-3.5 h-3.5" /> Select File
                        <input type="file" accept="image/*" onChange={handleFaviconUpload} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 2. Pricing & Policies tab */}
            {settingsTab === 'pricing' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="border-b border-slate-50 pb-2">
                  <h3 className="font-heading text-sm font-bold text-primary-deep flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-secondary-emerald" /> Pricing Split & Policies
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase">Platform Commission %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={commissionPercent}
                      onChange={(e) => setCommissionPercent(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none focus:border-secondary-emerald font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase">Applicable GST %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={gstPercent}
                      onChange={(e) => setGstPercent(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none focus:border-secondary-emerald font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase">Booking Fee (₹)</label>
                    <input
                      type="number"
                      value={bookingFee}
                      onChange={(e) => setBookingFee(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none focus:border-secondary-emerald font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase">Cancellation Policy Framework</label>
                  <select
                    value={cancellationPolicy}
                    onChange={(e) => setCancellationPolicy(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none cursor-pointer font-semibold"
                  >
                    <option value="Flexible (100% refund up to 24h before)">Flexible (100% refund up to 24h before)</option>
                    <option value="Moderate (100% refund up to 7 days before check-in)">Moderate (100% refund up to 7 days before check-in)</option>
                    <option value="Strict (Non-refundable cancellations)">Strict (Non-refundable cancellations)</option>
                  </select>
                </div>
              </div>
            )}

            {/* 3. Roles & Permissions tab */}
            {settingsTab === 'roles' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <h3 className="font-heading text-sm font-bold text-primary-deep flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-secondary-emerald" /> Roles & Permissions Registry
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddRoleModal(true)}
                    className="flex items-center gap-1.5 bg-primary-deep hover:bg-primary-light text-white font-bold text-[10px] px-3.5 py-2 rounded-xl cursor-pointer shadow-xs transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New Role
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Real Database Admins list */}
                  {dbAdmins.map((admin) => (
                    <div key={admin.id || admin.email} className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex justify-between items-center gap-3 text-xs font-bold hover:bg-slate-50 transition-colors">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-900 text-xs font-extrabold">{admin.name || 'Super Administrator'}</span>
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                            DB Admin
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold leading-relaxed font-sans">
                          Email: {admin.email} • Phone: {admin.phone || 'N/A'} • Registered: {new Date(admin.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-lg font-extrabold">
                          1 Active User
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Fallback if DB fetch is loading */}
                  {dbAdmins.length === 0 && (
                    <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex justify-between items-center gap-3 text-xs font-bold">
                      <div className="space-y-1 flex-1">
                        <span className="text-slate-800 text-xs font-extrabold">Super Administrator</span>
                        <p className="text-[10px] text-slate-400 font-semibold leading-relaxed font-sans">All access privileges enabled across all platform modules.</p>
                      </div>
                      <span className="text-[9px] text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-lg font-bold">
                        1 Active User
                      </span>
                    </div>
                  )}

                  {/* Custom User-Added Roles */}
                  {rolesList.map((r) => (
                    <div key={r.id || r.name} className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex justify-between items-center gap-3 text-xs font-bold hover:bg-slate-50 transition-colors">
                      <div className="space-y-1 flex-1">
                        <span className="text-slate-800 text-xs font-extrabold">{r.name}</span>
                        <p className="text-[10px] text-slate-400 font-semibold leading-relaxed font-sans">{r.permissions}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-lg font-bold">
                          {r.users} Active User{r.users !== 1 ? 's' : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteRole(r.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer transition-colors"
                          title="Remove Role"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form Footer Action buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-6">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer transition-all border border-slate-200"
              >
                <RefreshCcw className="w-3.5 h-3.5 text-slate-400" /> Reset Default
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 bg-primary-deep hover:bg-primary-light text-white font-bold px-6 py-2.5 rounded-xl text-xs cursor-pointer shadow-md transition-all"
              >
                <Check className="w-4 h-4 text-emerald-400" /> Save Settings
              </button>
            </div>

          </form>
        </div>

      </div>

      {/* Add Role Modal */}
      {showAddRoleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-heading text-sm font-bold text-primary-deep flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" /> Add Administrative Role
              </h3>
              <button
                type="button"
                onClick={() => setShowAddRoleModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRole} className="space-y-4 text-xs font-bold text-slate-700">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 uppercase">Role Name</label>
                <input
                  type="text"
                  placeholder="e.g. Finance & Payout Desk"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-secondary-emerald"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 uppercase">Assigned Users Count</label>
                <input
                  type="number"
                  min="1"
                  value={newRoleUsers}
                  onChange={(e) => setNewRoleUsers(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-secondary-emerald"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 uppercase">Permissions Description</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Can view revenue analytics, manage settlements, and export transaction ledgers."
                  value={newRolePermissions}
                  onChange={(e) => setNewRolePermissions(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-secondary-emerald resize-none"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRoleModal(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-primary-deep hover:bg-primary-light text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

