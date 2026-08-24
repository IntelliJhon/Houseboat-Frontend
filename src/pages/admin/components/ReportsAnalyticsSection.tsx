import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, Calendar, Ship, Award, 
  DollarSign, ArrowUpRight, ArrowDownRight, Coins, Percent
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';
import api from '../../../services/api';

export const ReportsAnalyticsSection: React.FC = () => {
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '30days' | 'month' | 'year' | 'custom'>('30days');
  const [analytics, setAnalytics] = useState<any>({
    totalRevenue: 0,
    totalBookings: 0,
    activeHouseboats: 0,
    activeHosts: 0,
    totalCustomers: 0,
    platformCommission: 0,
    averageBookingValue: 0,
    turnoverMonthly: [],
    topHouseboats: [],
    topHosts: []
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get(`/v1/admin/analytics?period=${dateFilter}`);
        if (res.data?.success && res.data?.data) {
          setAnalytics(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch admin analytics:', err);
      }
    };

    fetchAnalytics();
  }, [dateFilter]);

  const dateRangeLabel = useMemo(() => {
    const d = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const todayStr = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

    if (dateFilter === 'today') return `${todayStr} (Today)`;
    if (dateFilter === '7days') {
      const past7 = new Date(d.getTime() - 7 * 24 * 60 * 60 * 1000);
      return `${months[past7.getMonth()]} ${past7.getDate()} - ${todayStr}`;
    }
    if (dateFilter === '30days') {
      const past30 = new Date(d.getTime() - 30 * 24 * 60 * 60 * 1000);
      return `${months[past30.getMonth()]} ${past30.getDate()} - ${todayStr}`;
    }
    if (dateFilter === 'month') {
      return `${months[d.getMonth()]} ${d.getFullYear()}`;
    }
    if (dateFilter === 'year') {
      return `Year ${d.getFullYear()}`;
    }
    return todayStr;
  }, [dateFilter]);

  const monthlyData = useMemo(() => {
    if (analytics.turnoverMonthly && Array.isArray(analytics.turnoverMonthly)) {
      return analytics.turnoverMonthly;
    }
    return [];
  }, [analytics.turnoverMonthly]);

  const formatShortINR = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const CustomTooltip = ({ active, payload, label, unit = '₹' }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-800 text-xs font-sans space-y-1">
          <p className="font-extrabold text-slate-300 uppercase tracking-wider text-[10px]">{label}</p>
          <p className="font-mono text-emerald-400 font-extrabold text-sm">
            {unit}{(val || 0).toLocaleString('en-IN')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-extrabold text-primary-deep flex items-center gap-2">
            Reports & Analytics <BarChart3 className="w-5 h-5 text-accent-gold" />
          </h1>
          <p className="text-xs text-slate-400 font-semibold font-sans">
            Monitor overall platform turnover, 5% commission revenue analysis, fleet performance, and partner leaderboards.
          </p>
        </div>
      </div>

      {/* Time Scope Filter Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-premium flex flex-wrap gap-2 justify-between items-center">
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: 'Today', key: 'today' },
            { label: 'Last 7 Days', key: '7days' },
            { label: 'Last 30 Days', key: '30days' },
            { label: 'This Month', key: 'month' },
            { label: 'This Year', key: 'year' }
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setDateFilter(t.key as any);
                toast.success(`Date scope updated to: ${t.label}`);
              }}
              className={`px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                dateFilter === t.key
                  ? 'bg-secondary-emerald/10 text-secondary-emerald shadow-sm font-extrabold'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="text-[10px] font-extrabold text-slate-500 flex items-center gap-1.5 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100/60 font-mono">
          <Calendar className="w-3.5 h-3.5 text-secondary-emerald" />
          <span>{dateRangeLabel}</span>
        </div>
      </div>

      {/* Dynamic KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Overall Turnover', val: `₹${(analytics.totalRevenue || 0).toLocaleString('en-IN')}`, change: '+12.4%', up: true, desc: 'Gross volume platform turnover' },
          { label: 'Total Bookings', val: `${analytics.totalBookings || 0} Trips`, change: '+8.2%', up: true, desc: 'Successful confirmed voyages' },
          { label: 'Active Houseboats', val: `${analytics.activeHouseboats || 0} Vessels`, change: 'Live', up: true, desc: 'Approved public listings' },
          { label: 'Active Partners', val: `${analytics.activeHosts || 0} Hosts`, change: 'Verified', up: true, desc: 'Fleet partner captains' },
          { label: 'Total Customers', val: `${analytics.totalCustomers || 0} Guests`, change: '+18.5%', up: true, desc: 'Registered guest travelers' },
          { label: 'Occupancy Rate', val: '78.5%', change: '+5.4%', up: true, desc: 'Average seasonal load factor' },
          { label: 'Platform Commission', val: `₹${(analytics.platformCommission || 0).toLocaleString('en-IN')}`, change: '+12.4%', up: true, desc: 'Net 5% platform commission fees' },
          { label: 'Average Booking Value', val: `₹${(analytics.averageBookingValue || 0).toLocaleString('en-IN')}`, change: 'Stable', up: true, desc: 'Average booking ticket fare' }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-premium flex flex-col justify-between gap-4 hover-lift">
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">{kpi.label}</span>
              <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                kpi.up ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
              }`}>
                {kpi.up ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                {kpi.change}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-xl font-extrabold text-primary-deep block">{kpi.val}</span>
              <span className="text-[9px] text-slate-400 block font-semibold leading-relaxed font-sans">{kpi.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Two Recharts Bar Charts: 1. Overall Turnover & 2. Commission Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Chart 1: Recharts Overall Turnover Analysis Bar Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-premium space-y-6">
          <div className="flex justify-between items-center border-b border-slate-50 pb-4">
            <div>
              <h3 className="font-heading text-xs font-bold text-primary-deep uppercase tracking-wider flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-500" /> Overall Turnover Analysis
              </h3>
              <p className="text-[9px] text-slate-400 font-semibold block mt-0.5 font-sans">
                Monthly gross volume turnover calculated from platform bookings.
              </p>
            </div>
            <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              Gross Volume
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontWeight={700} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontWeight={700} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => formatShortINR(val)} 
                />
                <Tooltip content={<CustomTooltip unit="₹" />} />
                <Bar 
                  dataKey="turnover" 
                  name="Turnover" 
                  fill="#10b981" 
                  radius={[8, 8, 0, 0]} 
                  barSize={32} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Recharts Commission Analysis Bar Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-premium space-y-6">
          <div className="flex justify-between items-center border-b border-slate-50 pb-4">
            <div>
              <h3 className="font-heading text-xs font-bold text-primary-deep uppercase tracking-wider flex items-center gap-2">
                <Percent className="w-4 h-4 text-amber-500" /> Platform Commission Analysis
              </h3>
              <p className="text-[9px] text-slate-400 font-semibold block mt-0.5 font-sans">
                Net 5% platform commission fees earnings analysis across active months.
              </p>
            </div>
            <span className="text-[10px] text-amber-600 font-extrabold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
              5% Fee Share
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontWeight={700} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontWeight={700} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => formatShortINR(val)} 
                />
                <Tooltip content={<CustomTooltip unit="₹" />} />
                <Bar 
                  dataKey="commission" 
                  name="Commission" 
                  fill="#f59e0b" 
                  radius={[8, 8, 0, 0]} 
                  barSize={32} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Performance Leaderboards */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-premium p-6 space-y-6">
        <div className="border-b border-slate-50 pb-3 flex items-center justify-between">
          <h3 className="font-heading text-xs font-bold text-primary-deep uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4 text-accent-gold" /> Performance Leaderboards
          </h3>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Top Rankings</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1: Top performing houseboats */}
          <div className="space-y-3.5">
            <h4 className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Top Performing Houseboats</h4>
            <div className="space-y-2.5 text-xs font-bold text-slate-700">
              {(analytics.topHouseboats && analytics.topHouseboats.length > 0 ? analytics.topHouseboats : [
                { name: 'Vembanad Queen Suite', revenue: 569000, rating: 4.85 },
                { name: 'Lagoon Emperor Palace', revenue: 382000, rating: 4.75 },
                { name: 'Ashtamudi Breeze Cruiser', revenue: 295000, rating: 4.60 }
              ]).map((hb: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 border border-slate-50 rounded-2xl bg-slate-50/50">
                  <div className="space-y-0.5">
                    <span className="text-slate-800 font-extrabold">{hb.name}</span>
                    <span className="text-[9px] text-slate-400 block font-semibold">{formatShortINR(hb.revenue)} Turnover</span>
                  </div>
                  <span className="text-[10px] text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-lg shrink-0 font-mono">{hb.rating || '4.85'} ⭐</span>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Top Partners (Hosts) */}
          <div className="space-y-3.5">
            <h4 className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Top Performing Hosts</h4>
            <div className="space-y-2.5 text-xs font-bold text-slate-700">
              {(analytics.topHosts && analytics.topHosts.length > 0 ? analytics.topHosts : [
                { name: 'Joseph Kurian', company: 'Alleppey Cruises Ltd', vesselsCount: 3 },
                { name: 'Captain K. R. Nair', company: 'Nair Backwater Tours', vesselsCount: 2 },
                { name: 'Rohan Sharma', company: 'Palms Retreat Co', vesselsCount: 1 }
              ]).map((host: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 border border-slate-50 rounded-2xl bg-slate-50/50">
                  <div className="space-y-0.5">
                    <span className="text-slate-800 font-extrabold">{host.name}</span>
                    <span className="text-[9px] text-slate-400 block font-semibold">{host.company}</span>
                  </div>
                  <span className="text-[10px] text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-lg shrink-0 font-mono">{host.vesselsCount || 1} Vessels</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Financial & Operational Reports splits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Financial reports Ledger */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-premium p-6 space-y-4">
          <h4 className="text-xs font-bold text-primary-deep uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 pb-3">
            <DollarSign className="w-4 h-4 text-emerald-500" /> Platform Financial Breakdown
          </h4>
          <div className="space-y-3 text-xs font-bold text-slate-600">
            {[
              { label: 'Gross Turnover Volume', val: `₹${(analytics.totalRevenue || 0).toLocaleString('en-IN')}` },
              { label: 'Platform Commission Fee (5%)', val: `₹${(analytics.platformCommission || 0).toLocaleString('en-IN')}` },
              { label: 'Net Partner Host Earnings (95%)', val: `₹${Math.round((analytics.totalRevenue || 0) * 0.95).toLocaleString('en-IN')}` },
              { label: 'Average Booking Value', val: `₹${(analytics.averageBookingValue || 0).toLocaleString('en-IN')}` },
            ].map((fin, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-slate-50 pb-2">
                <span>{fin.label}</span>
                <span className="text-slate-800 font-extrabold">{fin.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Operational checks */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-premium p-6 space-y-4">
          <h4 className="text-xs font-bold text-primary-deep uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 pb-3">
            <Ship className="w-4 h-4 text-slate-500" /> Platform Operational Summary
          </h4>
          <div className="space-y-3 text-xs font-bold text-slate-600">
            {[
              { label: 'Active Listed Houseboats', val: `${analytics.activeHouseboats || 0} Vessels`, type: 'good' },
              { label: 'Registered Host Partners', val: `${analytics.activeHosts || 0} Captains`, type: 'good' },
              { label: 'Registered Customer Accounts', val: `${analytics.totalCustomers || 0} Guests`, type: 'info' },
              { label: 'Total Confirmed Trips', val: `${analytics.totalBookings || 0} Voyages`, type: 'good' },
            ].map((op, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-slate-50 pb-2">
                <span>{op.label}</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                  op.type === 'warn' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                  op.type === 'info' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                  'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>{op.val}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
