import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Users, Search, Plus, Minus } from 'lucide-react';
import CalendarPicker from './CalendarPicker';

const SearchBar: React.FC = () => {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  
  // Popover Toggles
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isGuestDropdownOpen, setIsGuestDropdownOpen] = useState(false);
  const [isDestDropdownOpen, setIsDestDropdownOpen] = useState(false);

  // Guest States
  const [guests, setGuests] = useState({ adults: 2, children: 0 });

  const destinations = [
    { name: 'Alleppey', desc: 'Vibrant canals & houseboat hub' },
    { name: 'Kumarakom', desc: 'Scenic resorts & bird sanctuary' },
    { name: 'Kollam', desc: 'Gateway to Ashtamudi lake' },
    { name: 'Ashtamudi', desc: 'Serene backwaters & isolation' },
  ];

  const handleGuestChange = (type: 'adults' | 'children', operation: 'inc' | 'dec') => {
    setGuests((prev) => {
      const val = prev[type];
      const newVal = operation === 'inc' ? val + 1 : Math.max(0, val - 1);
      if (type === 'adults' && newVal < 1) return prev; // Keep at least 1 adult
      return { ...prev, [type]: newVal };
    });
  };

  const handleDatesChange = (dates: { checkIn: string; checkOut: string }) => {
    setCheckIn(dates.checkIn);
    setCheckOut(dates.checkOut);
  };

  const formatDate = (dateStr: string, placeholder: string) => {
    if (!dateStr) return placeholder;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams({
      destination,
      checkIn,
      checkOut,
      guests: String(guests.adults + guests.children),
    }).toString();
    navigate(`/search?${query}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="w-full bg-white/95 backdrop-blur-md shadow-premium border border-slate-100 p-4 lg:p-3 rounded-2xl lg:rounded-full grid grid-cols-1 lg:grid-cols-12 gap-3 items-center relative"
    >
      
      {/* 1. Destination Field */}
      <div className="lg:col-span-4 relative px-4 py-2 border-b lg:border-b-0 lg:border-r border-slate-100">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-secondary-emerald" /> Destination
        </label>
        <button
          type="button"
          onClick={() => {
            setIsDestDropdownOpen(!isDestDropdownOpen);
            setIsCalendarOpen(false);
            setIsGuestDropdownOpen(false);
          }}
          className="w-full text-left font-semibold text-slate-800 focus:outline-none flex justify-between items-center cursor-pointer text-sm"
        >
          {destination || 'Where are you going?'}
        </button>

        {isDestDropdownOpen && (
          <div className="absolute left-0 mt-3 w-72 bg-white rounded-2xl shadow-premium border border-slate-100 p-2.5 z-40 animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="text-xs font-bold text-slate-400 px-3 py-1.5 uppercase">Popular Backwaters</div>
            {destinations.map((dest) => (
              <button
                key={dest.name}
                type="button"
                onClick={() => {
                  setDestination(dest.name);
                  setIsDestDropdownOpen(false);
                  setIsCalendarOpen(true); // Automatically move to dates
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl transition-colors flex flex-col cursor-pointer"
              >
                <span className="font-semibold text-slate-800 text-sm">{dest.name}</span>
                <span className="text-xs text-slate-500">{dest.desc}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Check In Button */}
      <div className="lg:col-span-2 px-4 py-2 border-b lg:border-b-0 lg:border-r border-slate-100">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-secondary-emerald" /> Check In
        </label>
        <button
          type="button"
          onClick={() => {
            setIsCalendarOpen(!isCalendarOpen);
            setIsDestDropdownOpen(false);
            setIsGuestDropdownOpen(false);
          }}
          className="w-full text-left font-semibold text-slate-800 focus:outline-none cursor-pointer text-sm"
        >
          {formatDate(checkIn, 'Add date')}
        </button>
      </div>

      {/* 3. Check Out Button */}
      <div className="lg:col-span-2 px-4 py-2 border-b lg:border-b-0 lg:border-r border-slate-100">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-secondary-emerald" /> Check Out
        </label>
        <button
          type="button"
          onClick={() => {
            setIsCalendarOpen(!isCalendarOpen);
            setIsDestDropdownOpen(false);
            setIsGuestDropdownOpen(false);
          }}
          className="w-full text-left font-semibold text-slate-800 focus:outline-none cursor-pointer text-sm"
        >
          {formatDate(checkOut, 'Add date')}
        </button>
      </div>

      {/* 4. Guests Picker */}
      <div className="lg:col-span-3 relative px-4 py-2 border-b lg:border-b-0">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
          <Users className="w-3.5 h-3.5 text-secondary-emerald" /> Guests
        </label>
        <button
          type="button"
          onClick={() => {
            setIsGuestDropdownOpen(!isGuestDropdownOpen);
            setIsDestDropdownOpen(false);
            setIsCalendarOpen(false);
          }}
          className="w-full text-left font-semibold text-slate-800 focus:outline-none flex justify-between items-center cursor-pointer text-sm"
        >
          {`${guests.adults} Adults${guests.children ? `, ${guests.children} Children` : ''}`}
        </button>

        {isGuestDropdownOpen && (
          <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-premium border border-slate-100 p-4 z-40 animate-in fade-in slide-in-from-top-3 duration-200">
            {/* Adults Counter */}
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <div>
                <div className="font-semibold text-slate-800 text-sm">Adults</div>
                <div className="text-xs text-slate-400">Ages 13 or above</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleGuestChange('adults', 'dec')}
                  className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 disabled:opacity-50"
                  disabled={guests.adults <= 1}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-semibold text-slate-800 text-sm w-4 text-center">{guests.adults}</span>
                <button
                  type="button"
                  onClick={() => handleGuestChange('adults', 'inc')}
                  className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Children Counter */}
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-semibold text-slate-800 text-sm">Children</div>
                <div className="text-xs text-slate-400">Ages 2 to 12</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleGuestChange('children', 'dec')}
                  className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 disabled:opacity-50"
                  disabled={guests.children <= 0}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-semibold text-slate-800 text-sm w-4 text-center">{guests.children}</span>
                <button
                  type="button"
                  onClick={() => handleGuestChange('children', 'inc')}
                  className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Search Button */}
      <div className="lg:col-span-1 flex justify-end">
        <button
          type="submit"
          className="w-full lg:w-12 h-12 rounded-full bg-primary-deep hover:bg-primary-light text-white flex items-center justify-center transition-all duration-300 hover:scale-105 shadow-md cursor-pointer"
        >
          <Search className="w-5 h-5 hidden lg:block" />
          <span className="lg:hidden font-semibold flex items-center gap-2">
            <Search className="w-4 h-4" /> Search Houseboats
          </span>
        </button>
      </div>

      {/* Unified Custom Premium Calendar Popover */}
      {isCalendarOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 z-50 animate-in fade-in slide-in-from-top-3 duration-300">
          <CalendarPicker
            checkIn={checkIn}
            checkOut={checkOut}
            onChange={handleDatesChange}
            onClose={() => setIsCalendarOpen(false)}
          />
        </div>
      )}

    </form>
  );
};

export default SearchBar;
