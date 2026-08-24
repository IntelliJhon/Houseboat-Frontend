import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, ArrowUpDown, X, ChevronLeft, ChevronRight } from 'lucide-react';
import HouseboatCard from '../components/common/HouseboatCard';
import { listingsCache } from '../services/listingsCache';



const Listings: React.FC = () => {
  const [searchParams] = useSearchParams();
  
  // 1. Initial State from Search Params
  const initialDest = searchParams.get('destination') || '';
  const initialCheckIn = searchParams.get('checkIn') || '';
  const initialCheckOut = searchParams.get('checkOut') || '';
  const initialGuests = Number(searchParams.get('guests')) || 0;
  
  // 2. Filter States
  const [destinationFilter, setDestinationFilter] = useState(initialDest);
  const [checkInFilter, setCheckInFilter] = useState(initialCheckIn);
  const [checkOutFilter, setCheckOutFilter] = useState(initialCheckOut);
  const [guestsFilter, setGuestsFilter] = useState(initialGuests);

  const [priceMax, setPriceMax] = useState(30000);
  const [selectedBedrooms, setSelectedBedrooms] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('rating-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // 3. Database Listings state initialized instantly from instant memory/session cache
  const [vessels, setVessels] = useState<any[]>(() => listingsCache.getInitialListings());

  useEffect(() => {
    setDestinationFilter(searchParams.get('destination') || '');
    setCheckInFilter(searchParams.get('checkIn') || '');
    setCheckOutFilter(searchParams.get('checkOut') || '');
    setGuestsFilter(Number(searchParams.get('guests')) || 0);
  }, [searchParams]);

  useEffect(() => {
    // Perform fast background revalidation
    listingsCache.fetchListingsFresh((freshData) => {
      setVessels(freshData);
    });
  }, []);

  const combinedListings = useMemo(() => {
    return vessels;
  }, [vessels]);

  const categories = ['All', 'Luxury', 'Premium', 'Ultra Luxury'];
  const destinations = ['All', 'Alleppey', 'Kumarakom', 'Kollam', 'Ashtamudi', 'Vembanad'];
  const amenitiesList = ['Private Chef', 'Sun Deck', 'Wi-Fi', 'Traditional Meals', 'Fishing Gear'];

  // Toggle amenities selection
  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  // Filter & Sort Logic
  const filteredHouseboats = useMemo(() => {
    return combinedListings.filter(hb => {
      // Destination filter
      if (destinationFilter && destinationFilter !== 'All' && hb.location !== destinationFilter) {
        return false;
      }
      // Price filter
      if (hb.pricePerNight > priceMax) {
        return false;
      }
      // Bedrooms filter
      if (selectedBedrooms && hb.bedrooms !== selectedBedrooms) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'All' && hb.category !== selectedCategory) {
        return false;
      }
      // Amenities filter
      if (selectedAmenities.length > 0) {
        const hasAllSelected = selectedAmenities.every(a => hb.amenities.includes(a));
        if (!hasAllSelected) return false;
      }
      // Guests filter
      if (guestsFilter && hb.capacity < guestsFilter) {
        return false;
      }
      // Date availability check
      if (checkInFilter && checkOutFilter) {
        const reqStart = new Date(checkInFilter);
        const reqEnd = new Date(checkOutFilter);
        
        const hasConflict = hb.bookings?.some((booking: any) => {
          const bStart = new Date(booking.checkInDate);
          const bEnd = new Date(booking.checkOutDate);
          return reqStart < bEnd && reqEnd > bStart;
        });
        
        if (hasConflict) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.pricePerNight - b.pricePerNight;
      if (sortBy === 'price-desc') return b.pricePerNight - a.pricePerNight;
      return b.rating - a.rating; // Default rating-desc
    });
  }, [destinationFilter, priceMax, selectedBedrooms, selectedCategory, selectedAmenities, sortBy, guestsFilter, checkInFilter, checkOutFilter, combinedListings]);

  const itemsPerPage = 4;
  const totalPages = Math.ceil(filteredHouseboats.length / itemsPerPage);

  const paginatedHouseboats = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredHouseboats.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredHouseboats, currentPage]);

  const resetAllFilters = () => {
    setDestinationFilter('');
    setCheckInFilter('');
    setCheckOutFilter('');
    setGuestsFilter(0);
    setPriceMax(30000);
    setSelectedBedrooms(null);
    setSelectedCategory('All');
    setSelectedAmenities([]);
    setSortBy('rating-desc');
    setCurrentPage(1);
  };

  const renderFiltersContent = () => (
    <div className="space-y-6">
      
      {/* Destination Filter */}
      <div>
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Destination</h4>
        <div className="flex flex-wrap gap-2">
          {destinations.map(dest => (
            <button
              key={dest}
              type="button"
              onClick={() => {
                setDestinationFilter(dest === 'All' ? '' : dest);
                setCurrentPage(1);
              }}
              className={`text-xs font-semibold px-4.5 py-2 rounded-full border transition-all cursor-pointer ${
                (dest === 'All' && !destinationFilter) || (dest === destinationFilter)
                  ? 'bg-primary-deep border-primary-deep text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {dest}
            </button>
          ))}
        </div>
      </div>

      {/* Travel Dates Filter */}
      <div className="border-t border-slate-100 pt-5">
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Booking Dates</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Check In</label>
            <input
              type="date"
              value={checkInFilter}
              onChange={(e) => {
                setCheckInFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-secondary-emerald"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Check Out</label>
            <input
              type="date"
              value={checkOutFilter}
              onChange={(e) => {
                setCheckOutFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-secondary-emerald"
            />
          </div>
        </div>
      </div>

      {/* Guests Capacity Filter */}
      <div className="border-t border-slate-100 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Guests</h4>
          <span className="text-xs font-extrabold text-secondary-emerald">
            {guestsFilter ? `${guestsFilter} Guest${guestsFilter !== 1 ? 's' : ''}` : 'Any Guests'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setGuestsFilter(prev => Math.max(0, prev - 1));
              setCurrentPage(1);
            }}
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 font-bold cursor-pointer transition-colors"
          >
            -
          </button>
          <span className="font-semibold text-slate-800 text-sm w-4 text-center">{guestsFilter}</span>
          <button
            type="button"
            onClick={() => {
              setGuestsFilter(prev => prev + 1);
              setCurrentPage(1);
            }}
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 font-bold cursor-pointer transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Price Filter */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Max Price per night</h4>
          <span className="text-sm font-extrabold text-secondary-emerald">₹{priceMax.toLocaleString('en-IN')}</span>
        </div>
        <input
          type="range"
          min={5000}
          max={30000}
          step={1000}
          value={priceMax}
          onChange={(e) => {
            setPriceMax(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="w-full accent-secondary-emerald cursor-pointer"
        />
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mt-1.5 uppercase">
          <span>₹5,000</span>
          <span>₹30,000</span>
        </div>
      </div>

      {/* Bedrooms Filter */}
      <div>
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Bedrooms</h4>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => {
                setSelectedBedrooms(selectedBedrooms === num ? null : num);
                setCurrentPage(1);
              }}
              className={`h-10 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                selectedBedrooms === num
                  ? 'bg-primary-deep border-primary-deep text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {num === 4 ? '4+' : `${num} BR`}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Boat Category</h4>
        <div className="grid grid-cols-2 gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              className={`h-10 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-primary-deep border-primary-deep text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Amenities Checklist */}
      <div>
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Amenities</h4>
        <div className="space-y-2.5">
          {amenitiesList.map(amenity => {
            const checked = selectedAmenities.includes(amenity);
            return (
              <label key={amenity} className="flex items-center gap-3.5 text-sm text-slate-600 hover:text-slate-900 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    handleAmenityToggle(amenity);
                    setCurrentPage(1);
                  }}
                  className="w-4.5 h-4.5 rounded border-slate-300 text-secondary-emerald accent-secondary-emerald focus:ring-0 cursor-pointer"
                />
                <span>{amenity}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={resetAllFilters}
        className="w-full py-3 border border-red-200 hover:bg-red-50 text-red-500 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
      >
        Clear All Filters
      </button>

    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* 1. Header Information */}
      <div className="border-b border-slate-100 pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-primary-deep">
            Explore Backwater Houseboats
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {filteredHouseboats.length} premium stays matching your query
          </p>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" /> Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer hover:border-slate-300"
          >
            <option value="rating-desc">Highest Rated</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* 2. Desktop Sidebar Filters */}
        <aside className="hidden lg:block lg:col-span-1 bg-white rounded-3xl p-6 border border-slate-100 shadow-premium sticky top-24 self-start max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
            <h3 className="font-heading text-base font-extrabold text-primary-deep flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-secondary-emerald" /> Filters
            </h3>
          </div>
          {renderFiltersContent()}
        </aside>

        {/* 3. Houseboat Grid Display */}
        <div className="lg:col-span-3 space-y-8">
          {paginatedHouseboats.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {paginatedHouseboats.map(hb => (
                  <HouseboatCard key={hb.id} {...hb} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 border-t border-slate-100 pt-8">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const page = idx + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          currentPage === page
                            ? 'bg-primary-deep border-primary-deep text-white shadow-sm'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-premium flex flex-col items-center justify-center gap-4">
              <span className="text-4xl">⛵</span>
              <h3 className="font-heading text-lg font-bold text-primary-deep">No Houseboats Found</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                No matching houseboats fit your exact filters. Try relaxing your parameters or clearing the checkboxes.
              </p>
              <button
                onClick={resetAllFilters}
                className="bg-primary-deep text-white text-xs font-bold px-6 py-3 rounded-xl hover:bg-primary-light transition-all shadow-sm cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>

      </div>

      {/* 4. Mobile Floating Filter Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 lg:hidden">
        <button
          onClick={() => setIsMobileFiltersOpen(true)}
          className="bg-slate-900 text-white font-bold text-xs uppercase tracking-widest px-6 py-3.5 rounded-full shadow-lg flex items-center gap-2 hover:bg-slate-800 transition-all hover:scale-105 cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4 text-secondary-emerald" /> Filters
        </button>
      </div>

      {/* 5. Mobile Fullscreen Slide-Up Filters Drawer */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white h-full p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-heading text-lg font-extrabold text-primary-deep">Filter Search</h3>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              {renderFiltersContent()}
            </div>
            <button
              onClick={() => setIsMobileFiltersOpen(false)}
              className="w-full py-4 bg-primary-deep text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-sm mt-8 cursor-pointer"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Listings;
