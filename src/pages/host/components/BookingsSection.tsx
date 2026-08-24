import React, { useState, useEffect } from 'react';
import { 
  Search, Download, ChevronLeft, ChevronRight, Eye, MessageSquare, BookOpen, Loader2,
  X, User, Compass, Wallet
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Houseboat } from '../HostDashboard';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { LiveChatModal } from '../../../components/LiveChatModal';

interface BookingsSectionProps {
  fleet: Houseboat[];
}

export const BookingsSection: React.FC<BookingsSectionProps> = ({ fleet }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [boatFilter, setBoatFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [bookingsList, setBookingsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Drawer states
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);



  // Live Chat States
  const [activeChatBooking, setActiveChatBooking] = useState<any | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await api.get('/v1/bookings/host');
        const dbBookings = response.data?.data || [];
        
        const mapped = dbBookings.map((b: any) => {
          let paymentStatus = 'Pending';
          if (b.status === 'CONFIRMED' || b.status === 'CHECKED_IN' || b.status === 'COMPLETED') {
            paymentStatus = 'Paid';
          } else if (b.status === 'CANCELLED') {
            paymentStatus = 'Refunded';
          }

          let displayStatus = 'Confirmed';
          if (b.status === 'INITIATED') displayStatus = 'Pending Hold';
          if (b.status === 'CHECKED_IN') displayStatus = 'Checked In';
          if (b.status === 'COMPLETED') displayStatus = 'Completed';
          if (b.status === 'CANCELLED') displayStatus = 'Cancelled';

          const created = new Date(b.expiresAt || new Date());
          const dateCreated = created.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

          const start = new Date(b.checkInDate);
          const end = new Date(b.checkOutDate);
          const dates = `${start.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`;

          const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));
          const calcAmount = (typeof b.totalAmount === 'number' && b.totalAmount > 0) ? b.totalAmount : (typeof b.baseAmount === 'number' && b.baseAmount > 0) ? b.baseAmount : (b.pricingBreakdown?.totalAmount > 0) ? b.pricingBreakdown.totalAmount : (b.houseboat?.pricePerNight ? b.houseboat.pricePerNight * nights : 18000);

          return {
            id: b.bookingNumber,
            dbId: b.id,
            customerName: b.contactName || 'Guest Customer',
            phone: b.contactPhone || 'N/A',
            guests: (b.guests?.adults || b.adults || 1) + (b.guests?.children || b.children || 0),
            boatName: b.houseboat?.name || 'Houseboat',
            dates,
            amount: calcAmount,
            paymentStatus,
            status: displayStatus,
            dateCreated
          };
        });

        setBookingsList(mapped);
      } catch (err) {
        console.error('Failed to load host bookings:', err);
        toast.error('Could not sync host bookings ledger.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const fetchBookingDetails = async (dbId: string) => {
    const loadingToast = toast.loading('Syncing booking credentials...');
    try {
      const response = await api.get(`/v1/bookings/${dbId}`);
      const detail = response.data?.data;
      if (detail) {
        setSelectedBooking(detail);
        setIsDrawerOpen(true);
      } else {
        throw new Error('Details not found.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not fetch booking details.');
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  const handleHostCheckIn = async (bId: string, dbId: string) => {
    const loadingToast = toast.loading('Recording check-in on server...');
    try {
      await api.patch(`/v1/bookings/${dbId}/check-in`);
      toast.dismiss(loadingToast);
      toast.success('Guest check-in registered successfully!');
      
      setBookingsList(prev => prev.map(b => b.id === bId ? { ...b, status: 'Checked In' } : b));
      if (selectedBooking && selectedBooking.id === bId) {
        setSelectedBooking((prev: any) => ({ ...prev, status: 'CHECKED_IN' }));
      }
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.message || 'Failed to register check-in.');
    }
  };

  const handleHostCheckOut = async (bId: string, dbId: string) => {
    const loadingToast = toast.loading('Recording check-out on server...');
    try {
      await api.patch(`/v1/bookings/${dbId}/check-out`);
      toast.dismiss(loadingToast);
      toast.success('Guest check-out completed successfully!');
      
      setBookingsList(prev => prev.map(b => b.id === bId ? { ...b, status: 'Completed' } : b));
      if (selectedBooking && selectedBooking.id === bId) {
        setSelectedBooking((prev: any) => ({ ...prev, status: 'COMPLETED' }));
      }
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.message || 'Failed to register check-out.');
    }
  };

  const handleHostCancel = async (bId: string, dbId: string) => {
    const loadingToast = toast.loading('Processing cancellation on server...');
    try {
      await api.patch(`/v1/bookings/${dbId}/cancel`);
      toast.dismiss(loadingToast);
      toast.success('Booking cancelled successfully.');
      
      setBookingsList(prev => prev.map(b => b.id === bId ? { ...b, status: 'Cancelled' } : b));
      if (selectedBooking && selectedBooking.id === bId) {
        setSelectedBooking((prev: any) => ({ ...prev, status: 'CANCELLED' }));
      }
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.message || 'Failed to cancel booking.');
    }
  };


  const handleExportPDF = () => {
    const listToExport = filteredBookings.length > 0 ? filteredBookings : bookingsList;
    if (listToExport.length === 0) {
      toast.error('No booking records available to export.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups to export PDF.');
      return;
    }

    const totalRevenue = listToExport.reduce((acc: number, item: any) => {
      if (item.status !== 'Cancelled') {
        const val = typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount).replace(/[^0-9.]/g, '')) || 0;
        return acc + val;
      }
      return acc;
    }, 0);

    const dateStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const rowsHtml = listToExport.map((b: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: #1e293b;">${b.id}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: bold; color: #0f172a;">${b.customerName}</div>
          <div style="font-size: 11px; color: #64748b;">${b.customerPhone || 'N/A'}</div>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155;">${b.boatName}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: 600; color: #334155;">${b.dateRange}</div>
          <div style="font-size: 11px; color: #64748b;">${b.guestsCount || b.guests || 2} Guest(s)</div>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0f172a; text-align: right;">₹${typeof b.amount === 'number' ? b.amount.toLocaleString('en-IN') : b.amount}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">
          <span style="display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; background-color: ${b.paymentStatus === 'Paid' ? '#dcfce7' : b.paymentStatus === 'Refunded' ? '#fee2e2' : '#fef3c7'}; color: ${b.paymentStatus === 'Paid' ? '#15803d' : b.paymentStatus === 'Refunded' ? '#b91c1c' : '#b45309'};">
            ${b.paymentStatus}
          </span>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">
          <span style="display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; background-color: ${b.status === 'Completed' ? '#dcfce7' : b.status === 'Checked In' ? '#e0e7ff' : b.status === 'Cancelled' ? '#fee2e2' : '#e0f2fe'}; color: ${b.status === 'Completed' ? '#15803d' : b.status === 'Checked In' ? '#4338ca' : b.status === 'Cancelled' ? '#b91c1c' : '#0369a1'};">
            ${b.status}
          </span>
        </td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Trip Bookings Ledger Statement - b4boat</title>
        <style>
          @page { size: A4 landscape; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 20px; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
          .logo span { color: #0284c7; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; font-weight: 500; }
          .meta { text-align: right; font-size: 11px; color: #475569; }
          .meta strong { color: #0f172a; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 25px; }
          .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 12px; }
          .stat-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
          .stat-value { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th { background: #0f172a; color: #ffffff; text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
          th.right { text-align: right; }
          th.center { text-align: center; }
          .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">b4boat<span>.</span></div>
            <div class="subtitle">Official Host Trip Bookings & Guest Reservation Ledger</div>
          </div>
          <div class="meta">
            <div>Host Partner: <strong>${user?.name || 'Vembanad Cruises'}</strong></div>
            <div>Generated: <strong>${dateStr}</strong></div>
            <div>Records Count: <strong>${listToExport.length} Bookings</strong></div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total Ledger Volume</div>
            <div class="stat-value">₹${totalRevenue.toLocaleString('en-IN')}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Bookings</div>
            <div class="stat-value">${listToExport.length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Confirmed / Checked-In</div>
            <div class="stat-value">${listToExport.filter((b: any) => b.status === 'Confirmed' || b.status === 'Checked In').length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Completed Voyages</div>
            <div class="stat-value">${listToExport.filter((b: any) => b.status === 'Completed').length}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Guest Name</th>
              <th>Vessel Name</th>
              <th>Voyage Period</th>
              <th class="right">Total Amount</th>
              <th class="center">Payment</th>
              <th class="center">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <div>b4boat Fleet & Reservation Ledger System &bull; Confidential Host Document</div>
          <div>Generated directly from Host Portal</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    toast.success('Exporting PDF statement...');
  };

  const filteredBookings = bookingsList.filter((b) => {
    const matchesSearch = b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.boatName.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || b.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesBoat = boatFilter === 'all' || b.boatName.toLowerCase().includes(boatFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesBoat;
  });

  const totalPages = Math.ceil(filteredBookings.length / rowsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalReservationsCount = bookingsList.length;
  const confirmedCount = bookingsList.filter(b => b.status === 'Confirmed' || b.status === 'Checked In').length;
  const completedCount = bookingsList.filter(b => b.status === 'Completed').length;
  const cancelledCount = bookingsList.filter(b => b.status === 'Cancelled').length;

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400 font-semibold flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary-deep" />
        Syncing guest reservation ledgers...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-extrabold text-primary-deep flex items-center gap-2">
            Trip Bookings Ledger <BookOpen className="w-5 h-5 text-teal-600" />
          </h1>
          <p className="text-xs text-slate-400 font-semibold font-sans">Monitor, search, and manage all guest reservations and invoice statuses.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            type="button"
            onClick={handleExportPDF}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export PDF
          </button>
        </div>
      </div>

      {/* Top Cards Statistics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings', val: `${totalReservationsCount} Reservations` },
          { label: 'Confirmed Bookings', val: `${confirmedCount} Confirmed` },
          { label: 'Completed Trips', val: `${completedCount} Trips` },
          { label: 'Cancelled / Refunded', val: `${cancelledCount} Cancelled` }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-premium flex flex-col justify-between gap-3 text-xs font-bold">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
            <span className="text-sm font-extrabold text-primary-deep">{stat.val}</span>
          </div>
        ))}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-100 p-3.5 sm:p-4 shadow-premium space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer, boat, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-secondary-emerald transition-all"
            />
          </div>
          
          {/* Filter Dropdowns - Grid on mobile so they fit 100% width cleanly! */}
          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-200/90 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-secondary-emerald cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={boatFilter}
              onChange={(e) => setBoatFilter(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-200/90 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-secondary-emerald cursor-pointer truncate"
            >
              <option value="all">All Fleet</option>
              {fleet.map((boat) => (
                <option key={boat.id} value={boat.name.split(' ')[0].toLowerCase()}>
                  {boat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table Ledger */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-premium p-4 sm:p-6">
        
        {/* 1. Mobile Cards View (Visible on Mobile screens) */}
        <div className="block md:hidden space-y-4">
          {paginatedBookings.length > 0 ? (
            paginatedBookings.map((b) => (
              <div 
                key={b.id}
                className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-3 shadow-xs"
              >
                {/* Header: ID + Status */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-800 block">{b.id}</span>
                    <span className="text-[9px] font-semibold text-slate-400 block">Created: {b.dateCreated}</span>
                  </div>
                  <span className={`inline-flex items-center text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                    b.status === 'Confirmed' ? 'bg-sky-50 text-sky-600 border-sky-200' :
                    b.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                    'bg-rose-50 text-rose-600 border-rose-200'
                  }`}>
                    {b.status}
                  </span>
                </div>

                {/* Customer & Houseboat */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Guest</span>
                    <span className="font-extrabold text-slate-800 block truncate">{b.customerName}</span>
                    {b.phone && (
                      <a href={`tel:${b.phone}`} className="text-[10px] font-semibold text-secondary-emerald block hover:underline">
                        {b.phone}
                      </a>
                    )}
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Houseboat</span>
                    <span className="font-extrabold text-slate-800 block truncate">{b.boatName}</span>
                  </div>
                </div>

                {/* Dates & Amount */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Dates</span>
                    <span className="font-semibold text-slate-700 block">{b.dates}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Amount Paid</span>
                    <span className="font-extrabold text-slate-900 block text-sm">₹{typeof b.amount === 'number' ? b.amount.toLocaleString('en-IN') : b.amount}</span>
                    <span className={`inline-block text-[8px] font-bold px-1.5 py-0.2 rounded border uppercase ${
                      b.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                    }`}>
                      {b.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => fetchBookingDetails(b.dbId)}
                    className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" /> View Details
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveChatBooking(b);
                      setIsChatOpen(true);
                    }}
                    className="flex-1 py-2 px-3 bg-primary-deep text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs hover:bg-primary-light transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Message
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-400 font-semibold text-xs">
              No matching trip bookings found.
            </div>
          )}
        </div>

        {/* 2. Desktop Table View (Visible on Medium+ screens) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs font-bold text-slate-600 whitespace-nowrap min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px] tracking-wider">
                <th className="pb-3">Booking ID</th>
                <th className="pb-3">Customer Details</th>
                <th className="pb-3">Houseboat Name</th>
                <th className="pb-3">Trip Dates</th>
                <th className="pb-3 text-right">Amount Paid</th>
                <th className="pb-3 text-center">Status</th>
                <th className="pb-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedBookings.length > 0 ? (
                paginatedBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="py-4 font-mono text-slate-800">{b.id}</td>
                    <td className="py-4">
                      <span className="text-slate-800 font-extrabold block">{b.customerName}</span>
                      <span className="text-[9px] text-slate-400 font-semibold block">{b.phone}</span>
                    </td>
                    <td className="py-4 text-slate-800">{b.boatName}</td>
                    <td className="py-4 text-slate-400 font-semibold">
                      <span className="text-slate-700 block">{b.dates}</span>
                      <span className="text-[9px] text-slate-400 block">Created: {b.dateCreated}</span>
                    </td>
                    <td className="py-4 text-right">
                      <span className="text-slate-800 font-extrabold block">₹{b.amount.toLocaleString('en-IN')}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                        b.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${
                        b.status === 'Confirmed' ? 'bg-sky-50 text-sky-600 border-sky-100' :
                        b.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <div className="flex gap-1.5 justify-center">
                        <button
                          type="button"
                          onClick={() => fetchBookingDetails(b.dbId)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-pointer shadow-sm"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveChatBooking(b);
                            setIsChatOpen(true);
                          }}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-pointer shadow-sm"
                          title="Message Guest"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-semibold">
                    No matching trip bookings found in ledger.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredBookings.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-50 pt-4 mt-4 text-slate-500 font-semibold">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 font-bold focus:outline-none cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
              <span>Showing {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, filteredBookings.length)} of {filteredBookings.length} bookings</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-slate-700">Page {currentPage} of {totalPages || 1}</span>
              <button
                type="button"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-out Booking Details Drawer */}
      {isDrawerOpen && selectedBooking && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white h-full p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-heading text-base font-extrabold text-primary-deep">
                    Reservation Details
                  </h3>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Booking ID: {selectedBooking.bookingNumber}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Status Badge */}
              <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <span className="text-xs font-bold text-slate-500">Booking Status</span>
                <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                  selectedBooking.status === 'CONFIRMED' ? 'bg-sky-50 text-sky-600 border border-sky-100' :
                  selectedBooking.status === 'CHECKED_IN' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                  selectedBooking.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                  selectedBooking.status === 'CANCELLED' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                  'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {selectedBooking.status}
                </span>
              </div>

              {/* Guest Information */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3">
                <h4 className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Primary Guest details
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">Full Name</span>
                    <span className="text-slate-800">{selectedBooking.contactName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">Phone Number</span>
                    <span className="text-slate-800 font-mono">{selectedBooking.contactPhone}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">Email Contact</span>
                    <span className="text-slate-800 font-mono block truncate">{selectedBooking.contactEmail}</span>
                  </div>
                </div>
              </div>

              {/* Cruise Information */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3">
                <h4 className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-slate-400" /> Voyage Coordinates
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">Houseboat</span>
                    <span className="text-slate-800 line-clamp-1">{selectedBooking.houseboat.name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">Location</span>
                    <span className="text-slate-800">{selectedBooking.houseboat.location}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">Check-In Date</span>
                    <span className="text-slate-800">{new Date(selectedBooking.checkInDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">Check-Out Date</span>
                    <span className="text-slate-800">{new Date(selectedBooking.checkOutDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">Guests count</span>
                    <span className="text-slate-800">{selectedBooking.guests?.adults || selectedBooking.adults} Adults {selectedBooking.guests?.children || selectedBooking.children ? `, ${(selectedBooking.guests?.children || selectedBooking.children)} Children` : ''}</span>
                  </div>
                </div>
              </div>

              {/* Payout Information */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3">
                <h4 className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-slate-400" /> Host Payout split
                </h4>
                <div className="space-y-1.5 text-xs font-bold text-slate-600">
                  <div className="flex justify-between">
                    <span>Base Fare Paid:</span>
                    <span className="text-slate-800 font-extrabold">₹{selectedBooking.pricingBreakdown?.totalAmount?.toLocaleString('en-IN') || selectedBooking.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span>Platform Commission Split (5%):</span>
                    <span className="text-slate-500 font-extrabold">₹{selectedBooking.pricingBreakdown?.platformFee?.toLocaleString('en-IN') || selectedBooking.platformFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span>GST (18%):</span>
                    <span className="text-slate-800 font-extrabold">₹{selectedBooking.pricingBreakdown?.taxAmount?.toLocaleString('en-IN') || selectedBooking.taxAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-800 font-extrabold pt-1">
                    <span>Net Payout to Host:</span>
                    <span>₹{((selectedBooking.pricingBreakdown?.totalAmount || selectedBooking.totalAmount) - (selectedBooking.pricingBreakdown?.platformFee || selectedBooking.platformFee)).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {selectedBooking.specialRequests && (
                <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 space-y-1">
                  <span className="text-[9px] text-amber-600 uppercase font-bold tracking-wider block">Special requests</span>
                  <p className="text-[11px] text-amber-800 font-semibold font-sans leading-relaxed">{selectedBooking.specialRequests}</p>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="border-t border-slate-100 pt-4 mt-6 flex justify-between items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveChatBooking({
                    dbId: selectedBooking.id,
                    id: selectedBooking.bookingNumber,
                    boatName: selectedBooking.houseboat.name,
                    customerName: selectedBooking.contactName
                  });
                  setIsChatOpen(true);
                }}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Message Customer
              </button>

              <div className="flex gap-2">
                {selectedBooking.status === 'CONFIRMED' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleHostCancel(selectedBooking.bookingNumber, selectedBooking.id)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-4 py-2.5 rounded-xl text-[10px] cursor-pointer"
                    >
                      Cancel Voyage
                    </button>
                    <button
                      type="button"
                      onClick={() => handleHostCheckIn(selectedBooking.bookingNumber, selectedBooking.id)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-[10px] cursor-pointer shadow-sm"
                    >
                      Check-In Guest
                    </button>
                  </>
                )}
                {selectedBooking.status === 'CHECKED_IN' && (
                  <button
                    type="button"
                    onClick={() => handleHostCheckOut(selectedBooking.bookingNumber, selectedBooking.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-[10px] cursor-pointer shadow-sm"
                  >
                    Check-Out Voyage
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Live Chat Interface Overlay */}
      {isChatOpen && activeChatBooking && (
        <LiveChatModal
          isOpen={isChatOpen}
          onClose={() => {
            setIsChatOpen(false);
            setActiveChatBooking(null);
          }}
          bookingId={activeChatBooking.dbId}
          currentUserId={user?.id || user?.uuid || 'host-user'}
          currentUserName={user?.name || 'Vessel Partner'}
          roomTitle={`Chat with Customer regarding ${activeChatBooking.boatName}`}
          subTitle={`ID: ${activeChatBooking.id}`}
        />
      )}

    </div>
  );
};
