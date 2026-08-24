import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, X, 
  ShieldAlert, Sparkles, Hammer, Ban, DollarSign, Trash2, Info,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Houseboat } from '../HostDashboard';
import api from '../../../services/api';

interface CalendarSectionProps {
  selectedBoat: Houseboat | null;
  setSelectedBoat?: (boat: Houseboat | null) => void;
  fleet?: Houseboat[];
  setActivePage: (page: any) => void;
}

interface AvailabilitySlot {
  date: string;
  status: 'AVAILABLE' | 'BOOKED' | 'CHECK-IN' | 'CHECK-OUT' | "TODAY'S TRIP" | 'BLOCKED' | 'MAINTENANCE' | 'SPECIAL_PRICE' | 'PEAK_SEASON' | 'HOLIDAY';
  price: number;
  details?: {
    id?: string;
    customerName?: string;
    email?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    amount?: number;
    blocked?: {
      reason: string;
      customReason?: string;
    };
    maintenance?: {
      type: string;
      customType?: string;
    };
    specialPrice?: {
      price: number;
    };
    peakSeason?: {
      name: string;
      multiplier: number;
    };
    holiday?: {
      name: string;
    };
  };
}

export const CalendarSection: React.FC<CalendarSectionProps> = ({
  selectedBoat,
  setSelectedBoat,
  fleet = [],
  setActivePage
}) => {
  if (!selectedBoat) return null;

  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1); // 1-indexed

  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Drag select dates range
  const [dragStart, setDragStart] = useState<Date | null>(null);
  const [dragEnd, setDragEnd] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Hover card tooltip
  const [hoveredSlot, setHoveredSlot] = useState<AvailabilitySlot | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Control drawer actions
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [drawerAction, setDrawerAction] = useState<'block' | 'maintenance' | 'special_price' | 'holiday' | 'peak_season' | 'remove'>('block');

  // Form Fields
  const [blockReason, setBlockReason] = useState<string>('Maintenance');
  const [blockNotes, setBlockNotes] = useState<string>('');
  const [maintenanceType, setMaintenanceType] = useState<string>('Engine Service');
  const [maintenanceNotes, setMaintenanceNotes] = useState<string>('');
  const [overridePrice, setOverridePrice] = useState<string>('');
  const [adjustmentType, setAdjustmentType] = useState<'absolute' | 'increase' | 'decrease'>('absolute');
  const [percentageAdjustment, setPercentageAdjustment] = useState<string>('');
  const [holidayName, setHolidayName] = useState<string>('');
  const [peakSeasonName, setPeakSeasonName] = useState<string>('');
  const [peakMultiplier, setPeakMultiplier] = useState<string>('1.25');

  // Stats operational counters
  const [stats, setStats] = useState({
    availableDays: 0,
    bookedDays: 0,
    blockedDays: 0,
    maintenanceDays: 0,
    occupancy: 0,
    checkIns: 0,
    checkOuts: 0,
    monthlyRevenue: 0,
    upcomingTrips: 0,
  });

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const yearsRange = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i);

  // Load live availability slots
  const fetchAvailability = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/v1/availability/${selectedBoat.id}/month`, {
        params: {
          year: currentYear,
          month: currentMonth,
        },
      });

      const fetchedSlots = response.data?.data?.slots || [];
      setSlots(fetchedSlots);

      // Compute summary statistics dynamically
      const avail = fetchedSlots.filter((s: any) => s.status === 'AVAILABLE' || s.status === 'SPECIAL_PRICE' || s.status === 'HOLIDAY' || s.status === 'PEAK_SEASON');
      const booked = fetchedSlots.filter((s: any) => s.status === 'BOOKED' || s.status === 'CHECK-IN' || s.status === 'CHECK-OUT' || s.status === "TODAY'S TRIP");
      const blocked = fetchedSlots.filter((s: any) => s.status === 'BLOCKED');
      const maint = fetchedSlots.filter((s: any) => s.status === 'MAINTENANCE');

      const checkInCount = fetchedSlots.filter((s: any) => s.status === 'CHECK-IN').length;
      const checkOutCount = fetchedSlots.filter((s: any) => s.status === 'CHECK-OUT').length;

      // Calculate revenue from booked days
      const rev = booked.reduce((acc: number, curr: any) => acc + (curr.price || 0), 0);

      // Unique booking IDs for upcoming trips
      const uniqueBookings = new Set(booked.map((s: any) => s.details?.id).filter(Boolean));

      setStats({
        availableDays: avail.length,
        bookedDays: booked.length,
        blockedDays: blocked.length,
        maintenanceDays: maint.length,
        occupancy: fetchedSlots.length ? Math.round((booked.length / fetchedSlots.length) * 100) : 0,
        checkIns: checkInCount,
        checkOuts: checkOutCount,
        monthlyRevenue: rev,
        upcomingTrips: uniqueBookings.size,
      });
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to fetch houseboat calendar schedules.';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [currentYear, currentMonth, selectedBoat.id]);

  // Navigate calendar
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
  };

  // Drag selection helpers
  const handleCellMouseDown = (dateStr: string) => {
    const date = new Date(dateStr);
    // Do not allow dragging starting on booked slots
    const targetSlot = slots.find(s => s.date.split('T')[0] === dateStr.split('T')[0]);
    if (targetSlot && (targetSlot.status === 'BOOKED' || targetSlot.status === 'CHECK-IN' || targetSlot.status === 'CHECK-OUT' || targetSlot.status === "TODAY'S TRIP")) {
      return;
    }
    setDragStart(date);
    setDragEnd(date);
    setIsDragging(true);
  };

  const handleCellMouseEnter = (dateStr: string) => {
    if (!isDragging || !dragStart) return;
    const date = new Date(dateStr);
    setDragEnd(date);
  };

  const handleCellMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragStart && dragEnd) {
      setIsDrawerOpen(true);
    }
  };

  const getSortedRange = (): { start: Date; end: Date } | null => {
    if (!dragStart || !dragEnd) return null;
    const start = new Date(Math.min(dragStart.getTime(), dragEnd.getTime()));
    const end = new Date(Math.max(dragStart.getTime(), dragEnd.getTime()));
    return { start, end };
  };

  const isDateSelected = (dateStr: string): boolean => {
    if (!dragStart || !dragEnd) return false;
    const range = getSortedRange();
    if (!range) return false;

    const cellDate = new Date(dateStr);
    cellDate.setUTCHours(0, 0, 0, 0);

    const s = new Date(range.start);
    s.setUTCHours(0, 0, 0, 0);
    const e = new Date(range.end);
    e.setUTCHours(0, 0, 0, 0);

    return cellDate >= s && cellDate <= e;
  };

  // Save changes via API
  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    const range = getSortedRange();
    if (!range) return;

    const loadingToast = toast.loading('Synchronizing schedule updates with Availability Engine...');
    try {
      const payload: any = {
        houseboatId: selectedBoat.id,
        startDate: range.start.toISOString(),
        endDate: range.end.toISOString(),
      };

      if (drawerAction === 'block') {
        payload.reason = blockReason;
        payload.customReason = blockNotes;
        await api.post('/v1/availability/block-dates', payload);
      } else if (drawerAction === 'maintenance') {
        payload.type = maintenanceType;
        payload.customType = maintenanceNotes;
        await api.post('/v1/availability/maintenance', payload);
      } else if (drawerAction === 'special_price') {
        payload.price = overridePrice ? Number(overridePrice) : undefined;
        payload.adjustmentType = adjustmentType;
        payload.percentage = percentageAdjustment ? Number(percentageAdjustment) : undefined;
        await api.post('/v1/availability/special-pricing', payload);
      } else if (drawerAction === 'holiday') {
        payload.status = 'HOLIDAY';
        payload.name = holidayName;
        await api.patch('/v1/availability/update-status', payload);
      } else if (drawerAction === 'peak_season') {
        payload.status = 'PEAK_SEASON';
        payload.name = peakSeasonName;
        payload.multiplier = Number(peakMultiplier);
        await api.patch('/v1/availability/update-status', payload);
      } else if (drawerAction === 'remove') {
        await api.post('/v1/availability/remove-status', payload);
      }

      toast.dismiss(loadingToast);
      toast.success('Calendar slot overrides successfully applied!');
      setIsDrawerOpen(false);
      setDragStart(null);
      setDragEnd(null);
      fetchAvailability();
    } catch (err: any) {
      toast.dismiss(loadingToast);
      const errMsg = err.response?.data?.message || 'Failed to apply overrides.';
      toast.error(errMsg);
    }
  };

  // Helper styles per slot status
  const getStyleClass = (status: AvailabilitySlot['status'], isSelected: boolean) => {
    if (isSelected) {
      return 'bg-indigo-50 border-2 border-indigo-500 shadow-premium';
    }

    switch (status) {
      case 'BOOKED':
        return 'bg-sky-50 border-sky-100 text-sky-700 hover:bg-sky-100/50';
      case 'CHECK-IN':
        return 'bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100/50';
      case 'CHECK-OUT':
        return 'bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100/50';
      case "TODAY'S TRIP":
        return 'bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100/50';
      case 'BLOCKED':
        return 'bg-red-50 border-red-100 text-red-700 hover:bg-red-100/50';
      case 'MAINTENANCE':
        return 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/50';
      case 'SPECIAL_PRICE':
        return 'bg-purple-50 border-purple-100 text-purple-700 hover:bg-purple-100/50';
      case 'PEAK_SEASON':
        return 'bg-orange-50 border-orange-100 text-orange-700 hover:bg-orange-100/50';
      case 'HOLIDAY':
        return 'bg-teal-50 border-teal-100 text-teal-700 hover:bg-teal-100/50';
      default:
        return 'bg-white border-slate-100 text-slate-800 hover:bg-slate-50/50';
    }
  };

  // Hover card tooltip position
  const handleMouseEnterCell = (e: React.MouseEvent, slot: AvailabilitySlot) => {
    if (slot.status === 'AVAILABLE' || slot.status === 'SPECIAL_PRICE') return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverPosition({
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY - 10,
    });
    setHoveredSlot(slot);
  };

  const handleMouseLeaveCell = () => {
    setHoveredSlot(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div className="flex gap-4 items-center min-w-0">
          <button 
            type="button"
            onClick={() => setActivePage('my-fleet')}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors border border-slate-200 shadow-sm cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex gap-3 items-center min-w-0">
            <img src={selectedBoat.image} alt={selectedBoat.name} className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-sm shrink-0" />
            <div className="min-w-0">
              {fleet && fleet.length > 1 ? (
                <div className="flex flex-col">
                  <div className="relative inline-block max-w-full">
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-2 font-heading text-lg font-bold text-primary-deep bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 focus:outline-none cursor-pointer max-w-full shadow-sm hover:shadow transition-all duration-200"
                    >
                      <span className="truncate">{selectedBoat.name}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                      <>
                        {/* Backdrop to dismiss dropdown menu */}
                        <div className="fixed inset-0 z-30" onClick={() => setIsDropdownOpen(false)} />
                        
                        {/* Custom dropdown drawer */}
                        <div className="absolute left-0 mt-2 w-72 bg-white/95 backdrop-blur-md border border-slate-100 rounded-xl shadow-premium z-40 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150 origin-top-left">
                          {fleet.map((b) => (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => {
                                if (setSelectedBoat) {
                                  setSelectedBoat(b);
                                  setDragStart(null);
                                  setDragEnd(null);
                                }
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-3 hover:bg-slate-50/80 flex flex-col transition-colors cursor-pointer ${
                                b.id === selectedBoat.id ? 'bg-indigo-50/50 border-l-4 border-indigo-500 pl-3' : 'pl-4'
                              }`}
                            >
                              <span className={`font-semibold text-sm truncate ${b.id === selectedBoat.id ? 'text-indigo-600' : 'text-slate-700'}`}>
                                {b.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">
                                {b.category} • {b.location}
                              </span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase mt-1.5">{selectedBoat.category} • {selectedBoat.location}</span>
                </div>
              ) : (
                <>
                  <h1 className="font-heading text-lg font-bold text-primary-deep truncate">{selectedBoat.name}</h1>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">{selectedBoat.category} • {selectedBoat.location}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          {dragStart && dragEnd && (
            <button 
              type="button"
              onClick={() => {
                setDragStart(null);
                setDragEnd(null);
              }}
              className="flex-1 sm:flex-initial bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm cursor-pointer text-center"
            >
              Clear Selection
            </button>
          )}
          <button 
            type="button"
            onClick={() => {
              if (!dragStart || !dragEnd) {
                toast.error('Drag select a date range on the calendar first.');
                return;
              }
              setDrawerAction('special_price');
              setIsDrawerOpen(true);
            }}
            className="flex-1 sm:flex-initial bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm cursor-pointer text-center"
          >
            Apply Rate Surge
          </button>
          <button 
            type="button"
            onClick={() => {
              if (!dragStart || !dragEnd) {
                toast.error('Drag select a date range on the calendar first.');
                return;
              }
              setDrawerAction('maintenance');
              setIsDrawerOpen(true);
            }}
            className="flex-1 sm:flex-initial bg-primary-deep hover:bg-primary-light text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md cursor-pointer text-center"
          >
            Schedule Maintenance
          </button>
        </div>
      </div>

      {/* Stats summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { label: 'Available Days', val: stats.availableDays, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
          { label: 'Booked Days', val: stats.bookedDays, color: 'bg-sky-50 text-sky-600 border-sky-100' },
          { label: 'Blocked Days', val: stats.blockedDays, color: 'bg-red-50 text-red-600 border-red-100' },
          { label: 'Maintenance Days', val: stats.maintenanceDays, color: 'bg-slate-100 text-slate-600 border-slate-200' },
          { label: 'Occupancy %', val: `${stats.occupancy}%`, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
          { label: 'Check-ins', val: stats.checkIns, color: 'bg-amber-50 text-amber-600 border-amber-100' },
          { label: 'Check-outs', val: stats.checkOuts, color: 'bg-rose-50 text-rose-600 border-rose-100' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-premium flex flex-col justify-between gap-2 text-center">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">{stat.label}</span>
            <span className={`text-sm font-extrabold px-2.5 py-1 rounded-xl border ${stat.color}`}>{stat.val}</span>
          </div>
        ))}
      </div>

      {/* Calendar core container */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-premium p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex gap-2 items-center">
            <h3 className="font-heading text-base font-bold text-primary-deep">{MONTH_NAMES[currentMonth - 1]} {currentYear}</h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase border border-slate-100 rounded px-2 py-0.5">Availability Engine</span>
          </div>

          <div className="flex gap-1.5 items-center w-full sm:w-auto">
            <button 
              type="button"
              onClick={handleJumpToToday}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-slate-700 cursor-pointer"
            >
              Today
            </button>
            <select 
              value={currentMonth}
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx + 1}>{m}</option>
              ))}
            </select>
            <select 
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              {yearsRange.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <div className="flex gap-1 shrink-0">
              <button onClick={handlePrevMonth} type="button" className="p-1.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={handleNextMonth} type="button" className="p-1.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3.5 text-[8px] font-extrabold uppercase tracking-widest border-b border-slate-50 pb-3.5 text-slate-400">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Booked</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Check-In</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Check-Out</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Today's Trip</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Maintenance</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Blocked</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Special Price</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Peak Season</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> Holiday</div>
        </div>

        {/* Mobile Swipe Hint */}
        <div className="md:hidden text-[10px] font-bold text-slate-400 text-center py-1 flex items-center justify-center gap-1 border-b border-slate-50 mb-2">
          <span>↔️ Swipe horizontally to view full calendar & prices</span>
        </div>

        {/* Scrollable Calendar Grid Container for Mobile */}
        <div className="overflow-x-auto pb-2 scrollbar-thin">
          <div className="min-w-[650px] md:min-w-full space-y-2">
            {/* Calendar days core view */}
            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-1 pt-1">
              <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-7 gap-1 border-l border-t border-slate-50 rounded-2xl overflow-hidden animate-pulse">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-100 min-h-[95px] p-2 flex flex-col justify-between" />
                ))}
              </div>
            ) : (
              <div 
                onMouseLeave={handleCellMouseUp}
                className="grid grid-cols-7 border-l border-t border-slate-50 rounded-2xl overflow-hidden shadow-sm select-none"
              >
                {slots.map((slot, index) => {
                  const dateObj = new Date(slot.date);
                  const dayStr = dateObj.getUTCDate();
                  const isSelected = isDateSelected(slot.date);
                  
                  return (
                    <div 
                      key={index}
                      onMouseDown={() => handleCellMouseDown(slot.date)}
                      onMouseEnter={(e) => {
                        handleCellMouseEnter(slot.date);
                        handleMouseEnterCell(e, slot);
                      }}
                      onMouseLeave={handleMouseLeaveCell}
                      onMouseUp={handleCellMouseUp}
                      className={`border border-slate-100 min-h-[95px] p-2.5 flex flex-col justify-between transition-all duration-200 cursor-pointer ${getStyleClass(slot.status, isSelected)}`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[11px] font-bold text-slate-500">{dayStr}</span>
                        {slot.status === 'SPECIAL_PRICE' && (
                          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold block text-right tracking-tight">₹{slot.price.toLocaleString('en-IN')}</span>
                        <span className="text-[8px] font-extrabold uppercase tracking-wider block px-1.5 py-0.5 rounded text-center truncate border shadow-2xs">
                          {slot.status === 'SPECIAL_PRICE' ? 'SURGE RATE' : slot.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hover tooltip details card */}
      {hoveredSlot && hoveredSlot.details && (
        <div 
          style={{
            position: 'absolute',
            left: `${hoverPosition.x}px`,
            top: `${hoverPosition.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
          className="w-64 bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 shadow-xl z-40 pointer-events-none space-y-3 animate-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-800 pb-2">
            <div>
              <span className="text-[8px] font-extrabold text-indigo-400 uppercase tracking-widest">
                {hoveredSlot.status.replace('_', ' ')} DETAILS
              </span>
              <span className="block text-[10px] font-semibold text-slate-400">
                {new Date(hoveredSlot.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            {hoveredSlot.status.includes('BOOKED') && (
              <span className="text-[8px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md font-extrabold uppercase">
                Active
              </span>
            )}
          </div>

          {/* Details mappings */}
          {hoveredSlot.details.customerName ? (
            <div className="text-[10px] space-y-1.5 font-semibold text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Booking ID:</span>
                <span className="font-mono text-white">{hoveredSlot.details.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="text-white font-bold">{hoveredSlot.details.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Guests:</span>
                <span className="text-white">{hoveredSlot.details.guests} Persons</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timeline:</span>
                <span className="text-white">
                  {new Date(hoveredSlot.details.checkIn || '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(hoveredSlot.details.checkOut || '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1.5 mt-1">
                <span className="text-slate-500">Paid Amount:</span>
                <span className="text-emerald-400 font-extrabold">₹{hoveredSlot.details.amount?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-slate-300 space-y-1 font-semibold">
              {hoveredSlot.details.blocked && (
                <>
                  <div><span className="text-slate-500">Reason:</span> <span className="text-white font-bold">{hoveredSlot.details.blocked.reason}</span></div>
                  {hoveredSlot.details.blocked.customReason && (
                    <div><span className="text-slate-500">Notes:</span> <span className="text-slate-400 italic">"{hoveredSlot.details.blocked.customReason}"</span></div>
                  )}
                </>
              )}
              {hoveredSlot.details.maintenance && (
                <>
                  <div><span className="text-slate-500">Task:</span> <span className="text-white font-bold">{hoveredSlot.details.maintenance.type}</span></div>
                  {hoveredSlot.details.maintenance.customType && (
                    <div><span className="text-slate-500">Details:</span> <span className="text-slate-400 italic">"{hoveredSlot.details.maintenance.customType}"</span></div>
                  )}
                </>
              )}
              {hoveredSlot.details.holiday && (
                <div><span className="text-slate-500">Holiday:</span> <span className="text-white font-bold">{hoveredSlot.details.holiday.name}</span></div>
              )}
              {hoveredSlot.details.peakSeason && (
                <div><span className="text-slate-500">Peak Season:</span> <span className="text-white font-bold">{hoveredSlot.details.peakSeason.name} (+{Math.round((hoveredSlot.details.peakSeason.multiplier - 1) * 100)}%)</span></div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white h-full p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300 shadow-premium">
            <div className="space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-heading text-lg font-bold text-primary-deep">Apply Calendar Action</h3>
                  {dragStart && dragEnd && (
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mt-1">
                      Range: {getSortedRange()?.start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} to {getSortedRange()?.end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action navigation tabs */}
              <div className="grid grid-cols-3 gap-2 text-[9px] font-bold uppercase tracking-wider">
                {[
                  { id: 'block', label: 'Block Dates', icon: <Ban className="w-3.5 h-3.5" /> },
                  { id: 'maintenance', label: 'Maintenance', icon: <Hammer className="w-3.5 h-3.5" /> },
                  { id: 'special_price', label: 'Surge Price', icon: <DollarSign className="w-3.5 h-3.5" /> },
                  { id: 'holiday', label: 'Holiday', icon: <Info className="w-3.5 h-3.5" /> },
                  { id: 'peak_season', label: 'Peak Season', icon: <Sparkles className="w-3.5 h-3.5" /> },
                  { id: 'remove', label: 'Remove Overrides', icon: <Trash2 className="w-3.5 h-3.5" /> }
                ].map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => setDrawerAction(act.id as any)}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-center transition-all cursor-pointer ${drawerAction === act.id ? 'bg-primary-deep text-white border-primary-deep shadow-md' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                  >
                    {act.icon}
                    {act.label}
                  </button>
                ))}
              </div>

              {/* Specific Forms */}
              <form onSubmit={handleSubmitAction} className="space-y-4 pt-2">
                
                {drawerAction === 'block' && (
                  <div className="space-y-4 animate-in fade-in">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Block Reason</label>
                      <select 
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                      >
                        <option value="Private Booking">Private Booking</option>
                        <option value="Maintenance">Scheduled Maintenance</option>
                        <option value="Owner Use">Owner Use</option>
                        <option value="Festival">Festival Block</option>
                        <option value="Other">Other Reason</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Internal Audit Notes</label>
                      <textarea 
                        rows={3}
                        placeholder="Why is this range blocked? Details will appear in internal logs..."
                        value={blockNotes}
                        onChange={(e) => setBlockNotes(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-semibold text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {drawerAction === 'maintenance' && (
                  <div className="space-y-4 animate-in fade-in">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Maintenance Category</label>
                      <select 
                        value={maintenanceType}
                        onChange={(e) => setMaintenanceType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                      >
                        <option value="Minor">Minor Fixes</option>
                        <option value="Major">Major Refurbishment</option>
                        <option value="Cleaning">Sanitization & Deep Cleaning</option>
                        <option value="Engine Service">Engine Servicing & Lubrication</option>
                        <option value="Paint Work">Coating & Paintwork Touch-up</option>
                        <option value="Custom">Custom Maintenance Task</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Task Description</label>
                      <textarea 
                        rows={3}
                        placeholder="List specific items to fix, engine metrics, or operator notes..."
                        value={maintenanceNotes}
                        onChange={(e) => setMaintenanceNotes(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-semibold text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {drawerAction === 'special_price' && (
                  <div className="space-y-4 animate-in fade-in">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Surge Adjustment Type</label>
                      <select 
                        value={adjustmentType}
                        onChange={(e) => setAdjustmentType(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                      >
                        <option value="absolute">Absolute Price Override (INR)</option>
                        <option value="increase">Percentage Increase (%)</option>
                        <option value="decrease">Percentage Decrease (%)</option>
                      </select>
                    </div>

                    {adjustmentType === 'absolute' ? (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Price Per Night (₹)</label>
                        <input 
                          type="number"
                          placeholder="e.g. 18000"
                          value={overridePrice}
                          onChange={(e) => setOverridePrice(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Adjustment Percentage (%)</label>
                        <input 
                          type="number"
                          placeholder="e.g. 25"
                          value={percentageAdjustment}
                          onChange={(e) => setPercentageAdjustment(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}

                {drawerAction === 'holiday' && (
                  <div className="space-y-4 animate-in fade-in">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Holiday/Festival Name</label>
                      <input 
                        type="text"
                        placeholder="e.g. Onam Festival, New Year's Eve"
                        value={holidayName}
                        onChange={(e) => setHolidayName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {drawerAction === 'peak_season' && (
                  <div className="space-y-4 animate-in fade-in">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Peak Season Name</label>
                      <input 
                        type="text"
                        placeholder="e.g. Kerala Winter Season Surge"
                        value={peakSeasonName}
                        onChange={(e) => setPeakSeasonName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Rate Multiplier (x Base Price)</label>
                      <select 
                        value={peakMultiplier}
                        onChange={(e) => setPeakMultiplier(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                      >
                        <option value="1.1">1.10x Rate (+10%)</option>
                        <option value="1.25">1.25x Rate (+25%)</option>
                        <option value="1.5">1.50x Rate (+50%)</option>
                        <option value="2.0">2.00x Rate (+100%)</option>
                      </select>
                    </div>
                  </div>
                )}

                {drawerAction === 'remove' && (
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-2.5 text-red-700 animate-in fade-in">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <div>
                      <h4 className="font-extrabold text-[11px] uppercase tracking-wider mb-1">Confirm Clearance</h4>
                      <p className="text-[10px] font-medium leading-relaxed">This action will clear all manual blockages, maintenance events, surged pricing overrides, and holiday marks inside the selected date range. Dates will return to base default availability.</p>
                    </div>
                  </div>
                )}

                {/* Submit button bar */}
                <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-primary-deep hover:bg-primary-light text-white px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer shadow-md"
                  >
                    {drawerAction === 'remove' ? 'Clear Overrides' : 'Save Schedule Logs'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
