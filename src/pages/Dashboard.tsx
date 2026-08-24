import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, Ship, Heart, User, 
  Calendar, MapPin, Download, Compass, PhoneCall, CheckCircle2, Loader2, XCircle, MessageSquare, AlertTriangle, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import { LiveChatModal } from '../components/LiveChatModal';
import { ReviewModal } from '../components/reviews/ReviewModal';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'wishlist' | 'profile'>('overview');
  const [bookingsList, setBookingsList] = useState<any[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);

  // Live Chat States
  const [activeChatBooking, setActiveChatBooking] = useState<any | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedReviewBooking, setSelectedReviewBooking] = useState<{ id: string; name: string } | null>(null);

  const fetchCustomerBookings = async () => {
    try {
      const response = await api.get('/v1/bookings/customer');
      const rawData = response.data?.data;
      const dbBookings = Array.isArray(rawData) ? rawData : (rawData?.bookings || []);
      
      const mapped = dbBookings.map((b: any) => {
        let displayStatus = 'Confirmed';
        if (b.status === 'INITIATED') displayStatus = 'Pending Hold';
        if (b.status === 'CHECKED_IN') displayStatus = 'Checked In';
        if (b.status === 'COMPLETED') displayStatus = 'Completed';
        if (b.status === 'CANCELLED') displayStatus = 'Cancelled';

        const start = new Date(b.checkInDate);
        const end = new Date(b.checkOutDate);

        return {
          id: b.bookingNumber || b.id,
          dbId: b.id,
          customerName: b.contactName || '',
          customerEmail: b.contactEmail || '',
          customerPhone: b.contactPhone || 'N/A',
          boatName: b.houseboat.name,
          destination: b.houseboat.location,
          location: b.houseboat.location,
          checkIn: start.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          checkOut: end.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          status: displayStatus,
          totalPaid: b.pricingBreakdown.totalAmount,
          commission: b.pricingBreakdown.platformFee || 0,
          gst: b.pricingBreakdown.taxAmount || 0,
          bookingDate: new Date(b.createdAt || new Date()).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          hostName: b.host.name || 'Owner Partner',
          crew: { name: b.host.name || 'Captain Nair', phone: b.host.phone || '+91 98765 00123' },
          image: b.houseboat.images?.[0] || 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=400&q=80',
        };
      });

      setBookingsList(mapped);
    } catch (err) {
      console.error('Failed to load guest bookings:', err);
      toast.error('Could not sync your reservation dashboard.');
    } finally {
      setIsLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchCustomerBookings();
  }, []);

  const handleCancelBooking = (bId: string, dbId: string) => {
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-in zoom-in-95 duration-200' : 'animate-out zoom-out-95 duration-150'
          } max-w-md w-full bg-slate-900 text-white rounded-3xl p-5 shadow-2xl border border-slate-800 space-y-4`}
        >
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 shrink-0 border border-rose-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-heading text-sm font-bold text-white">Cancel Booking Charter?</h4>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Are you sure you want to cancel this booking? This will process an immediate refund to your payment method.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Keep Booking
            </button>
            <button
              type="button"
              onClick={async () => {
                toast.dismiss(t.id);
                const loadingToast = toast.loading('Processing booking cancellation & refund...');
                try {
                  await api.patch(`/v1/bookings/${dbId}/cancel`);
                  toast.dismiss(loadingToast);
                  toast.success('Your booking has been cancelled and refunded successfully.', { duration: 5000 });
                  setBookingsList(prev => prev.map(b => b.id === bId ? { ...b, status: 'Cancelled' } : b));
                } catch (err: any) {
                  toast.dismiss(loadingToast);
                  const errMsg = err.response?.data?.message || 'Failed to cancel booking.';
                  toast.error(errMsg);
                }
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md cursor-pointer"
            >
              Yes, Cancel & Refund
            </button>
          </div>
        </div>
      ),
      { duration: 8000 }
    );
  };

  const completedBookings = bookingsList.filter(b => b.status === 'Completed');
  const nightsSailed = completedBookings.reduce((sum, b) => {
    const start = new Date(b.checkIn);
    const end = new Date(b.checkOut);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return sum + (diff > 0 ? diff : 0);
  }, 0);

  const activeBookingsCount = bookingsList.filter(b => b.status === 'Confirmed' || b.status === 'Pending Hold').length;

  const stats = [
    { label: 'Nights Sailed', value: `${nightsSailed} nights`, icon: <Compass className="w-5 h-5 text-secondary-emerald" /> },
    { label: 'Active Bookings', value: `${activeBookingsCount} booking${activeBookingsCount !== 1 ? 's' : ''}`, icon: <Calendar className="w-5 h-5 text-primary-light" /> },
    { label: 'Wishlisted Stays', value: '2 saved', icon: <Heart className="w-5 h-5 text-red-500" /> },
  ];

  const mockWishlist = [
    {
      id: 'hb-2',
      name: 'Royal Emerald Palace',
      location: 'Kumarakom Lake',
      price: 14200,
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'hb-3',
      name: 'Whispering Palms Retreat',
      location: 'Ashtamudi Lake',
      price: 11500,
      image: 'https://images.unsplash.com/photo-1540553016722-983e48a2cd10?auto=format&fit=crop&w=400&q=80',
    }
  ];

  const upcomingBooking = bookingsList.find(b => b.status === 'Confirmed' || b.status === 'Pending Hold');

  const downloadInvoice = (rawBooking: any) => {
    const booking = {
      id: rawBooking.id,
      customerName: rawBooking.customerName || user?.name || 'Guest Customer',
      customerEmail: rawBooking.customerEmail || user?.email || '',
      customerPhone: rawBooking.customerPhone || user?.phone || 'N/A',
      boatName: rawBooking.boatName,
      destination: rawBooking.destination,
      checkIn: rawBooking.checkIn,
      checkOut: rawBooking.checkOut,
      bookingDate: rawBooking.bookingDate,
      amount: rawBooking.totalPaid,
      gst: rawBooking.gst,
      paymentStatus: rawBooking.status === 'Cancelled' ? 'Refunded' : 'Paid',
      hostName: rawBooking.hostName
    };

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

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-premium flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{stat.label}</span>
              <span className="text-xl font-extrabold text-primary-deep">{stat.value}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Booking Preview */}
      {upcomingBooking && (
        <div className="space-y-4">
          <h3 className="font-heading text-lg font-bold text-primary-deep">Upcoming Reservation</h3>
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-premium grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <img
              src={upcomingBooking.image}
              alt={upcomingBooking.boatName}
              className="md:col-span-3 rounded-2xl w-full h-40 object-cover border border-slate-100 shadow-sm"
            />
            <div className="md:col-span-6 space-y-3">
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-100">
                <CheckCircle2 className="w-3.5 h-3.5" /> {upcomingBooking.status}
              </div>
              <h4 className="font-heading text-lg font-bold text-primary-deep">{upcomingBooking.boatName}</h4>
              <div className="flex flex-wrap gap-4 text-xs text-slate-500 font-semibold">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-secondary-emerald" /> {upcomingBooking.location}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-secondary-emerald" /> {upcomingBooking.checkIn} to {upcomingBooking.checkOut}</span>
              </div>
            </div>
            <div className="md:col-span-3 flex flex-col items-center md:items-end justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 gap-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Amount Paid</span>
              <span className="font-heading text-xl font-extrabold text-primary-deep">₹{upcomingBooking.totalPaid.toLocaleString('en-IN')}</span>
              <button
                onClick={() => setActiveTab('bookings')}
                className="text-xs font-bold text-primary-light hover:text-primary-deep flex items-center gap-1"
              >
                Manage Booking →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderBookings = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      {isLoadingBookings ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3 text-xs font-bold text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-premium p-12">
          <Loader2 className="w-6 h-6 animate-spin text-secondary-emerald" />
          Syncing guest reservations ledger...
        </div>
      ) : bookingsList.length > 0 ? (
        bookingsList.map((bk) => (
          <div key={bk.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-premium grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <img
              src={bk.image}
              alt={bk.boatName}
              className="md:col-span-3 rounded-2xl w-full h-32 object-cover border border-slate-100 shadow-sm"
            />
            <div className="md:col-span-6 space-y-3">
              <div className="flex items-center justify-between md:justify-start gap-3">
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                  bk.status === 'Confirmed' 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  bk.status === 'Cancelled'
                    ? 'bg-rose-50 text-rose-600 border-rose-100'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {bk.status}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ID: {bk.id}</span>
              </div>
              
              <h4 className="font-heading text-lg font-bold text-primary-deep">{bk.boatName}</h4>
              <div className="flex flex-wrap gap-4 text-xs text-slate-500 font-semibold">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-secondary-emerald" /> {bk.location}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-secondary-emerald" /> {bk.checkIn} to {bk.checkOut}</span>
              </div>
            </div>
            
            <div className="md:col-span-3 flex flex-col md:items-end gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
              <div className="space-y-0.5 md:text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">{bk.status === 'Cancelled' ? 'Refunded' : 'Total Cost'}</span>
                <span className="font-heading text-lg font-extrabold text-primary-deep">₹{bk.totalPaid.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="flex flex-wrap gap-2 w-full md:justify-end">
                <button 
                  onClick={() => downloadInvoice(bk)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-sm border border-slate-200"
                >
                  <Download className="w-3.5 h-3.5" /> Receipt
                </button>
                {bk.status !== 'Pending Hold' && (
                  <button
                    onClick={() => {
                      setActiveChatBooking(bk);
                      setIsChatOpen(true);
                    }}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-sky-50 hover:bg-sky-100 text-sky-600 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-sm border border-sky-100"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Chat
                  </button>
                )}
                {bk.status === 'Confirmed' && (
                  <button
                    onClick={() => handleCancelBooking(bk.id, bk.dbId)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-sm border border-rose-100"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Cancel
                  </button>
                )}
                {(bk.status === 'Completed' || bk.status === 'COMPLETED') && (
                  <button
                    onClick={() => {
                      setSelectedReviewBooking({ id: bk.dbId || bk.id, name: bk.boatName });
                      setIsReviewModalOpen(true);
                    }}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-xl text-xs font-extrabold cursor-pointer shadow-sm"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" /> Write Review
                  </button>
                )}
                {bk.status !== 'Cancelled' && (
                  <a
                    href={`tel:${bk.crew.phone}`}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-secondary-emerald hover:bg-secondary-emerald/90 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow-sm"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> Crew
                  </a>
                )}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-premium text-center space-y-3">
          <Ship className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="font-heading text-base font-bold text-slate-700">No Reservations Yet</h4>
          <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto leading-relaxed">
            You haven't booked any houseboat stays. Sail Kerala's beautiful backwaters today!
          </p>
          <Link
            to="/search"
            className="inline-block bg-primary-deep hover:bg-primary-light text-white text-xs font-bold px-6 py-3 rounded-xl shadow-sm transition-all"
          >
            Explore Fleet
          </Link>
        </div>
      )}
    </div>
  );

  const renderWishlist = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 animate-in fade-in duration-300">
      {mockWishlist.map((hb) => (
        <div key={hb.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-premium flex flex-col h-full group hover-lift">
          <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
            <img
              src={hb.image}
              alt={hb.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <button className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 hover:bg-white backdrop-blur-sm flex items-center justify-center shadow-md cursor-pointer text-red-500">
              <Heart className="w-4 h-4 fill-current" />
            </button>
          </div>
          <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-secondary-emerald" /> {hb.location}
              </span>
              <h4 className="font-heading text-lg font-bold text-primary-deep group-hover:text-primary-light transition-colors line-clamp-1">{hb.name}</h4>
            </div>
            <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-2">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">From</span>
                <span className="font-heading text-base font-extrabold text-primary-deep">₹{hb.price.toLocaleString('en-IN')}</span>
                <span className="text-[10px] text-slate-400 font-semibold"> /night</span>
              </div>
              <Link
                to={`/houseboat/${hb.id}`}
                className="bg-primary-deep hover:bg-primary-light text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all"
              >
                Book Now
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderProfile = () => (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-premium space-y-6 max-w-xl animate-in fade-in duration-300">
      <div className="flex items-center gap-4.5 border-b border-slate-50 pb-6">
        <div className="w-16 h-16 rounded-full bg-secondary-emerald text-white font-extrabold text-xl uppercase flex items-center justify-center shadow-sm">
          {(user?.name || user?.firstName || '').charAt(0) || 'U'}
        </div>
        <div>
          <h4 className="font-heading text-lg font-bold text-primary-deep">{user?.name || `${user?.firstName} ${user?.lastName}` || 'User'}</h4>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{user?.role} Account</span>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">First Name</label>
            <input
              type="text"
              defaultValue={user?.name.split(' ')[0] || ''}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-300"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Last Name</label>
            <input
              type="text"
              defaultValue={user?.name.split(' ')[1] || ''}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-300"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
          <input
            type="email"
            defaultValue={user?.email || ''}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-300"
            disabled
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
          <input
            type="tel"
            defaultValue="+91 98765 99000"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-300"
          />
        </div>

        <button
          type="button"
          onClick={() => { toast.success('Profile changes successfully updated.'); }}
          className="bg-primary-deep hover:bg-primary-light text-white text-xs font-bold px-6 py-3.5 rounded-xl shadow-sm transition-all cursor-pointer"
        >
          Save Changes
        </button>
      </form>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Page Title Header */}
      <div className="border-b border-slate-100 pb-6 mb-8">
        <h1 className="font-heading text-3xl font-extrabold text-primary-deep">My Account</h1>
        <p className="text-sm text-slate-500 mt-1">Manage reservations, details, wishlist, and profile configurations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Navigation Sidebar Panel (Desktop) */}
        <aside className="lg:col-span-3 space-y-2 bg-white rounded-3xl p-5 border border-slate-100 shadow-premium h-fit">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-secondary-emerald/10 text-secondary-emerald shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Overview
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'bookings'
                ? 'bg-secondary-emerald/10 text-secondary-emerald shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <Ship className="w-4 h-4" /> My Bookings
          </button>
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'wishlist'
                ? 'bg-secondary-emerald/10 text-secondary-emerald shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <Heart className="w-4 h-4" /> Wishlist
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-secondary-emerald/10 text-secondary-emerald shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" /> Profile & Settings
          </button>
        </aside>

        {/* Dynamic Panels Output Area */}
        <main className="lg:col-span-9">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'bookings' && renderBookings()}
          {activeTab === 'wishlist' && renderWishlist()}
          {activeTab === 'profile' && renderProfile()}
        </main>

      </div>

      {/* Live Chat Interface Overlay */}
      {isChatOpen && activeChatBooking && (
        <LiveChatModal
          isOpen={isChatOpen}
          onClose={() => {
            setIsChatOpen(false);
            setActiveChatBooking(null);
          }}
          bookingId={activeChatBooking.dbId}
          currentUserId={user?.id || user?.uuid || 'customer-user'}
          currentUserName={user?.name || 'Customer Guest'}
          roomTitle={`Chat with Host regarding ${activeChatBooking.boatName}`}
          subTitle={`ID: ${activeChatBooking.id}`}
        />
      )}

      {/* Live Review Submission Modal */}
      {isReviewModalOpen && selectedReviewBooking && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedReviewBooking(null);
          }}
          bookingId={selectedReviewBooking.id}
          houseboatName={selectedReviewBooking.name}
          onSuccess={() => {
            fetchCustomerBookings();
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
