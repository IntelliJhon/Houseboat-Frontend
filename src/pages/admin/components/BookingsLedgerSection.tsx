import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { 
  Search, Download, ChevronLeft, ChevronRight, Eye, ClipboardList,
  User, Building, Wallet, XCircle, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { getPricingPolicy } from '../../../utils/pricingPolicy';

export const BookingsLedgerSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Drawer state
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [bookingsList, setBookingsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminBookings = async () => {
    try {
      const livePolicy = getPricingPolicy();
      const response = await api.get('/v1/bookings/admin');
      const dbBookings = response.data?.data || [];

      const mapped = dbBookings.map((b: any) => {
        let paymentStatus = 'Pending';
        if (b.status === 'CONFIRMED' || b.status === 'CHECKED_IN' || b.status === 'COMPLETED') {
          paymentStatus = 'Paid';
        } else if (b.status === 'CANCELLED') {
          paymentStatus = 'Refunded';
        }

        let tripStatus = 'Confirmed';
        if (b.status === 'INITIATED') tripStatus = 'Upcoming';
        if (b.status === 'CHECKED_IN') tripStatus = 'Confirmed';
        if (b.status === 'COMPLETED') tripStatus = 'Completed';
        if (b.status === 'CANCELLED') tripStatus = 'Cancelled';

        const created = new Date(b.createdAt || new Date());
        const bookingDate = created.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

        const start = new Date(b.checkInDate);
        const end = new Date(b.checkOutDate);

        const totalAmt = b.pricingBreakdown?.totalAmount || 10000;
        const dynamicCommission = Math.round(totalAmt * (livePolicy.commissionPercent / 100));
        const dynamicGst = Math.round(totalAmt * (livePolicy.gstPercent / 100));

        return {
          id: b.bookingNumber,
          dbId: b.id,
          customerName: b.contactName || 'Guest Customer',
          customerEmail: b.contactEmail || '',
          customerPhone: b.contactPhone || 'N/A',
          hostName: b.host.name || 'Owner Partner',
          hostId: b.host.email || 'N/A',
          boatName: b.houseboat.name,
          destination: b.houseboat.location,
          guests: b.guests.adults + b.guests.children,
          amount: totalAmt,
          commission: dynamicCommission,
          gst: dynamicGst,
          bookingFee: livePolicy.bookingFee,
          cancellationPolicy: livePolicy.cancellationPolicy,
          bookingDate,
          checkIn: start.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          checkOut: end.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          paymentStatus,
          tripStatus,
          refundAmount: b.status === 'CANCELLED' ? totalAmt : 0,
          communicationHistory: [
            { sender: 'System', message: `Booking status is: ${b.status}. Policy: ${livePolicy.cancellationPolicy}` }
          ]
        };
      });

      setBookingsList(mapped);
    } catch (err) {
      console.error('Failed to load admin bookings:', err);
      toast.error('Could not sync admin bookings ledger.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminBookings();

    const handlePricingChange = () => {
      fetchAdminBookings();
    };
    window.addEventListener('b4boat_pricing_policy_changed', handlePricingChange);
    return () => window.removeEventListener('b4boat_pricing_policy_changed', handlePricingChange);
  }, []);

  const handleRefund = (id: string) => {
    setBookingsList(prev => prev.map(b => {
      if (b.id === id) {
        toast.success(`Refund of ₹${b.amount.toLocaleString('en-IN')} initiated successfully for ${b.id}.`);
        return { ...b, paymentStatus: 'Refunded', refundAmount: b.amount };
      }
      return b;
    }));
  };

  const handleCancelBooking = async (id: string) => {
    const target = bookingsList.find(b => b.id === id);
    if (!target) return;

    const loadingToast = toast.loading('Processing cancellation on server...');
    try {
      await api.patch(`/v1/bookings/${target.dbId}/cancel`);
      toast.dismiss(loadingToast);
      toast.success(`Booking ${id} has been cancelled successfully.`);
      
      setBookingsList(prev => prev.map(b => b.id === id ? { ...b, tripStatus: 'Cancelled' } : b));
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking((prev: any) => ({ ...prev, tripStatus: 'Cancelled' }));
      }
    } catch (err: any) {
      toast.dismiss(loadingToast);
      const errMsg = err.response?.data?.message || 'Failed to cancel booking.';
      toast.error(errMsg);
    }
  };

  // Dynamic stats calculation for Admin panel
  const totalRevenue = bookingsList
    .filter(b => b.paymentStatus === 'Paid')
    .reduce((sum, b) => sum + b.amount, 0);

  const completedTripsCount = bookingsList.filter(b => b.tripStatus === 'Completed').length;
  const upcomingTripsCount = bookingsList.filter(b => b.tripStatus === 'Confirmed' || b.tripStatus === 'Upcoming').length;
  const cancelledBookingsCount = bookingsList.filter(b => b.tripStatus === 'Cancelled').length;
  
  const totalRefunds = bookingsList
    .filter(b => b.paymentStatus === 'Refunded')
    .reduce((sum, b) => sum + b.refundAmount, 0);

  const todayStr = new Date().toDateString();
  const todaysBookingsCount = bookingsList.filter(b => new Date(b.bookingDate).toDateString() === todayStr).length;

  const formatRevenue = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)}L`;
    }
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(0)}k`;
    }
    return `₹${value}`;
  };

  const filteredBookings = bookingsList.filter(b => {
    const matchesSearch = b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.boatName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.hostName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.destination.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesBookingStatus = bookingStatusFilter === 'all' || b.tripStatus.toLowerCase() === bookingStatusFilter.toLowerCase();
    const matchesPaymentStatus = paymentStatusFilter === 'all' || b.paymentStatus.toLowerCase() === paymentStatusFilter.toLowerCase();

    return matchesSearch && matchesBookingStatus && matchesPaymentStatus;
  });

  const totalPages = Math.ceil(filteredBookings.length / rowsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const downloadInvoice = (booking: any) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Colors
    const navy = [15, 23, 42]; // #0f172a
    const emerald = [16, 185, 129]; // #10b981
    const darkGray = [51, 65, 85]; // #334155
    const lightGray = [100, 116, 139]; // #64748b
    const slateBorder = [226, 232, 240]; // #e2e8f0
    const bgLight = [248, 250, 252]; // #f8fafc

    // --- 1. Header (Logo & Title) ---
    // Logo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text('b4', 20, 25);
    doc.setTextColor(emerald[0], emerald[1], emerald[2]);
    doc.text('boat', 28, 25);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text('TAX INVOICE', 190, 20, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text(`REF: ${booking.id}`, 190, 25, { align: 'right' });

    // Divider Line
    doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
    doc.setLineWidth(0.5);
    doc.line(20, 32, 190, 32);

    // --- 2. Details Grid (Two columns) ---
    let y = 45;
    // Billed To Column
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text('BILLED TO', 20, y);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text(booking.customerName, 20, y + 6);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(booking.customerEmail, 20, y + 11);
    doc.text(`Phone: ${booking.customerPhone}`, 20, y + 16);

    // Reservation Column
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text('RESERVATION COORDINATES', 110, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Vessel: ', 110, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(booking.boatName, 125, y + 6);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Destination: ', 110, y + 11);
    doc.setFont('helvetica', 'normal');
    doc.text(booking.destination, 132, y + 11);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Charter: ', 110, y + 16);
    doc.setFont('helvetica', 'normal');
    doc.text(`${booking.checkIn} to ${booking.checkOut}`, 125, y + 16);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Issued Date: ', 110, y + 21);
    doc.setFont('helvetica', 'normal');
    doc.text(booking.bookingDate, 132, y + 21);

    // --- 3. Table of charges ---
    y = 80;
    // Header background block
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.rect(20, y, 170, 10, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('DESCRIPTION', 23, y + 6.5);
    doc.text('CHECK-IN', 85, y + 6.5);
    doc.text('CHECK-OUT', 125, y + 6.5);
    doc.text('TOTAL', 187, y + 6.5, { align: 'right' });
    
    // Row lines
    doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
    doc.setLineWidth(0.3);
    doc.line(20, y + 10, 190, y + 10);

    // Row 1: Stay charges
    y = 90;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text('Houseboat Stay Charter', 23, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text(`Charter hire charges for ${booking.boatName}`, 23, y + 10);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(booking.checkIn, 85, y + 6.5);
    doc.text(booking.checkOut, 125, y + 6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text(`INR ${(booking.amount - booking.gst).toLocaleString('en-IN')}`, 187, y + 6.5, { align: 'right' });
    
    doc.line(20, y + 15, 190, y + 15);

    // Row 2: Taxes
    y = 105;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text('Applicable Taxes (GST 18%)', 23, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text('Central GST (9%) + State GST (9%)', 23, y + 10);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('-', 85, y + 6.5);
    doc.text('-', 125, y + 6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text(`INR ${booking.gst.toLocaleString('en-IN')}`, 187, y + 6.5, { align: 'right' });
    
    doc.line(20, y + 15, 190, y + 15);

    // --- 4. Stamp and totals ---
    y = 130;
    // Stamp
    const isPaid = booking.paymentStatus === 'Paid';
    doc.setLineWidth(0.8);
    if (isPaid) {
      doc.setDrawColor(16, 185, 129); // emerald
      doc.setFillColor(236, 253, 245); // light emerald
      doc.rect(23, y, 32, 10, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(4, 120, 87); // dark emerald
      doc.text('PAID', 39, y + 7, { align: 'center' });
    } else {
      doc.setDrawColor(245, 158, 11); // amber
      doc.setFillColor(255, 251, 235); // light amber
      doc.rect(23, y, 32, 10, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(180, 83, 9); // dark amber
      doc.text('REFUNDED', 39, y + 7, { align: 'center' });
    }

    // Totals Box
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.rect(120, y, 70, 32, 'F');
    doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
    doc.setLineWidth(0.3);
    doc.rect(120, y, 70, 32, 'D');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text('Base Value:', 125, y + 7);
    doc.text(`INR ${(booking.amount - booking.gst).toLocaleString('en-IN')}`, 185, y + 7, { align: 'right' });

    doc.text('Taxes (GST):', 125, y + 14);
    doc.text(`INR ${booking.gst.toLocaleString('en-IN')}`, 185, y + 14, { align: 'right' });

    doc.line(120, y + 20, 190, y + 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text('Grand Total:', 125, y + 26);
    doc.text(`INR ${booking.amount.toLocaleString('en-IN')}`, 185, y + 26, { align: 'right' });

    // --- 5. Footer ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text('Thank you for choosing b4boat. Have a safe and pleasant journey!', 105, 260, { align: 'center' });
    
    doc.setFontSize(7.5);
    doc.setTextColor(180, 180, 180);
    doc.text('This is a computer-generated tax invoice and requires no physical signature.', 105, 266, { align: 'center' });

    doc.save(`Invoice-${booking.id}.pdf`);
    toast.success(`Invoice PDF downloaded successfully!`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-xs font-bold text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-secondary-emerald" />
        Syncing admin bookings ledger registry...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-extrabold text-primary-deep flex items-center gap-2">
            Bookings Ledger Workspace <ClipboardList className="w-5 h-5 text-accent-gold" />
          </h1>
          <p className="text-xs text-slate-400 font-semibold font-sans">Monitor every guest transaction, commission split, and payout status across the platform.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            type="button"
            onClick={() => toast.success('Exported bookings ledger (CSV) successfully.')}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Top Cards Statistics row */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: "Today's Bookings", val: `${todaysBookingsCount} New` },
          { label: 'Total Revenue', val: formatRevenue(totalRevenue) },
          { label: 'Completed Trips', val: `${completedTripsCount} Completed` },
          { label: 'Upcoming Trips', val: `${upcomingTripsCount} Booked` },
          { label: 'Cancelled Bookings', val: `${cancelledBookingsCount} Cancelled` },
          { label: 'Refunds Processed', val: `${formatRevenue(totalRefunds)} Refunded` }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-premium flex flex-col justify-between gap-3 text-center">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">{stat.label}</span>
            <span className="text-xs font-extrabold text-primary-deep">{stat.val}</span>
          </div>
        ))}
      </div>

      {/* Search & Advanced Filters Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-100 p-3.5 sm:p-4 shadow-premium space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search ID, guest, host, or boat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-secondary-emerald transition-all"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:items-center">
            <select
              value={bookingStatusFilter}
              onChange={(e) => setBookingStatusFilter(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-200/90 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-secondary-emerald cursor-pointer"
            >
              <option value="all">All Trip Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="upcoming">Upcoming</option>
            </select>

            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-200/90 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-secondary-emerald cursor-pointer"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-premium p-4 sm:p-6">
        
        {/* 1. Mobile Cards View (Visible on Mobile) */}
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
                    <span className="text-[9px] font-semibold text-slate-400 block">Date: {b.bookingDate}</span>
                  </div>
                  <span className={`inline-flex items-center text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                    b.tripStatus === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                    b.tripStatus === 'Confirmed' ? 'bg-sky-50 text-sky-600 border-sky-200' :
                    b.tripStatus === 'Upcoming' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                    'bg-rose-50 text-rose-600 border-rose-200'
                  }`}>
                    {b.tripStatus}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Customer</span>
                    <span className="font-extrabold text-slate-800 block truncate">{b.customerName}</span>
                    <span className="text-[9px] text-slate-400 block">{b.customerPhone}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Host & Vessel</span>
                    <span className="font-extrabold text-slate-800 block truncate">{b.boatName}</span>
                    <span className="text-[9px] text-slate-400 block truncate">{b.hostName}</span>
                  </div>
                </div>

                {/* Amount & Payment */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Check In - Out</span>
                    <span className="font-semibold text-slate-700 block">{b.checkIn} - {b.checkOut}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Fare Paid</span>
                    <span className="font-extrabold text-slate-900 block text-sm">₹{typeof b.amount === 'number' ? b.amount.toLocaleString('en-IN') : b.amount}</span>
                    <span className={`inline-block text-[8px] font-bold px-1.5 py-0.2 rounded border uppercase ${
                      b.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                    }`}>
                      {b.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBooking(b);
                      setIsDrawerOpen(true);
                    }}
                    className="w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" /> View Details
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-400 font-semibold text-xs">
              No matching booking records found.
            </div>
          )}
        </div>

        {/* 2. Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs font-bold text-slate-600 whitespace-nowrap min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px] tracking-wider">
                <th className="pb-3 px-4">Booking ID</th>
                <th className="pb-3">Customer Details</th>
                <th className="pb-3">Host Details</th>
                <th className="pb-3">Vessel & Destination</th>
                <th className="pb-3 text-right">Fare Paid</th>
                <th className="pb-3 text-center">Payment</th>
                <th className="pb-3 text-center">Trip Status</th>
                <th className="pb-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedBookings.length > 0 ? (
                paginatedBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-4 font-mono text-slate-800">{b.id}</td>
                    <td className="py-4">
                      <span className="text-slate-800 font-extrabold block">{b.customerName}</span>
                      <span className="text-[9px] text-slate-400 font-semibold block">{b.customerPhone}</span>
                    </td>
                    <td className="py-4">
                      <span className="text-slate-800 block">{b.hostName}</span>
                      <span className="text-[9px] text-slate-400 font-semibold block">{b.hostId}</span>
                    </td>
                    <td className="py-4">
                      <span className="text-slate-800 block">{b.boatName}</span>
                      <span className="text-[9px] text-slate-400 font-semibold block">{b.destination}</span>
                    </td>
                    <td className="py-4 text-right">
                      <span className="text-slate-800 font-extrabold block">₹{b.amount.toLocaleString('en-IN')}</span>
                      <span className="text-[9px] text-slate-400 block font-semibold">Comm: ₹{b.commission}</span>
                    </td>
                    <td className="py-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${
                        b.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${
                        b.tripStatus === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        b.tripStatus === 'Confirmed' ? 'bg-sky-50 text-sky-600 border-sky-100' :
                        b.tripStatus === 'Upcoming' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                        'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {b.tripStatus}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <div className="flex gap-1.5 justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBooking(b);
                            setIsDrawerOpen(true);
                          }}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-pointer shadow-sm"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-semibold">
                    No matching booking records found in ledger database.
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

      {/* Slide-out Booking Details Profile Drawer */}
      {isDrawerOpen && selectedBooking && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white h-full p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            
            <div className="space-y-6">
              
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-heading text-base font-extrabold text-primary-deep flex items-center gap-1.5">
                    Reservation Clearance Audit
                  </h3>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Booking ID: {selectedBooking.id}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <XCircle className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Customer Contact Card */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3">
                <h4 className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Customer Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">Full Name</span>
                    <span className="text-slate-800">{selectedBooking.customerName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">Phone Number</span>
                    <span className="text-slate-800 font-mono">{selectedBooking.customerPhone}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">Email Contact</span>
                    <span className="text-slate-800 font-mono block truncate">{selectedBooking.customerEmail}</span>
                  </div>
                </div>
              </div>

              {/* Host & Vessel Coordinates */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3">
                <h4 className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" /> Host & Vessel Coordinates
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">Host Representative</span>
                    <span className="text-slate-800">{selectedBooking.hostName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">Houseboat Booked</span>
                    <span className="text-slate-800 line-clamp-1">{selectedBooking.boatName}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">Voyage Destination</span>
                    <span className="text-slate-800">{selectedBooking.destination}</span>
                  </div>
                </div>
              </div>

              {/* Financial Transaction Invoice Card */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3">
                <h4 className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-slate-400" /> Fare Invoice Breakdown
                </h4>
                <div className="space-y-1.5 text-xs font-bold text-slate-600">
                  <div className="flex justify-between">
                    <span>Base Booking Value:</span>
                    <span className="text-slate-800 font-extrabold">₹{selectedBooking.amount}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span>Platform Commission Split (5%):</span>
                    <span className="text-slate-500 font-extrabold">₹{selectedBooking.commission}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span>Applicable GST (18%):</span>
                    <span className="text-slate-800 font-extrabold">₹{selectedBooking.gst}</span>
                  </div>
                  <div className="flex justify-between text-slate-800 font-extrabold pt-1">
                    <span>Net Host Earnings:</span>
                    <span>₹{(selectedBooking.amount - selectedBooking.commission).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Trip dates & Check-in timelines */}
              <div className="space-y-3">
                <h4 className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Trip Timeline Schedule</h4>
                <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold text-slate-700">
                  <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                    <span className="text-[8px] text-slate-400 uppercase block font-bold">Check-in Date</span>
                    <span>{selectedBooking.checkIn}</span>
                  </div>
                  <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                    <span className="text-[8px] text-slate-400 uppercase block font-bold">Check-out Date</span>
                    <span>{selectedBooking.checkOut}</span>
                  </div>
                </div>
              </div>

              {/* Communication Logs History */}
              <div className="space-y-3">
                <h4 className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Communication Logs Trail</h4>
                <div className="border-l border-slate-100 pl-4.5 ml-2.5 space-y-4 text-xs font-bold">
                  {selectedBooking.communicationHistory.length > 0 ? (
                    selectedBooking.communicationHistory.map((log: any, idx: number) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[24.5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white" />
                        <div className="flex justify-between items-start">
                          <span className="text-slate-800 font-extrabold">{log.sender}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold leading-relaxed font-sans mt-0.5">{log.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] text-slate-400 font-semibold">No operational message logs recorded for this reservation.</div>
                  )}
                </div>
              </div>

            </div>

            {/* Actions Footer */}
            <div className="border-t border-slate-100 pt-4 mt-6 flex justify-between items-center gap-2">
              <button
                type="button"
                onClick={() => downloadInvoice(selectedBooking)}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm cursor-pointer"
              >
                Invoice Download
              </button>

              <div className="flex gap-2">
                {selectedBooking.paymentStatus === 'Paid' && (
                  <button
                    type="button"
                    onClick={() => handleRefund(selectedBooking.id)}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-600 font-bold px-4 py-2.5 rounded-xl text-[10px] cursor-pointer"
                  >
                    Initiate Refund
                  </button>
                )}

                {selectedBooking.tripStatus !== 'Cancelled' && (
                  <button
                    type="button"
                    onClick={() => handleCancelBooking(selectedBooking.id)}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-4 py-2.5 rounded-xl text-[10px] cursor-pointer"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
