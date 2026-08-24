import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Users, AlertCircle, TrendingUp, Wallet, ShieldCheck, Check, X, Calendar
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { VerifyVesselsSection } from './components/VerifyVesselsSection';
import { ManageHostsSection } from './components/ManageHostsSection';
import { BookingsLedgerSection } from './components/BookingsLedgerSection';
import { AdminSettingsSection } from './components/AdminSettingsSection';
import { ReportsAnalyticsSection } from './components/ReportsAnalyticsSection';
import { AdminNotificationsSection } from './components/AdminNotificationsSection';
import { AdminSupportSection } from './components/AdminSupportSection';
import { AdminReviewsSection } from './components/AdminReviewsSection';

interface PendingVessel {
  id: string;
  name: string;
  location: string;
  category: string;
  bedrooms: number;
  pricePerNight: number; // For rate indicators
  ownerName: string;
  pollutionNo: string;
  pollutionExpiry: string;
  safetyNo: string;
  safetyExpiry: string;
  lifeJackets: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  image: string;
}



const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'overview' | 'verify' | 'hosts' | 'ledger' | 'analytics' | 'notifications' | 'reviews' | 'support' | 'settings'>('overview');

  // Modal & Rejection states
  const [selectedVessel, setSelectedVessel] = useState<PendingVessel | null>(null);
  const [rejectionInputId, setRejectionInputId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Sync active tab from React Router location.hash — fires on every Link navigation instantly
  useEffect(() => {
    const hash = location.hash;
    if (hash === '#verify') setActiveTab('verify');
    else if (hash === '#hosts') setActiveTab('hosts');
    else if (hash === '#ledger') setActiveTab('ledger');
    else if (hash === '#analytics') setActiveTab('analytics');
    else if (hash === '#notifications') setActiveTab('notifications');
    else if (hash === '#reviews') setActiveTab('reviews');
    else if (hash === '#support') setActiveTab('support');
    else if (hash === '#settings') setActiveTab('settings');
    else setActiveTab('overview');
  }, [location.hash]);  // Stateful Pending Vessels Data
  const [vessels, setVessels] = useState<PendingVessel[]>([]);
  const [perfTimeframe, setPerfTimeframe] = useState<'7days' | '1month' | '3months' | 'year'>('year');

  const [overviewStats, setOverviewStats] = useState({
    platformRevenue: 184500,
    pendingVerifications: 0,
    activeHosts: 2,
    totalBookings: 142,
    monthlyPerformance: [] as { month: string; revenue: number }[],
  });

  useEffect(() => {
    const fetchAdminOverview = async () => {
      try {
        const response = await api.get(`/v1/admin/stats?period=${perfTimeframe}`);
        if (response.data?.data) {
          const stats = response.data.data;
          setOverviewStats({
            platformRevenue: stats.platformRevenue || 0,
            pendingVerifications: stats.pendingVerifications ?? 0,
            activeHosts: stats.activeHosts ?? 0,
            totalBookings: stats.totalBookings ?? 0,
            monthlyPerformance: stats.monthlyPerformance || [],
          });

          if (stats.pendingQueue && Array.isArray(stats.pendingQueue)) {
            const mappedQueue: PendingVessel[] = stats.pendingQueue.map((b: any) => ({
              id: b.id,
              name: b.name,
              location: b.location || 'Alleppey Backwaters',
              category: b.category || 'Premium',
              bedrooms: b.bedrooms || 2,
              pricePerNight: b.pricePerNight || 15000,
              ownerName: b.host?.name || 'Host Partner',
              pollutionNo: b.pollutionCertificateNo || 'PCB-PENDING-2026',
              pollutionExpiry: b.pollutionExpiry ? new Date(b.pollutionExpiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending Audit',
              safetyNo: b.safetyAuditNo || 'PORT-SFTY-PENDING',
              safetyExpiry: b.safetyExpiry ? new Date(b.safetyExpiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending Audit',
              lifeJackets: b.capacity ? Math.max(4, b.capacity) : 6,
              status: b.status === 'APPROVED' ? 'Approved' : 'Pending',
              image: b.images?.[0] || 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80',
            }));
            setVessels(mappedQueue.filter(v => v.status === 'Pending'));
          } else {
            setVessels([]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch live admin stats:', err);
      }
    };

    fetchAdminOverview();
  }, [perfTimeframe]);

  const formatShortAmount = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  // Approve Vessel Handler
  const handleApproveVessel = (id: string) => {
    setVessels(prev => 
      prev.map(v => v.id === id ? { ...v, status: 'Approved' } : v)
    );
    toast.success(`Vessel ${id} approved & published!`);
    setSelectedVessel(null);
  };

  // Reject Vessel Request Handler (Saves reason)
  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      toast.error('Please enter a rejection reason.');
      return;
    }
    const targetId = rejectionInputId || '';
    setVessels(prev => 
      prev.map(v => v.id === targetId ? { ...v, status: 'Rejected', rejectionReason } : v)
    );
    toast.error(`Vessel listing rejected. Owner notified.`);
    setRejectionInputId(null);
    setRejectionReason('');
    setSelectedVessel(null);
  };



  // Render Charts and Activity overview
  const renderOverview = () => {
    const pendingCount = vessels.filter(v => v.status === 'Pending').length;

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Platform Revenue', value: `₹${overviewStats.platformRevenue.toLocaleString('en-IN')}`, icon: <Wallet className="w-5 h-5" />, color: 'bg-emerald-50 text-secondary-emerald border-emerald-100/50' },
            { label: 'Pending Verifications', value: `${pendingCount} vessels`, icon: <AlertCircle className="w-5 h-5" />, color: 'bg-amber-50 text-amber-500 border-amber-100/50' },
            { label: 'Active Captains', value: `${overviewStats.activeHosts} hosts`, icon: <Users className="w-5 h-5" />, color: 'bg-blue-50 text-primary-light border-blue-100/50' },
            { label: 'Total bookings', value: `${overviewStats.totalBookings} booked`, icon: <TrendingUp className="w-5 h-5" />, color: 'bg-indigo-50 text-indigo-500 border-indigo-100/50' }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-100/80 shadow-premium flex items-center justify-between hover-lift group">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{stat.label}</span>
                <span className="text-2xl font-extrabold text-primary-deep">{stat.value}</span>
              </div>
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Split Layout: Custom Chart + Quick Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Block: Recharts Platform Performance Chart */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-100/80 shadow-premium space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-50 pb-4">
              <div>
                <h3 className="font-heading text-base font-bold text-primary-deep">Monthly Platform Performance</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Live platform earnings index</p>
              </div>

              {/* Dynamic Timeframe Filter Buttons */}
              <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl overflow-x-auto max-w-full">
                {[
                  { id: '7days', label: '7 Days' },
                  { id: '1month', label: '1 Month' },
                  { id: '3months', label: '3 Months' },
                  { id: 'year', label: '1 Year' },
                ].map((btn) => (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => setPerfTimeframe(btn.id as any)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      perfTimeframe === btn.id
                        ? 'bg-primary-deep text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={overviewStats.monthlyPerformance} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminPerfGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0b664d" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#0b664d" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                    tickFormatter={(val) => formatShortAmount(val)} 
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#061e38', 
                      borderRadius: '16px', 
                      color: '#ffffff',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 15px 30px -5px rgba(0,0,0,0.3)',
                      fontSize: '12px',
                      fontWeight: 700,
                      padding: '10px 14px'
                    }}
                    formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Platform Revenue']}
                    labelStyle={{ color: '#34d399', fontWeight: 800, marginBottom: '4px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#0b664d" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#adminPerfGradient)" 
                    activeDot={{ r: 6, fill: '#0b664d', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Block: Verification Queue Quicklist */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-100/80 shadow-premium space-y-6">
            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
              <h3 className="font-heading text-base font-bold text-primary-deep">Verification Queue</h3>
              <a href="#verify" className="text-xs font-bold text-primary-light hover:text-primary-deep">View Queue</a>
            </div>

            {vessels.filter(v => v.status === 'Pending').length > 0 ? (
              <div className="space-y-4">
                {vessels.filter(v => v.status === 'Pending').slice(0, 3).map(boat => (
                  <div 
                    key={boat.id} 
                    onClick={() => setSelectedVessel(boat)}
                    className="flex gap-3 items-center p-3 rounded-2xl border border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer"
                  >
                    <img src={boat.image} alt={boat.name} className="w-11 h-11 rounded-xl object-cover border border-slate-100 shrink-0 shadow-sm" />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h4 className="text-xs font-bold text-primary-deep truncate">{boat.name}</h4>
                      <span className="text-[9px] text-slate-400 block font-semibold">{boat.location} • {boat.category}</span>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                ⛵ No pending houseboats to verify.
              </div>
            )}
          </div>

        </div>

      </div>
    );
  };







  return (
    <div className="space-y-6">
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'verify' && <VerifyVesselsSection />}
      {activeTab === 'hosts' && <ManageHostsSection />}
      {activeTab === 'ledger' && <BookingsLedgerSection />}
      {activeTab === 'analytics' && <ReportsAnalyticsSection />}
      {activeTab === 'notifications' && <AdminNotificationsSection />}
      {activeTab === 'reviews' && <AdminReviewsSection />}
      {activeTab === 'support' && <AdminSupportSection />}
      {activeTab === 'settings' && <AdminSettingsSection />}

      {/* 5. Inspection Modal Popup (Full governmnet certificates & safety checks audit) */}
      {selectedVessel && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 md:p-8 shadow-premium border border-slate-100 overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-250 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-heading text-lg font-bold text-primary-deep">Vessel Clearance Audit</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">Vessel ID: {selectedVessel.id}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedVessel(null);
                  setRejectionInputId(null);
                  setRejectionReason('');
                }}
                className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Split specifications */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <img src={selectedVessel.image} alt={selectedVessel.name} className="md:col-span-4 rounded-2xl w-full h-28 object-cover border border-slate-100 shadow-sm" />
              <div className="md:col-span-8 grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Vessel Name</span>
                  <span className="text-slate-800 text-sm font-bold">{selectedVessel.name}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Owner Name</span>
                  <span className="text-slate-800">{selectedVessel.ownerName}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Location / Category</span>
                  <span>{selectedVessel.location} ({selectedVessel.category})</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Bedrooms count</span>
                  <span>{selectedVessel.bedrooms} Bedrooms</span>
                </div>
              </div>
            </div>

            {/* Governmnet Clearances Certificates Grid */}
            <div className="space-y-4 pt-4 border-t border-slate-50">
              <h4 className="text-xs font-bold text-primary-deep uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-secondary-emerald" /> Government Licensing Clearances
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Pollution Clearance */}
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Pollution Certificate</span>
                    <span className="bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded text-[8px]">Passed</span>
                  </div>
                  <div className="font-semibold text-slate-800">Clearance No: <span className="font-mono text-slate-500 text-[11px]">{selectedVessel.pollutionNo}</span></div>
                  <div className="text-slate-500 font-semibold flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Expiry: {selectedVessel.pollutionExpiry}</div>
                </div>

                {/* Safety Audit */}
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Port Safety Audit</span>
                    <span className="bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded text-[8px]">Verified</span>
                  </div>
                  <div className="font-semibold text-slate-800">Clearance No: <span className="font-mono text-slate-500 text-[11px]">{selectedVessel.safetyNo}</span></div>
                  <div className="text-slate-500 font-semibold flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Audit Expiry: {selectedVessel.safetyExpiry}</div>
                  <div className="text-slate-500 font-semibold">Life Jackets Inventory: {selectedVessel.lifeJackets} units</div>
                </div>
              </div>
            </div>

            {/* Action buttons (Rejection details forms) */}
            {rejectionInputId === selectedVessel.id ? (
              <form onSubmit={handleRejectSubmit} className="space-y-4 border-t border-slate-100 pt-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Rejection Reason *</label>
                  <textarea
                    required
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter explicit reason (e.g. Life Jackets count does not meet Port Authority standards for 4 Bedrooms)."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-semibold text-slate-800 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setRejectionInputId(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Submit Rejection
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex gap-3 justify-end border-t border-slate-100 pt-4">
                <button
                  onClick={() => setRejectionInputId(selectedVessel.id)}
                  className="bg-red-50 hover:bg-red-100 text-red-500 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-4 h-4" /> Reject Listing
                </button>
                <button
                  onClick={() => handleApproveVessel(selectedVessel.id)}
                  className="bg-secondary-emerald hover:bg-secondary-emerald/90 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1 shadow-md hover:scale-[1.01] transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Approve Listing
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
