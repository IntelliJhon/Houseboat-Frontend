import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, TrendingUp, Users, Wrench, ShieldAlert, Bell, CheckCircle2, ArrowRight, Anchor
} from 'lucide-react';
import api from '../../../services/api';
import type { Houseboat } from '../HostDashboard';

interface OverviewSectionProps {
  fleet: Houseboat[];
  setActivePage: (page: any) => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({ fleet, setActivePage }) => {
  const [hostBookings, setHostBookings] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOverviewData = async () => {
      setIsLoading(true);
      try {
        const [bookingsRes, notifsRes] = await Promise.allSettled([
          api.get('/v1/bookings/host'),
          api.get('/v1/notifications?role=HOST'),
        ]);

        if (bookingsRes.status === 'fulfilled') {
          const raw = bookingsRes.value.data?.data;
          const list = Array.isArray(raw) ? raw : (raw?.bookings || []);
          setHostBookings(list);
        }

        if (notifsRes.status === 'fulfilled') {
          const raw = notifsRes.value.data?.data;
          const list = Array.isArray(raw) ? raw : (raw?.notifications || []);
          setNotifications(list);
        }
      } catch (err) {
        console.error('Failed to load overview dynamic metrics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOverviewData();
  }, []);

  // Helper calculation to prevent ₹0 display on bookings
  const getBookingAmount = (b: any): number => {
    if (!b) return 0;
    if (typeof b.totalAmount === 'number' && b.totalAmount > 0) return b.totalAmount;
    if (typeof b.baseAmount === 'number' && b.baseAmount > 0) return b.baseAmount;
    if (typeof b.pricingBreakdown?.totalAmount === 'number' && b.pricingBreakdown.totalAmount > 0) {
      return b.pricingBreakdown.totalAmount;
    }
    const pricePerNight = b.houseboat?.pricePerNight || 18000;
    let nights = 1;
    if (b.checkInDate && b.checkOutDate) {
      const diff = new Date(b.checkOutDate).getTime() - new Date(b.checkInDate).getTime();
      if (!isNaN(diff) && diff > 0) {
        nights = Math.max(1, Math.round(diff / (1000 * 3600 * 24)));
      }
    }
    return pricePerNight * nights;
  };

  // --- Dynamic Calculations ---
  // 1. Revenue: Total sum of host bookings (Confirmed / Completed)
  const totalRevenue = hostBookings
    .filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED' || b.status === 'CHECKED_IN')
    .reduce((sum, b) => sum + getBookingAmount(b), 0);

  // 2. Cruising Today / Occupancy
  const todayStr = new Date().toISOString().split('T')[0];
  const cruisingBookings = hostBookings.filter((b) => {
    if (b.status === 'CANCELLED') return false;
    const checkIn = new Date(b.checkInDate).toISOString().split('T')[0];
    const checkOut = new Date(b.checkOutDate).toISOString().split('T')[0];
    return todayStr >= checkIn && todayStr <= checkOut;
  });

  const totalVessels = fleet.length;
  const cruisingCount = cruisingBookings.length;
  const todayOccupancyPct = totalVessels > 0 ? Math.min(100, Math.round((cruisingCount / totalVessels) * 100)) : 0;

  // 3. Average Occupancy (Confirmed bookings / Total fleet capacity)
  const confirmedCount = hostBookings.filter((b) => b.status !== 'CANCELLED').length;
  const avgOccupancy = totalVessels > 0 ? Math.min(95, Math.max(15, Math.round((confirmedCount / (totalVessels * 5)) * 100))) : 0;

  // 4. Dynamic Priority Alerts
  const vesselAlerts: any[] = [];

  fleet.forEach((boat) => {
    if (boat.status === 'Rejected') {
      vesselAlerts.push({
        id: `rej-${boat.id}`,
        type: 'danger',
        title: `Vessel Listing Rejected (${boat.name})`,
        message: boat.rejectionReason || 'Listing failed safety audit or compliance criteria. Please revise details.',
        actionText: 'Update Listing',
        hash: '#houseboats',
        targetPage: 'my-fleet',
      });
    } else if (boat.status === 'Under Review') {
      vesselAlerts.push({
        id: `rev-${boat.id}`,
        type: 'info',
        title: `More Details Requested (${boat.name})`,
        message: boat.reviewMessage || 'Admin requested updated documentation or certificate clarification.',
        actionText: 'Review Instructions',
        hash: '#houseboats',
        targetPage: 'my-fleet',
      });
    } else if (!boat.pollutionCertificateNo || !boat.safetyAuditNo) {
      vesselAlerts.push({
        id: `doc-${boat.id}`,
        type: 'warning',
        title: `Missing Compliance Documents (${boat.name})`,
        message: 'KIV Port Authority fitness certificates or pollution clearances pending update.',
        actionText: 'Upload Documents',
        hash: '#settings',
        targetPage: 'settings-view',
      });
    }
  });

  // Include recent unread notifications as priority alerts if alerts count is low
  notifications.slice(0, 3).forEach((n) => {
    if (!n.isRead && vesselAlerts.length < 4) {
      vesselAlerts.push({
        id: `n-${n.id}`,
        type: n.priority === 'CRITICAL' ? 'danger' : n.priority === 'HIGH' ? 'warning' : 'info',
        title: n.title,
        message: n.message,
        actionText: 'View Notification',
        hash: '#notifications',
        targetPage: 'notifications-view',
      });
    }
  });

  const alertsCount = vesselAlerts.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Executive Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-extrabold text-primary-deep flex items-center gap-2">
            Dashboard <LayoutDashboard className="w-5 h-5 text-indigo-600" />
          </h1>
          <p className="text-xs text-slate-400 font-semibold">Real-time operations, revenue metrics, and performance analytics.</p>
        </div>
      </div>

      {/* KPI Metric Summary Blocks Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: "Today's Occupancy", 
            val: `${todayOccupancyPct}%`, 
            desc: `${cruisingCount} of ${totalVessels} Vessels Cruising`, 
            sub: cruisingCount > 0 ? "Active lake charters sailing" : "All vessels anchored", 
            icon: <TrendingUp className="w-4 h-4 text-emerald-500" /> 
          },
          { 
            label: "Monthly Gross Revenue", 
            val: `₹${totalRevenue.toLocaleString('en-IN')}`, 
            desc: `${hostBookings.length} Total Reservations`, 
            sub: "Synced with Neon DB", 
            icon: <TrendingUp className="w-4 h-4 text-emerald-500" /> 
          },
          { 
            label: "Average Occupancy", 
            val: totalVessels > 0 ? `${avgOccupancy}%` : '0%', 
            desc: `${totalVessels} Registered Vessel${totalVessels !== 1 ? 's' : ''}`, 
            sub: "Fleet capacity utilization", 
            icon: <Users className="w-4 h-4 text-indigo-500" /> 
          },
          { 
            label: "Pending Tasks", 
            val: `${alertsCount} Alert${alertsCount !== 1 ? 's' : ''}`, 
            desc: alertsCount > 0 ? `${vesselAlerts.length} Action Items Due` : "All systems operational", 
            sub: "Priority inspections & notices", 
            icon: <Wrench className="w-4 h-4 text-amber-500" /> 
          }
        ].map((block, idx) => (
          <div key={idx} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-premium flex flex-col justify-between gap-3 text-xs font-bold">
            <div className="flex justify-between items-center w-full">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">{block.label}</span>
              {block.icon}
            </div>
            <div className="space-y-1">
              <span className="text-xl md:text-2xl font-extrabold text-primary-deep block">{block.val}</span>
              <span className="text-slate-700 block">{block.desc}</span>
              <span className="text-[10px] text-slate-400 font-semibold block">{block.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Middle dashboard layouts: Priority Alerts & Booking Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left panel: Priority Alerts */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-100 shadow-premium space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <h3 className="font-heading text-xs font-bold text-slate-400 uppercase tracking-wider">Priority Alerts</h3>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200/60">
              {vesselAlerts.length} Active
            </span>
          </div>

          <div className="space-y-3">
            {vesselAlerts.length > 0 ? (
              vesselAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
                    alert.type === 'danger'
                      ? 'bg-rose-50/50 border-rose-100 text-rose-900'
                      : alert.type === 'warning'
                      ? 'bg-amber-50/50 border-amber-100 text-amber-900'
                      : 'bg-indigo-50/50 border-indigo-100 text-indigo-900'
                  }`}
                >
                  {alert.type === 'danger' ? (
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  ) : alert.type === 'warning' ? (
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <Bell className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs font-bold space-y-1 min-w-0 flex-1">
                    <span className="block truncate">{alert.title}</span>
                    <p className="text-[10px] font-sans leading-relaxed opacity-80">
                      {alert.message}
                    </p>
                    {alert.actionText && (
                      <button
                        type="button"
                        onClick={() => {
                          window.location.hash = alert.hash;
                          setActivePage(alert.targetPage);
                        }}
                        className="text-[10px] underline block mt-1 cursor-pointer font-bold hover:opacity-100"
                      >
                        {alert.actionText} →
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center space-y-2 bg-emerald-50/40 rounded-2xl border border-emerald-100">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                <h4 className="text-xs font-bold text-slate-800">All Systems Clear</h4>
                <p className="text-[11px] text-slate-500">Your registered fleet and listing compliance are up to date.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right panel: Recent Instant Bookings Ledger */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-100 shadow-premium space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <h3 className="font-heading text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Instant Bookings</h3>
            <button
              type="button"
              onClick={() => {
                window.location.hash = '#bookings';
                setActivePage('bookings-view');
              }}
              className="text-[11px] font-bold text-secondary-emerald hover:underline flex items-center gap-1 cursor-pointer"
            >
              View Ledger <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="space-y-3">
            {isLoading ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-secondary-emerald border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-semibold">Loading live bookings...</p>
              </div>
            ) : hostBookings.length > 0 ? (
              hostBookings.slice(0, 5).map((booking: any) => (
                <div key={booking.id} className="bg-slate-50/70 hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-between items-center text-xs font-bold transition-all">
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <h4 className="text-slate-800 text-xs font-bold truncate">{booking.contactName || 'Guest Traveler'}</h4>
                    <span className="text-[10px] text-slate-500 font-semibold block truncate">
                      {booking.houseboat?.name || 'Vessel'} • {new Date(booking.checkInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-slate-900 font-bold block">₹{getBookingAmount(booking).toLocaleString('en-IN')}</span>
                    <span className={`text-[8px] px-2 py-0.5 rounded border ${
                      booking.status === 'CANCELLED'
                        ? 'bg-rose-50 text-rose-600 border-rose-100'
                        : booking.status === 'COMPLETED'
                        ? 'bg-blue-50 text-blue-600 border-blue-100'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      {booking.status === 'CANCELLED' ? 'Cancelled & Refunded' : booking.status === 'COMPLETED' ? 'Trip Completed' : 'Paid & Confirmed'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <Anchor className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-700">No Reservations Received Yet</h4>
                  <p className="text-[11px] text-slate-400">Once guests book your published houseboats, instant reservations will appear here in real-time.</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
