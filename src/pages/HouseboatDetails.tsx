import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Star, MapPin, Bed, ShowerHead, Users, Wifi, Utensils, 
  Compass, ShieldCheck, Calendar, Info, ChevronRight, ChevronLeft, CheckCircle2,
  CreditCard, User, ArrowRight, Loader2, Sparkles, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import HouseboatCard from '../components/common/HouseboatCard';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RatingBreakdown } from '../components/reviews/RatingBreakdown';
import { ReviewCard } from '../components/reviews/ReviewCard';
import { ReportReviewModal } from '../components/reviews/ReportReviewModal';
import { reviewService } from '../services/reviewService';
import type { ReviewItem, RatingBreakdownSummary } from '../services/reviewService';

const mockHouseboatDetails = {
  id: 'hb-1',
  name: 'Grandeur Overwater Cruise',
  location: 'Alleppey Backwaters, Kerala',
  description: 'Experience absolute royalty aboard the Grandeur Cruise. Crafted with traditional coconut fiber knotting and premium teakwood, this vessel represents the peak of luxury backwater exploration. Enjoy panoramic sun decks, premium air-conditioned bedrooms, and freshly prepared local delicacies compiled by your private chef onboard.',
  pricePerNight: 18500,
  rating: 4.95,
  reviewsCount: 142,
  category: 'Ultra Luxury',
  bedrooms: 3,
  bathrooms: 3,
  capacity: 6,
  host: {
    name: 'Captain K. R. Nair',
    experience: '12+ years hosting',
    avatar: '',
  },
  images: [
    'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80', // Main
    'https://images.unsplash.com/photo-1540553016722-983e48a2cd10?auto=format&fit=crop&w=600&q=80', // Int 1
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80', // Int 2
    'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80', // Int 3
    'https://images.unsplash.com/photo-1540553016722-983e48a2cd10?auto=format&fit=crop&w=600&q=80', // Int 4
  ],
  amenities: [
    { name: 'Private Chef Onboard', icon: <Utensils className="w-5 h-5" /> },
    { name: 'Panoramic Sun Deck', icon: <Compass className="w-5 h-5" /> },
    { name: 'High-Speed Wi-Fi', icon: <Wifi className="w-5 h-5" /> },
    { name: 'Verified Safety Gear', icon: <ShieldCheck className="w-5 h-5" /> },
    { name: 'AC in Bedrooms', icon: <Info className="w-5 h-5" /> },
    { name: 'Traditional Dining Room', icon: <Star className="w-5 h-5" /> },
  ],
  reviews: [
    {
      name: 'Aditya Sen',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=60&h=60&q=80',
      rating: 5,
      date: '1 week ago',
      comment: 'An absolute masterpiece of a vacation. The crew made us feel like kings. The food was sensational, especially the traditional pearl spot fry. Worth every rupee.',
    },
    {
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=60&h=60&q=80',
      rating: 5,
      date: '3 weeks ago',
      comment: 'The backwater sunset views from the sundeck were breathtaking. Clean rooms, comfortable beds, and absolute peace. Will definitely book again!',
    },
  ]
};

const relatedBoats = [
  {
    id: 'hb-2',
    name: 'Royal Emerald Palace',
    location: 'Kumarakom Lake',
    pricePerNight: 14200,
    rating: 4.88,
    reviewsCount: 96,
    category: 'Premium',
    images: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    ],
    amenities: ['Chef Onboard', 'Lounge Deck', 'Wi-Fi'],
  },
  {
    id: 'hb-3',
    name: 'Whispering Palms Retreat',
    location: 'Ashtamudi Lake',
    pricePerNight: 11500,
    rating: 4.79,
    reviewsCount: 78,
    category: 'Luxury',
    images: [
      'https://images.unsplash.com/photo-1540553016722-983e48a2cd10?auto=format&fit=crop&w=600&q=80',
    ],
    amenities: ['Traditional Meals', 'Sundeck Lounge', 'Wi-Fi'],
  },
];

const HouseboatDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, token } = useAuth();
  const isAuthenticated = Boolean(user && token);
  const [boat, setBoat] = useState<any>(mockHouseboatDetails);
  const [isLoading, setIsLoading] = useState(true);
  const [otherListings, setOtherListings] = useState<any[]>([]);

  // Live Reviews Engine State
  const [liveReviews, setLiveReviews] = useState<ReviewItem[]>([]);
  const [reviewsBreakdown, setReviewsBreakdown] = useState<RatingBreakdownSummary | null>(null);
  const [reviewsTotal, setReviewsTotal] = useState<number>(0);
  const [reviewsSortBy, setReviewsSortBy] = useState<'newest' | 'highest' | 'lowest' | 'helpful'>('newest');
  const [isFetchingReviews, setIsFetchingReviews] = useState<boolean>(true);
  const [reportReviewTarget, setReportReviewTarget] = useState<ReviewItem | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchReviews = async () => {
      setIsFetchingReviews(true);
      try {
        const res = await reviewService.getHouseboatReviews(id, { sortBy: reviewsSortBy });
        setLiveReviews(res.reviews);
        setReviewsBreakdown(res.breakdown);
        setReviewsTotal(res.total);

        if (res.breakdown && res.breakdown.totalReviews > 0) {
          setBoat((prev: any) => ({
            ...prev,
            rating: res.breakdown.overallAverage,
            reviewsCount: res.breakdown.totalReviews,
          }));
        }
      } catch (err) {
        console.error('Failed to load houseboat reviews:', err);
      } finally {
        setIsFetchingReviews(false);
      }
    };
    fetchReviews();
  }, [id, reviewsSortBy]);

  useEffect(() => {
    const fetchAllListings = async () => {
      try {
        const response = await api.get('/v1/listings');
        const list = response.data?.data?.listings || [];
        setOtherListings(list);
      } catch (err) {
        console.error('Failed to fetch similar listings:', err);
      }
    };
    fetchAllListings();
  }, []);

  const dynamicSimilarBoats = useMemo(() => {
    if (!otherListings || otherListings.length === 0) {
      return relatedBoats;
    }

    const filtered = otherListings.filter(item => item.id !== boat.id);

    const scored = filtered.map(item => {
      let score = 0;
      if (item.location === boat.location) score += 3;
      if (item.category === boat.category) score += 2;
      return { item, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const topListings = scored.slice(0, 2).map(s => {
      const dbBoat = s.item;
      return {
        id: dbBoat.id,
        name: dbBoat.name,
        location: dbBoat.location,
        pricePerNight: dbBoat.pricePerNight,
        rating: 4.8,
        reviewsCount: 12,
        category: dbBoat.category || 'Premium',
        images: dbBoat.images?.length > 0 ? dbBoat.images : ['https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80'],
        amenities: dbBoat.amenities || [],
      };
    });

    if (topListings.length === 0) {
      return relatedBoats;
    }

    if (topListings.length === 1) {
      topListings.push(relatedBoats[0]);
    }

    return topListings;
  }, [otherListings, boat.id, boat.location, boat.category]);

  useEffect(() => {
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const ad = searchParams.get('adults');
    const ch = searchParams.get('children');
    const openCheckout = searchParams.get('checkout');

    if (checkIn) setCheckInDate(checkIn);
    if (checkOut) setCheckOutDate(checkOut);
    if (ad) setAdults(Number(ad));
    if (ch) setChildren(Number(ch));

    if (openCheckout === 'true') {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('checkIn');
      newParams.delete('checkOut');
      newParams.delete('adults');
      newParams.delete('children');
      newParams.delete('checkout');
      setSearchParams(newParams, { replace: true });

      if (user) {
        const nameToUse = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
        if (nameToUse) setGuestName(nameToUse);
        if (user.email) setGuestEmail(user.email);
        if (user.phone) setGuestPhone(user.phone);
      }

      setIsBookingModalOpen(true);
      setBookingStep(1);
    }
  }, [searchParams, setSearchParams, user]);
  
  useEffect(() => {
    const fetchDetails = async () => {
      if (!id || id.startsWith('hb-')) {
        setIsLoading(false);
        return; // Use mock fallback immediately
      }

      try {
        setIsLoading(true);
        const response = await api.get(`/v1/listings/${id}`);
        const dbListing = response.data?.data?.listing;
        if (dbListing) {
          const mapped = {
            id: dbListing.id,
            name: dbListing.name,
            location: dbListing.location,
            description: dbListing.description || 'No description provided.',
            pricePerNight: dbListing.pricePerNight,
            rating: 4.8,
            reviewsCount: 12,
            category: dbListing.category || 'Premium',
            bedrooms: dbListing.bedrooms,
            bathrooms: dbListing.bathrooms || dbListing.bedrooms,
            capacity: dbListing.capacity,
            host: {
              name: dbListing.host ? (dbListing.host.name || `${dbListing.host.firstName} ${dbListing.host.lastName}`.trim() || 'Owner Partner') : 'Owner Partner',
              experience: 'Verified Host',
              avatar: dbListing.host?.profileImage || dbListing.host?.avatar || '',
            },
            images: dbListing.images?.length > 0 ? dbListing.images : [
              'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80',
            ],
            amenities: (dbListing.amenities || []).map((name: string) => {
              let icon = <Info className="w-5 h-5" />;
              if (name.toLowerCase().includes('chef')) icon = <Utensils className="w-5 h-5" />;
              if (name.toLowerCase().includes('deck') || name.toLowerCase().includes('sun')) icon = <Compass className="w-5 h-5" />;
              if (name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('internet')) icon = <Wifi className="w-5 h-5" />;
              if (name.toLowerCase().includes('safety')) icon = <ShieldCheck className="w-5 h-5" />;
              return { name, icon };
            }),
            reviews: [
              {
                name: 'Aditya Sen',
                avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
                rating: 5,
                date: '1 week ago',
                comment: 'An absolute masterpiece of a vacation. The crew made us feel like kings. The food was sensational, especially the traditional pearl spot fry. Worth every rupee.',
              }
            ]
          };
          setBoat(mapped);
        }
      } catch (err) {
        console.error('Failed to load houseboat details from Neon DB:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const formatDate = (dateStr: string, placeholder: string) => {
    if (!dateStr) return placeholder;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1);
  const [checkInDate, setCheckInDate] = useState<string>('');
  const [checkOutDate, setCheckOutDate] = useState<string>('');
  const [availSlots, setAvailSlots] = useState<any[]>([]);
  const [isFetchingAvail, setIsFetchingAvail] = useState<boolean>(false);

  useEffect(() => {
    if (!boat || !boat.id) return;
    const fetchAvail = async () => {
      setIsFetchingAvail(true);
      try {
        const res = await api.get(`/v1/availability/${boat.id}/month`, {
          params: { year: currentYear, month: currentMonth }
        });
        setAvailSlots(res.data?.data?.slots || []);
      } catch (err) {
        console.error('Failed to load guest availability', err);
      } finally {
        setIsFetchingAvail(false);
      }
    };
    fetchAvail();
  }, [currentYear, currentMonth, boat?.id]);

  // Booking Card States
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [isGuestDropdownOpen, setIsGuestDropdownOpen] = useState(false);
  const [isBookingSuccess, setIsBookingSuccess] = useState(false);
  const [confirmedBookingDetails, setConfirmedBookingDetails] = useState<any>(null);

  // Booking Details Modal & Inputs (autosaved temporarily to localStorage)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  
  const [guestName, setGuestName] = useState(() => {
    const cached = localStorage.getItem('temp_checkout_details');
    if (cached) {
      try { return JSON.parse(cached).guestName || ''; } catch(e){}
    }
    return '';
  });
  const [guestEmail, setGuestEmail] = useState(() => {
    const cached = localStorage.getItem('temp_checkout_details');
    if (cached) {
      try { return JSON.parse(cached).guestEmail || ''; } catch(e){}
    }
    return '';
  });
  const [guestPhone, setGuestPhone] = useState(() => {
    const cached = localStorage.getItem('temp_checkout_details');
    if (cached) {
      try { return JSON.parse(cached).guestPhone || ''; } catch(e){}
    }
    return '';
  });
  const [idType, setIdType] = useState(() => {
    const cached = localStorage.getItem('temp_checkout_details');
    if (cached) {
      try { return JSON.parse(cached).idType || 'Aadhaar'; } catch(e){}
    }
    return 'Aadhaar';
  });
  const [idNumber, setIdNumber] = useState(() => {
    const cached = localStorage.getItem('temp_checkout_details');
    if (cached) {
      try { return JSON.parse(cached).idNumber || ''; } catch(e){}
    }
    return '';
  });
  const [dietary, setDietary] = useState(() => {
    const cached = localStorage.getItem('temp_checkout_details');
    if (cached) {
      try { return JSON.parse(cached).dietary || 'Veg'; } catch(e){}
    }
    return 'Veg';
  });
  const [arrivalTime, setArrivalTime] = useState(() => {
    const cached = localStorage.getItem('temp_checkout_details');
    if (cached) {
      try { return JSON.parse(cached).arrivalTime || '12:00 PM'; } catch(e){}
    }
    return '12:00 PM';
  });
  const [addHoneymoon, setAddHoneymoon] = useState(() => {
    const cached = localStorage.getItem('temp_checkout_details');
    if (cached) {
      try { return !!JSON.parse(cached).addHoneymoon; } catch(e){}
    }
    return false;
  });
  const [addExtraBed, setAddExtraBed] = useState(() => {
    const cached = localStorage.getItem('temp_checkout_details');
    if (cached) {
      try { return !!JSON.parse(cached).addExtraBed; } catch(e){}
    }
    return false;
  });
  const [addAirportPickup, setAddAirportPickup] = useState(() => {
    const cached = localStorage.getItem('temp_checkout_details');
    if (cached) {
      try { return !!JSON.parse(cached).addAirportPickup; } catch(e){}
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('temp_checkout_details', JSON.stringify({
      guestName,
      guestEmail,
      guestPhone,
      idType,
      idNumber,
      dietary,
      arrivalTime,
      addHoneymoon,
      addExtraBed,
      addAirportPickup
    }));
  }, [guestName, guestEmail, guestPhone, idType, idNumber, dietary, arrivalTime, addHoneymoon, addExtraBed, addAirportPickup]);

  // Payment States
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Date Range calculations
  const nights = (checkInDate && checkOutDate)
    ? Math.max(1, Math.round((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Compute base cost summing the prices of each night from the live availability slots
  const calculateBaseCost = () => {
    if (!checkInDate || !checkOutDate || availSlots.length === 0) {
      return (boat?.pricePerNight || 0) * (nights || 1);
    }
    
    let sum = 0;
    const [inY, inM, inD] = checkInDate.split('-').map(Number);
    const [outY, outM, outD] = checkOutDate.split('-').map(Number);
    
    const cur = new Date(Date.UTC(inY, inM - 1, inD));
    const end = new Date(Date.UTC(outY, outM - 1, outD));
    
    while (cur < end) {
      const year = cur.getUTCFullYear();
      const month = String(cur.getUTCMonth() + 1).padStart(2, '0');
      const day = String(cur.getUTCDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      const slot = availSlots.find((s: any) => s.date.startsWith(dateKey));
      if (slot) {
        sum += slot.price || boat.pricePerNight;
      } else {
        sum += boat.pricePerNight || 0;
      }
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return sum;
  };

  const calculatedBasePrice = calculateBaseCost();

  // Cost Computations (Includes dynamic add-ons cost)
  const addOnsCost = (addHoneymoon ? 1500 : 0) + (addExtraBed ? 2000 * (nights || 1) : 0) + (addAirportPickup ? 2500 : 0);
  const baseCost = calculatedBasePrice + addOnsCost;
  const gstTax = baseCost * 0.18; // 18% GST
  const serviceFee = baseCost * 0.05; // 5% Service Charge
  const totalCost = baseCost + gstTax + serviceFee;

  // Average nightly rate (excluding add-ons)
  const averageNightlyPrice = (nights > 0)
    ? Math.round(calculatedBasePrice / nights)
    : (boat?.pricePerNight || 0);

  const handleBookNow = (e: React.FormEvent) => {
    e.preventDefault();

    if (!checkInDate || !checkOutDate) {
      toast.error('Please select both Check-In and Check-Out dates from the availability calendar first.');
      return;
    }

    if (!isAuthenticated || !user) {
      toast.error('Please login to book a houseboat.', {
        duration: 3000,
      });

      const redirectUrl = `/houseboat/${boat.id}?checkIn=${checkInDate}&checkOut=${checkOutDate}&adults=${adults}&children=${children}&checkout=true`;
      navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    if (user) {
      const nameToUse = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
      if (nameToUse) setGuestName(nameToUse);
      if (user.email) setGuestEmail(user.email);
      if (user.phone) setGuestPhone(user.phone);
    }

    setIsBookingModalOpen(true);
    setBookingStep(1);
  };

  const handleCompleteBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestEmail || !guestPhone || !idNumber) {
      toast.error('Please complete guest details step first.');
      setBookingStep(1);
      return;
    }
    if (paymentMethod === 'card' && (!cardNumber || !cardExpiry || !cardCvc)) {
      toast.error('Please fill out card details.');
      return;
    }
    if (paymentMethod === 'upi' && !upiId) {
      toast.error('Please enter your UPI ID.');
      return;
    }

    setIsProcessingPayment(true);
    const loadingToast = toast.loading('Initiating secure booking hold...');

    try {
      // 1. Create booking (Status: INITIATED)
      const createResponse = await api.post('/v1/bookings', {
        houseboatId: boat.id,
        checkInDate,
        checkOutDate,
        adults,
        children,
        contactName: guestName,
        contactEmail: guestEmail,
        contactPhone: guestPhone,
        specialRequests: `Meals: ${dietary}, Arrival: ${arrivalTime}, ID: ${idType} (${idNumber}), Add-ons: ${[addHoneymoon ? 'Honeymoon' : '', addExtraBed ? 'Extra Bed' : '', addAirportPickup ? 'Airport Pickup' : ''].filter(Boolean).join(', ')}`,
      });

      const initiatedBooking = createResponse.data?.data;
      if (!initiatedBooking || !initiatedBooking.id) {
        throw new Error('Failed to create reservation hold.');
      }

      toast.dismiss(loadingToast);
      const paymentToast = toast.loading('Authorizing payment transaction simulation...');

      // 2. Confirm simulated payment
      const payResponse = await api.post(`/v1/bookings/${initiatedBooking.id}/pay`);
      const confirmedBooking = payResponse.data?.data;

      if (payResponse.data?.success) {
        toast.dismiss(paymentToast);
        toast.success('Payment authorized successfully! Your booking is confirmed.', {
          duration: 5000,
        });
        localStorage.removeItem('temp_checkout_details');
        setConfirmedBookingDetails(confirmedBooking);
        setIsProcessingPayment(false);
        setIsBookingSuccess(true);
        setIsBookingModalOpen(false);
      } else {
        throw new Error('Simulated gateway declined payment.');
      }

    } catch (err: any) {
      toast.dismiss(loadingToast);
      setIsProcessingPayment(false);

      const errMsg = err.response?.data?.message || err.message || 'Booking process failed.';
      toast.error(errMsg);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs font-bold text-slate-400">
        Loading vessel details and certificates registry...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* 1. Page Breadcrumbs & Title */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
          <Link to="/" className="hover:text-primary-deep transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/search" className="hover:text-primary-deep transition-colors">Houseboats</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600">{boat.name}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-primary-deep">
              {boat.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1 text-slate-800">
                <Star className="w-4 h-4 fill-accent-gold text-accent-gold" />
                {boat.rating} ({boat.reviewsCount} reviews)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-secondary-emerald" />
                {boat.location}
              </span>
              <span>•</span>
              <span className="bg-slate-100 text-primary-deep px-3 py-1 rounded-full text-[10px] tracking-wider uppercase">
                {boat.category}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Adaptive Image Gallery based on uploaded count */}
      {boat.images.length === 1 ? (
        // Only 1 image: Full width span
        <div className="rounded-3xl overflow-hidden aspect-video max-h-[500px] relative group">
          <img
            src={boat.images[0]}
            alt="Houseboat Main"
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-102"
          />
        </div>
      ) : boat.images.length === 2 ? (
        // 2 images: 50/50 split
        <div className="grid grid-cols-2 gap-4 rounded-3xl overflow-hidden aspect-video max-h-[500px]">
          <div className="relative overflow-hidden group">
            <img
              src={boat.images[0]}
              alt="Houseboat Main"
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-103"
            />
          </div>
          <div className="relative overflow-hidden group">
            <img
              src={boat.images[1]}
              alt="Houseboat Detail"
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-103"
            />
          </div>
        </div>
      ) : boat.images.length === 3 ? (
        // 3 images: Main left (2 cols), 2 on right (1 col each)
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 rounded-3xl overflow-hidden aspect-video max-h-[500px]">
          <div className="md:col-span-2 relative overflow-hidden group">
            <img
              src={boat.images[0]}
              alt="Houseboat Main"
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-103"
            />
          </div>
          <div className="hidden md:grid grid-cols-1 col-span-2 gap-4">
            {boat.images.slice(1, 3).map((img: string, idx: number) => (
              <div key={idx} className="relative overflow-hidden group h-full">
                <img
                  src={img}
                  alt={`Houseboat detail ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      ) : boat.images.length === 4 ? (
        // 4 images: Main left (2 cols), 3 on right (mix grid)
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 rounded-3xl overflow-hidden aspect-video max-h-[500px]">
          <div className="md:col-span-2 relative overflow-hidden group">
            <img
              src={boat.images[0]}
              alt="Houseboat Main"
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-103"
            />
          </div>
          <div className="hidden md:grid grid-cols-3 col-span-2 gap-4">
            {boat.images.slice(1, 4).map((img: string, idx: number) => (
              <div key={idx} className="relative overflow-hidden group h-full">
                <img
                  src={img}
                  alt={`Houseboat detail ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        // 5+ images: Full Airbnb grid (1 large + 4 smalls)
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 rounded-3xl overflow-hidden aspect-video max-h-[500px]">
          {/* Main Large Image */}
          <div className="md:col-span-2 relative overflow-hidden group">
            <img
              src={boat.images[0]}
              alt="Houseboat Main"
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-103"
            />
          </div>
          {/* 4 Small Grid Images */}
          <div className="hidden md:grid grid-cols-2 col-span-2 gap-4">
            {boat.images.slice(1, 5).map((img: string, idx: number) => (
              <div key={idx} className="relative overflow-hidden group">
                <img
                  src={img}
                  alt={`Houseboat detail ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Main Detail Sections + Floating Sticky Booking Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Side: Overview & Amenities */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Host Banner & Key Specs */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 flex items-center justify-between shadow-premium gap-4">
            <div className="space-y-3">
              <h3 className="font-heading text-lg font-bold text-primary-deep">
                Hosted by {boat.host.name}
              </h3>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                {boat.host.experience}
              </p>
              
              {/* Bedroom Specs */}
              <div className="flex gap-6 text-sm text-slate-600 font-medium">
                <span className="flex items-center gap-1.5"><Bed className="w-4 h-4 text-slate-400" /> {boat.bedrooms} Bedrooms</span>
                <span className="flex items-center gap-1.5"><ShowerHead className="w-4 h-4 text-slate-400" /> {boat.bathrooms} Bathrooms</span>
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-slate-400" /> Up to {boat.capacity} Guests</span>
              </div>
            </div>
            
            {boat.host?.avatar ? (
              <img
                src={boat.host.avatar}
                alt={boat.host.name}
                className="w-16 h-16 rounded-full object-cover border border-slate-100 shadow-sm shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 text-primary-deep font-extrabold text-xl flex items-center justify-center shrink-0 shadow-xs">
                {boat.host?.name ? boat.host.name.charAt(0).toUpperCase() : 'H'}
              </div>
            )}
          </div>

          {/* Overview Description */}
          <div className="space-y-4">
            <h3 className="font-heading text-xl font-bold text-primary-deep">About this Floating Palace</h3>
            <p className="text-slate-500 text-base leading-relaxed font-light">
              {boat.description}
            </p>
          </div>

          {/* Amenities Grid */}
          <div className="space-y-6">
            <h3 className="font-heading text-xl font-bold text-primary-deep">What this stay offers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {boat.amenities.map((amenity: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-secondary-emerald shadow-sm">
                    {amenity.icon}
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{amenity.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Availability Calendar Grid */}
          <div className="space-y-6">
            <div className="flex justify-between items-center max-w-md">
              <h3 className="font-heading text-xl font-bold text-primary-deep">Availability Calendar</h3>
              <div className="flex gap-1 items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (currentMonth === 1) {
                      setCurrentMonth(12);
                      setCurrentYear(prev => prev - 1);
                    } else {
                      setCurrentMonth(prev => prev - 1);
                    }
                  }}
                  className="p-1 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-slate-800 text-xs px-2">
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][currentMonth - 1]} {currentYear}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (currentMonth === 12) {
                      setCurrentMonth(1);
                      setCurrentYear(prev => prev + 1);
                    } else {
                      setCurrentMonth(prev => prev + 1);
                    }
                  }}
                  className="p-1 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-premium max-w-md">
              {isFetchingAvail ? (
                <div className="h-48 flex items-center justify-center text-xs font-bold text-slate-400 animate-pulse">
                  Querying live availability engine...
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-y-1.5 justify-items-center">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <span key={d} className="text-[10px] font-bold text-slate-400 uppercase w-8 text-center">{d}</span>
                  ))}
                  
                  {availSlots.map((slot, index) => {
                    const dateObj = new Date(slot.date);
                    const dayStr = dateObj.getUTCDate();
                    const dateKey = slot.date.split('T')[0];

                    const isBooked = slot.status === 'BOOKED' || slot.status === 'CHECK-IN' || slot.status === 'CHECK-OUT' || slot.status === "TODAY'S TRIP" || slot.status === 'BLOCKED' || slot.status === 'MAINTENANCE';

                    const isSelected = (checkInDate && checkOutDate)
                      ? (dateKey >= checkInDate && dateKey <= checkOutDate)
                      : (dateKey === checkInDate);

                    const handleClickDate = () => {
                      if (isBooked) return;
                      if (!checkInDate || (checkInDate && checkOutDate)) {
                        setCheckInDate(dateKey);
                        setCheckOutDate('');
                      } else {
                        if (dateKey > checkInDate) {
                          setCheckOutDate(dateKey);
                        } else {
                          setCheckInDate(dateKey);
                        }
                      }
                    };

                    return (
                      <div
                        key={index}
                        onClick={handleClickDate}
                        className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center text-xs font-bold transition-all cursor-pointer relative ${
                          isBooked
                            ? 'bg-slate-100 text-slate-300 cursor-not-allowed line-through'
                            : isSelected
                              ? 'bg-secondary-emerald text-white shadow-md'
                              : slot.status === 'SPECIAL_PRICE'
                                ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                                : slot.status === 'PEAK_SEASON'
                                  ? 'bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200'
                                  : slot.status === 'HOLIDAY'
                                    ? 'bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200'
                                    : 'bg-secondary-emerald/5 hover:bg-secondary-emerald/10 text-secondary-emerald'
                        }`}
                        title={
                          slot.status === 'SPECIAL_PRICE'
                            ? `Special surge rate: ₹${slot.price}`
                            : slot.status === 'PEAK_SEASON'
                              ? `Peak season rate: ₹${slot.price}`
                              : slot.status === 'HOLIDAY'
                                ? `Holiday rate: ₹${slot.price}`
                                : undefined
                        }
                      >
                        <span>{dayStr}</span>
                        {slot.status === 'SPECIAL_PRICE' && !isSelected && (
                          <span className="absolute bottom-0 text-[5px] font-extrabold text-purple-500">₹</span>
                        )}
                        {slot.status === 'PEAK_SEASON' && !isSelected && (
                          <span className="absolute bottom-0 text-[5px] font-extrabold text-orange-500">⚡</span>
                        )}
                        {slot.status === 'HOLIDAY' && !isSelected && (
                          <span className="absolute bottom-0 text-[5px] font-extrabold text-teal-500">🎉</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 5. Guest Reviews & Ratings Section */}
          <div className="space-y-6 pt-6 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h3 className="font-heading text-xl font-bold text-primary-deep flex items-center gap-2">
                  Guest Reviews & Ratings <Sparkles className="w-4 h-4 text-accent-gold" />
                </h3>
                <p className="text-xs text-slate-400 font-semibold">
                  Verified feedback from travelers who completed stays on {boat.name}
                </p>
              </div>

              {/* Sorting Filter */}
              {reviewsTotal > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-slate-400">Sort by:</span>
                  <select
                    value={reviewsSortBy}
                    onChange={(e) => setReviewsSortBy(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="newest">Newest First</option>
                    <option value="highest">Highest Rating</option>
                    <option value="lowest">Lowest Rating</option>
                    <option value="helpful">Most Helpful</option>
                  </select>
                </div>
              )}
            </div>

            {/* Rating Breakdown */}
            {reviewsBreakdown && reviewsTotal > 0 ? (
              <RatingBreakdown breakdown={reviewsBreakdown} />
            ) : null}

            {/* Review Cards Feed */}
            {isFetchingReviews ? (
              <div className="py-12 text-center space-y-2 bg-white rounded-3xl border border-slate-100 shadow-xs">
                <Loader2 className="w-6 h-6 animate-spin text-secondary-emerald mx-auto" />
                <p className="text-xs font-bold text-slate-400">Loading verified guest reviews...</p>
              </div>
            ) : liveReviews.length > 0 ? (
              <div className="space-y-4">
                {liveReviews.map((rev) => (
                  <ReviewCard
                    key={rev.id}
                    review={rev}
                    onReportClick={setReportReviewTarget}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 bg-slate-50 border border-slate-100 rounded-3xl text-center space-y-2">
                <Star className="w-8 h-8 text-amber-400 mx-auto" />
                <h4 className="font-heading text-sm font-bold text-slate-800">No Reviews Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Be the first traveler to complete a stay on this houseboat and share your experience with the b4boat community!
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Sticky Booking summary Card */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-premium p-6 sticky top-24 space-y-6">
            
            {/* Price Header */}
            <div className="flex items-end justify-between border-b border-slate-50 pb-4">
              <div>
                <span className="font-heading text-2xl font-extrabold text-primary-deep">
                  ₹{averageNightlyPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-sm text-slate-400">/night</span>
              </div>
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-accent-gold text-accent-gold" />
                {boat.rating}
              </span>
            </div>

             {isBookingSuccess ? (
              <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100 space-y-4 animate-in fade-in duration-300">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="text-center space-y-1">
                  <h4 className="font-heading text-base font-bold text-emerald-800">Booking Confirmed!</h4>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/30 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                    ID: {confirmedBookingDetails?.bookingNumber || 'B4B-9852-OK'}
                  </span>
                </div>
                <div className="border-t border-slate-100 pt-4 space-y-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Houseboat</span>
                    <span className="font-bold text-slate-700">{boat.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Dates</span>
                    <span className="font-bold text-slate-700">{checkInDate} to {checkOutDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Primary Guest</span>
                    <span className="font-bold text-slate-700">{confirmedBookingDetails?.contactName || guestName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Contact</span>
                    <span className="font-bold text-slate-700">{confirmedBookingDetails?.contactPhone || guestPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">ID Verified ({idType})</span>
                    <span className="font-bold text-slate-700">{idNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Guests</span>
                    <span className="font-bold text-slate-700">
                      {confirmedBookingDetails?.adults} Adults
                      {confirmedBookingDetails?.children ? `, ${confirmedBookingDetails.children} Children` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-xs">
                    <span className="text-slate-800">Total Paid</span>
                    <span className="text-secondary-emerald">₹{confirmedBookingDetails?.totalAmount?.toLocaleString('en-IN') || totalCost.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 text-center leading-relaxed font-sans">
                  All systems set! A check-in pass and digital invoice have been emailed to <strong>{guestEmail}</strong>. Enjoy your cruise!
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookNow} className="space-y-4">
                
                {/* Selected Dates Display */}
                <div className="grid grid-cols-2 gap-2 border border-slate-100 rounded-xl p-3 bg-slate-50/30 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Check In</span>
                    <strong className="text-slate-800 font-semibold">{formatDate(checkInDate, '')}</strong>
                  </div>
                  <div className="border-l border-slate-100 pl-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Check Out</span>
                    <strong className="text-slate-800 font-semibold">{formatDate(checkOutDate, '')}</strong>
                  </div>
                </div>

                {/* Guest Dropdown */}
                <div className="relative">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Guests</span>
                  <button
                    type="button"
                    onClick={() => setIsGuestDropdownOpen(!isGuestDropdownOpen)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 text-left flex items-center justify-between cursor-pointer hover:border-slate-300"
                  >
                    <span>{`${adults} Adults${children ? `, ${children} Children` : ''}`}</span>
                  </button>

                  {isGuestDropdownOpen && (
                    <div className="absolute right-0 left-0 mt-2 bg-white rounded-2xl shadow-premium border border-slate-100 p-4 z-40 space-y-4">
                      {/* Adults counter */}
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-slate-800">Adults</div>
                          <div className="text-[10px] text-slate-400">Ages 13+</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            disabled={adults <= 1}
                            onClick={() => setAdults(prev => prev - 1)}
                            className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-50"
                          >
                            -
                          </button>
                          <span className="font-bold text-slate-800 w-4 text-center">{adults}</span>
                          <button
                            type="button"
                            disabled={adults + children >= boat.capacity}
                            onClick={() => setAdults(prev => prev + 1)}
                            className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Children counter */}
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-slate-800">Children</div>
                          <div className="text-[10px] text-slate-400">Ages 2-12</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            disabled={children <= 0}
                            onClick={() => setChildren(prev => prev - 1)}
                            className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-50"
                          >
                            -
                          </button>
                          <span className="font-bold text-slate-800 w-4 text-center">{children}</span>
                          <button
                            type="button"
                            disabled={adults + children >= boat.capacity}
                            onClick={() => setChildren(prev => prev + 1)}
                            className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsGuestDropdownOpen(false)}
                        className="w-full py-2 bg-slate-900 text-white font-bold rounded-xl text-[10px] uppercase"
                      >
                        Apply Guests
                      </button>
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="border-t border-slate-50 pt-4 space-y-2 text-xs text-slate-500">
                  <div className="flex items-center justify-between">
                    <span>{`₹${averageNightlyPrice.toLocaleString('en-IN')} x ${nights} nights`}</span>
                    <span className="font-semibold text-slate-800">₹{calculatedBasePrice.toLocaleString('en-IN')}</span>
                  </div>
                  {addOnsCost > 0 && (
                    <div className="flex items-center justify-between">
                      <span>Add-ons & Services</span>
                      <span className="font-semibold text-slate-800">₹{addOnsCost.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">Taxes (18% GST) <Calendar className="w-3 h-3 text-slate-400" /></span>
                    <span className="font-semibold text-slate-800">₹{gstTax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Service Fee (5%)</span>
                    <span className="font-semibold text-slate-800">₹{serviceFee.toLocaleString('en-IN')}</span>
                  </div>
                  <hr className="border-slate-50 my-1" />
                  <div className="flex items-center justify-between text-sm text-primary-deep font-extrabold">
                    <span>Total Cost</span>
                    <span>₹{totalCost.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  className="w-full py-4 bg-secondary-emerald hover:bg-secondary-emerald/90 text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-md hover:scale-[1.01] transition-all cursor-pointer mt-4"
                >
                  Book Now
                </button>
                
                <span className="text-[10px] text-slate-400 text-center block leading-relaxed mt-2">
                  You won't be charged yet. Dates will be locked securely until signature confirmation.
                </span>

              </form>
            )}

          </div>
        </div>

      </div>

      {/* 4. Related Houseboats Section */}
      <div className="border-t border-slate-100 pt-16 space-y-8">
        <div className="space-y-2">
          <h3 className="font-heading text-2xl font-extrabold text-primary-deep">Similar Houseboats</h3>
          <p className="text-sm text-slate-500">Other highly rated premium voyages in Kerala backwaters.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {dynamicSimilarBoats.map((boat: any) => (
            <HouseboatCard
              key={boat.id}
              id={boat.id}
              name={boat.name}
              location={boat.location}
              pricePerNight={boat.pricePerNight}
              rating={boat.rating}
              reviewsCount={boat.reviewsCount}
              images={boat.images}
              amenities={boat.amenities}
              category={boat.category}
            />
          ))}
        </div>
      </div>
      {/* 5. Booking Checkout Wizard Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-primary-deep text-white px-6 py-5 shrink-0 flex items-center justify-between">
              <div>
                <h3 className="font-heading text-lg font-bold flex items-center gap-1.5">
                  Secure Checkout <Sparkles className="w-4 h-4 text-accent-gold" />
                </h3>
                <p className="text-[10px] text-white/70 font-semibold uppercase tracking-wider mt-0.5">
                  Booking: {boat.name}
                </p>
              </div>
              <button 
                onClick={() => setIsBookingModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
                disabled={isProcessingPayment}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Indicators */}
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 shrink-0 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span className={bookingStep >= 1 ? 'text-secondary-emerald' : ''}>1. Guest Details</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className={bookingStep >= 2 ? 'text-secondary-emerald' : ''}>2. Customize</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className={bookingStep >= 3 ? 'text-secondary-emerald' : ''}>3. Secure Payment</span>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* STEP 1: Guest Details */}
              {bookingStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="space-y-2 border-b border-slate-50 pb-3">
                    <h4 className="font-heading text-sm font-bold text-primary-deep flex items-center gap-2">
                      <User className="w-4 h-4 text-secondary-emerald" /> Primary Guest Information
                    </h4>
                    <p className="text-[10px] text-slate-400 font-sans">Provide contact and identity proof details for verification.</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={guestName}
                        onChange={e => setGuestName(e.target.value)}
                        placeholder="e.g. Meera Deshmukh"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary-emerald/20 focus:border-secondary-emerald"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                        <input 
                          type="email" 
                          required
                          value={guestEmail}
                          onChange={e => setGuestEmail(e.target.value)}
                          placeholder="e.g. meera@gmail.com"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary-emerald/20 focus:border-secondary-emerald"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
                        <input 
                          type="tel" 
                          required
                          value={guestPhone}
                          onChange={e => setGuestPhone(e.target.value)}
                          placeholder="e.g. +91 98201 34567"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary-emerald/20 focus:border-secondary-emerald"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ID Proof Type</label>
                        <select
                          value={idType}
                          onChange={e => setIdType(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary-emerald/20 focus:border-secondary-emerald"
                        >
                          <option value="Aadhaar">Aadhaar Card</option>
                          <option value="Passport">Passport</option>
                          <option value="PAN">PAN Card</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ID Number</label>
                        <input 
                          type="text" 
                          required
                          value={idNumber}
                          onChange={e => setIdNumber(e.target.value)}
                          placeholder="e.g. 5621 9831 2948"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary-emerald/20 focus:border-secondary-emerald"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Customize Cruise */}
              {bookingStep === 2 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="space-y-2 border-b border-slate-50 pb-3">
                    <h4 className="font-heading text-sm font-bold text-primary-deep flex items-center gap-2">
                      <Compass className="w-4 h-4 text-secondary-emerald" /> Customize Your Voyage
                    </h4>
                    <p className="text-[10px] text-slate-400 font-sans">Choose options to enhance your premium backwater experience.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dietary Preference</label>
                        <select
                          value={dietary}
                          onChange={e => setDietary(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary-emerald/20"
                        >
                          <option value="Veg">Vegetarian Meals</option>
                          <option value="Non-Veg">Non-Vegetarian Meals</option>
                          <option value="Jain">Jain Meals</option>
                          <option value="None">No Food (Self Catered)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expected Boarding Time</label>
                        <select
                          value={arrivalTime}
                          onChange={e => setArrivalTime(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary-emerald/20"
                        >
                          <option value="12:00 PM">12:00 PM (Recommended)</option>
                          <option value="01:00 PM">01:00 PM</option>
                          <option value="02:00 PM">02:00 PM</option>
                          <option value="03:00 PM">03:00 PM</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Premium Upgrades</label>
                      
                      {/* Upgrade 1: Honeymoon decoration */}
                      <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-start gap-2.5">
                          <input 
                            type="checkbox"
                            checked={addHoneymoon}
                            onChange={e => setAddHoneymoon(e.target.checked)}
                            className="mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">Honeymoon decoration package</span>
                            <span className="text-[10px] text-slate-400">Floral setup & premium cake on arrival</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-secondary-emerald shrink-0">+₹1,500</span>
                      </label>

                      {/* Upgrade 2: Extra Bed */}
                      <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-start gap-2.5">
                          <input 
                            type="checkbox"
                            checked={addExtraBed}
                            onChange={e => setAddExtraBed(e.target.checked)}
                            className="mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">Extra Bed request</span>
                            <span className="text-[10px] text-slate-400">Added premium cot & bedding arrangement</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-secondary-emerald shrink-0">+₹2,000 /night</span>
                      </label>

                      {/* Upgrade 3: Airport Pickup */}
                      <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-start gap-2.5">
                          <input 
                            type="checkbox"
                            checked={addAirportPickup}
                            onChange={e => setAddAirportPickup(e.target.checked)}
                            className="mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">Kochi Airport pickup service</span>
                            <span className="text-[10px] text-slate-400">Chauffeur driven luxury sedan pickup</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-secondary-emerald shrink-0">+₹2,500</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Secure Payment */}
              {bookingStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="space-y-2 border-b border-slate-50 pb-3">
                    <h4 className="font-heading text-sm font-bold text-primary-deep flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-secondary-emerald" /> Authorized Payment
                    </h4>
                    <p className="text-[10px] text-slate-400 font-sans">Payment gateway powered by Razorpay. Enter details to confirm.</p>
                  </div>

                  {/* Payment selector */}
                  <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-50 rounded-xl border border-slate-100">
                    {(['card','upi','netbanking'] as const).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPaymentMethod(mode)}
                        className={`py-2 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${paymentMethod === mode ? 'bg-primary-deep text-white shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3 pt-2">
                    {paymentMethod === 'card' && (
                      <div className="space-y-3 animate-in fade-in duration-150">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Card Number</label>
                          <input 
                            type="text" 
                            value={cardNumber}
                            onChange={e => setCardNumber(e.target.value)}
                            placeholder="4111 2222 3333 4444"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expiry Date</label>
                            <input 
                              type="text" 
                              value={cardExpiry}
                              onChange={e => setCardExpiry(e.target.value)}
                              placeholder="MM/YY"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">CVV</label>
                            <input 
                              type="password" 
                              value={cardCvc}
                              onChange={e => setCardCvc(e.target.value)}
                              placeholder="•••"
                              maxLength={3}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'upi' && (
                      <div className="space-y-3 animate-in fade-in duration-150">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">UPI ID</label>
                          <input 
                            type="text" 
                            value={upiId}
                            onChange={e => setUpiId(e.target.value)}
                            placeholder="meera@okaxis"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                          A request will be sent to your UPI app. Approve it to confirm booking.
                        </p>
                      </div>
                    )}

                    {paymentMethod === 'netbanking' && (
                      <div className="space-y-3 animate-in fade-in duration-150">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Choose Bank</label>
                        <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800">
                          <option>State Bank of India</option>
                          <option>HDFC Bank</option>
                          <option>ICICI Bank</option>
                          <option>Axis Bank</option>
                        </select>
                      </div>
                    )}

                    {/* Total cost display */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 mt-4">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Base booking cost</span>
                        <span>₹{baseCost.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>GST (18%) + Service Fee (5%)</span>
                        <span>₹{(gstTax + serviceFee).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200/60 pt-2 text-xs font-bold text-primary-deep">
                        <span>Total Checkout Price</span>
                        <span>₹{totalCost.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Actions Footer */}
            <div className="bg-slate-50 border-t border-slate-100 p-4 shrink-0 flex items-center justify-between gap-3">
              {bookingStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setBookingStep(prev => prev - 1)}
                  disabled={isProcessingPayment}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-xs cursor-pointer hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  disabled={isProcessingPayment}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-xs cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>

                {bookingStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (bookingStep === 1 && (!guestName || !guestEmail || !guestPhone || !idNumber)) {
                        toast.error('Please complete all details fields.');
                        return;
                      }
                      setBookingStep(prev => prev + 1);
                    }}
                    className="flex items-center gap-1 bg-primary-deep hover:bg-primary-light text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Next Step <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCompleteBooking}
                    disabled={isProcessingPayment}
                    className="flex items-center justify-center gap-2 bg-secondary-emerald hover:bg-secondary-emerald/90 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Processing Payment...
                      </>
                    ) : (
                      <>
                        Authorize ₹{totalCost.toLocaleString('en-IN')}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Report Review Modal */}
      <ReportReviewModal
        isOpen={Boolean(reportReviewTarget)}
        onClose={() => setReportReviewTarget(null)}
        review={reportReviewTarget}
      />
    </div>
  );
};

export default HouseboatDetails;
