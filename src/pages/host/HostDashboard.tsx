import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';

// Import modularized sections
import { OverviewSection } from './components/OverviewSection';
import { MyFleetSection } from './components/MyFleetSection';
import { CalendarSection } from './components/CalendarSection';
import { BookingsSection } from './components/BookingsSection';
import { TodayTripsSection } from './components/TodayTripsSection';
import { RevenueSection } from './components/RevenueSection';
import { ReviewsSection } from './components/ReviewsSection';
import { MaintenanceSection } from './components/MaintenanceSection';
import { NotificationsSection } from './components/NotificationsSection';
import { SettingsSection } from './components/SettingsSection';
import { SupportSection } from './components/SupportSection';

// Interfaces for our Fleet Management
export interface Houseboat {
  id: string;
  name: string;
  description?: string;
  category: 'Luxury' | 'Premium' | 'Deluxe';
  status: 'Published' | 'Draft' | 'Maintenance' | 'Inactive' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Under Review' | 'Suspended';
  bedrooms: number;
  bathrooms?: number;
  capacity: number;
  pricePerNight: number; // Nightly base rate
  location: 'Alleppey' | 'Kumarakom' | 'Kollam' | 'Ashtamudi';
  rating: number;
  todayStatus: 'On Trip' | 'Available' | 'Blocked' | 'Maintenance';
  monthlyOccupancy: number;
  monthlyRevenue: number;
  upcomingTripDate: string;
  lastUpdated: string;
  image: string;
  images?: string[];
  rejectionReason?: string;
  reviewMessage?: string;
  pollutionCertificateNo?: string;
  pollutionExpiry?: string;
  pollutionDocUrl?: string;
  safetyAuditNo?: string;
  safetyExpiry?: string;
  safetyDocUrl?: string;
}

export interface CalendarDayEvent {
  day: number;
  type: 'Available' | 'Booked' | 'Today\'s Trip' | 'Maintenance' | 'Blocked' | 'Special Pricing';
  priceOverride?: number;
  notes?: string;
  reason?: string;
  booking?: {
    id: string;
    customerName: string;
    guests: number;
    amount: number;
    timeline: string;
    checkIn: string;
    checkOut: string;
    paymentStatus: 'Paid' | 'Pending';
  };
}

const HostDashboard: React.FC = () => {
  const location = useLocation();
  
  // Navigation & Page views
  const [activePage, setActivePage] = useState<'overview-view' | 'my-fleet' | 'calendar-view' | 'bookings-view' | 'today-view' | 'revenue-view' | 'reviews-view' | 'maintenance-view' | 'notifications-view' | 'settings-view' | 'support-view'>('overview-view');
  const [selectedBoat, setSelectedBoat] = useState<Houseboat | null>(null);

  // Fleet Database (Database-backed listings)
  const [fleet, setFleet] = useState<Houseboat[]>([]);

  // Load real host listings & bookings from database to compute dynamic occupancy
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const [listingsRes, bookingsRes] = await Promise.allSettled([
          api.get('/v1/host/listings'),
          api.get('/v1/bookings/host')
        ]);

        let dbListings: any[] = [];
        if (listingsRes.status === 'fulfilled') {
          dbListings = listingsRes.value.data?.data?.listings || [];
        }

        let hostBookings: any[] = [];
        if (bookingsRes.status === 'fulfilled') {
          const raw = bookingsRes.value.data?.data;
          hostBookings = Array.isArray(raw) ? raw : (raw?.bookings || []);
        }

        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

        const mappedListings: Houseboat[] = dbListings.map((dbBoat: any) => {
          let displayStatus: any = 'Pending Approval';
          if (dbBoat.status === 'APPROVED') displayStatus = 'Approved';
          if (dbBoat.status === 'REJECTED') displayStatus = 'Rejected';
          if (dbBoat.status === 'UNDER_REVIEW') displayStatus = 'Under Review';
          if (dbBoat.status === 'SUSPENDED') displayStatus = 'Suspended';

          // Calculate dynamic occupancy & revenue for this specific houseboat
          const boatBookings = hostBookings.filter((b) => 
            (b.houseboatId === dbBoat.id || b.houseboat?.id === dbBoat.id) &&
            (b.status === 'CONFIRMED' || b.status === 'CHECKED_IN' || b.status === 'COMPLETED')
          );

          let bookedNightsInMonth = 0;
          let monthlyRev = 0;

          boatBookings.forEach((booking) => {
            const checkIn = new Date(booking.checkInDate);
            const checkOut = new Date(booking.checkOutDate);
            
            let amount = booking.totalAmount || booking.baseAmount || (dbBoat.pricePerNight * 1);
            if (booking.pricingBreakdown?.totalAmount) amount = booking.pricingBreakdown.totalAmount;

            if (checkIn.getMonth() === now.getMonth() && checkIn.getFullYear() === now.getFullYear()) {
              monthlyRev += amount;
              const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
              const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
              bookedNightsInMonth += diffDays;
            }
          });

          // Dynamic Occupancy calculation
          const calculatedOccupancy = daysInMonth > 0 ? Math.min(100, Math.round((bookedNightsInMonth / daysInMonth) * 100)) : 0;
          const finalOccupancy = (typeof dbBoat.monthlyOccupancy === 'number' && dbBoat.monthlyOccupancy !== 80)
            ? dbBoat.monthlyOccupancy
            : calculatedOccupancy;

          const finalRevenue = (typeof dbBoat.monthlyRevenue === 'number' && dbBoat.monthlyRevenue > 0 && dbBoat.monthlyRevenue !== (dbBoat.pricePerNight * 14))
            ? dbBoat.monthlyRevenue
            : monthlyRev;

          // Check if boat is sailing today
          const todayStr = now.toISOString().split('T')[0];
          const isOnTripToday = boatBookings.some(b => {
            const checkInStr = new Date(b.checkInDate).toISOString().split('T')[0];
            const checkOutStr = new Date(b.checkOutDate).toISOString().split('T')[0];
            return todayStr >= checkInStr && todayStr <= checkOutStr;
          });

          return {
            id: dbBoat.id,
            name: dbBoat.name,
            category: dbBoat.category || 'Premium',
            status: displayStatus,
            bedrooms: dbBoat.bedrooms,
            bathrooms: dbBoat.bathrooms || dbBoat.bedrooms,
            capacity: dbBoat.capacity,
            description: dbBoat.description || '',
            pricePerNight: dbBoat.pricePerNight,
            location: dbBoat.location || 'Alleppey',
            rating: dbBoat.averageRating || 4.8,
            todayStatus: isOnTripToday ? 'On Trip' : 'Available',
            monthlyOccupancy: finalOccupancy,
            monthlyRevenue: finalRevenue,
            upcomingTripDate: boatBookings.length > 0 ? new Date(boatBookings[0].checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'None',
            lastUpdated: 'Synced with DB',
            image: dbBoat.images?.[0] || 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80',
            images: dbBoat.images || [],
            rejectionReason: dbBoat.rejectionReason || undefined,
            reviewMessage: dbBoat.reviewMessage || undefined,
            pollutionCertificateNo: dbBoat.pollutionCertificateNo || undefined,
            pollutionExpiry: dbBoat.pollutionExpiry || undefined,
            pollutionDocUrl: dbBoat.pollutionDocUrl || undefined,
            safetyAuditNo: dbBoat.safetyAuditNo || undefined,
            safetyExpiry: dbBoat.safetyExpiry || undefined,
            safetyDocUrl: dbBoat.safetyDocUrl || undefined,
          };
        });

        setFleet(mappedListings);
      } catch (err) {
        console.error('Failed to sync database listings:', err);
      }
    };

    fetchListings();
  }, []);

  // Synchronize dashboard view tabs with sidebar hash parameters via React Router location updates
  useEffect(() => {
    const syncHashToTab = () => {
      const hash = location.hash || window.location.hash;
      if (hash === '#houseboats') {
        setActivePage('my-fleet');
      } else if (hash === '#calendar') {
        if (!selectedBoat && fleet.length > 0) {
          setSelectedBoat(fleet[0]);
        }
        setActivePage('calendar-view');
      } else if (hash === '#bookings') {
        setActivePage('bookings-view');
      } else if (hash === '#today') {
        setActivePage('today-view');
      } else if (hash === '#revenue') {
        setActivePage('revenue-view');
      } else if (hash === '#reviews') {
        setActivePage('reviews-view');
      } else if (hash === '#maintenance') {
        setActivePage('maintenance-view');
      } else if (hash === '#notifications') {
        setActivePage('notifications-view');
      } else if (hash === '#settings') {
        setActivePage('settings-view');
      } else if (hash === '#support') {
        setActivePage('support-view');
      } else {
        setActivePage('overview-view');
      }
    };

    syncHashToTab();

    const handleCustomNav = () => {
      syncHashToTab();
    };

    window.addEventListener('hashchange', syncHashToTab);
    window.addEventListener('b4boat_navigate_tab', handleCustomNav);

    return () => {
      window.removeEventListener('hashchange', syncHashToTab);
      window.removeEventListener('b4boat_navigate_tab', handleCustomNav);
    };
  }, [location.hash, fleet, selectedBoat]);

  return (
    <div className="space-y-6 relative">
      {activePage === 'overview-view' && <OverviewSection fleet={fleet} setActivePage={setActivePage} />}
      {activePage === 'my-fleet' && (
        <MyFleetSection 
          fleet={fleet} 
          setFleet={setFleet} 
          setSelectedBoat={setSelectedBoat} 
        />
      )}
      {activePage === 'calendar-view' && (
        <CalendarSection 
          selectedBoat={selectedBoat} 
          setSelectedBoat={setSelectedBoat}
          fleet={fleet}
          setActivePage={setActivePage} 
        />
      )}
      {activePage === 'bookings-view' && <BookingsSection fleet={fleet} />}
      {activePage === 'today-view' && <TodayTripsSection fleet={fleet} />}
      {activePage === 'revenue-view' && <RevenueSection fleet={fleet} />}
      {activePage === 'reviews-view' && <ReviewsSection />}
      {activePage === 'maintenance-view' && <MaintenanceSection fleet={fleet} />}
      {activePage === 'notifications-view' && <NotificationsSection />}
      {activePage === 'settings-view' && <SettingsSection />}
      {activePage === 'support-view' && <SupportSection />}
    </div>
  );
};

export default HostDashboard;
