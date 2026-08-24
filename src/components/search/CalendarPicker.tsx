import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarPickerProps {
  checkIn: string;
  checkOut: string;
  onChange: (dates: { checkIn: string; checkOut: string }) => void;
  onClose: () => void;
}

const CalendarPicker: React.FC<CalendarPickerProps> = ({ checkIn, checkOut, onChange, onClose }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [visibleYear, setVisibleYear] = useState(today.getFullYear());
  const [visibleMonth, setVisibleMonth] = useState(today.getMonth()); // 0-indexed
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Parse check-in and check-out to Date objects
  const checkInDate = checkIn ? new Date(checkIn) : null;
  const checkOutDate = checkOut ? new Date(checkOut) : null;

  if (checkInDate) checkInDate.setHours(0, 0, 0, 0);
  if (checkOutDate) checkOutDate.setHours(0, 0, 0, 0);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayIndex = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleMonthChange = (direction: 'next' | 'prev') => {
    if (direction === 'prev') {
      if (visibleYear === today.getFullYear() && visibleMonth === today.getMonth()) return; // Don't go to past months
      if (visibleMonth === 0) {
        setVisibleMonth(11);
        setVisibleYear(prev => prev - 1);
      } else {
        setVisibleMonth(prev => prev - 1);
      }
    } else {
      if (visibleMonth === 11) {
        setVisibleMonth(0);
        setVisibleYear(prev => prev + 1);
      } else {
        setVisibleMonth(prev => prev + 1);
      }
    }
  };

  const handleDateClick = (date: Date) => {
    if (date < today) return; // Prevent selection of past dates

    if (!checkInDate || (checkInDate && checkOutDate)) {
      // First click or reset: set as check-in
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      onChange({ checkIn: `${yyyy}-${mm}-${dd}`, checkOut: '' });
    } else if (checkInDate && !checkOutDate) {
      // Second click: set check-out
      if (date < checkInDate) {
        // If clicked date is before check-in, set it as new check-in
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        onChange({ checkIn: `${yyyy}-${mm}-${dd}`, checkOut: '' });
      } else {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        onChange({ checkIn: checkIn, checkOut: `${yyyy}-${mm}-${dd}` });
        onClose(); // Automatically close popover when both are selected
      }
    }
  };

  const isBetween = (date: Date) => {
    if (checkInDate && checkOutDate) {
      return date > checkInDate && date < checkOutDate;
    }
    if (checkInDate && hoveredDate && !checkOutDate) {
      return date > checkInDate && date < hoveredDate;
    }
    return false;
  };

  const isSelected = (date: Date) => {
    const isCheckIn = checkInDate && date.getTime() === checkInDate.getTime();
    const isCheckOut = checkOutDate && date.getTime() === checkOutDate.getTime();
    return isCheckIn || isCheckOut;
  };

  const renderMonthGrid = (year: number, month: number) => {
    const totalDays = getDaysInMonth(year, month);
    const firstDayIndex = getFirstDayIndex(year, month);
    const dayCells: React.ReactNode[] = [];

    // Offset empty spaces for first week
    for (let i = 0; i < firstDayIndex; i++) {
      dayCells.push(<div key={`empty-${i}`} className="w-10 h-10" />);
    }

    // Days in month
    for (let day = 1; day <= totalDays; day++) {
      const currentDate = new Date(year, month, day);
      currentDate.setHours(0, 0, 0, 0);

      const isPast = currentDate < today;
      const selected = isSelected(currentDate);
      const between = isBetween(currentDate);
      
      const isStart = checkInDate && currentDate.getTime() === checkInDate.getTime();
      const isEnd = checkOutDate && currentDate.getTime() === checkOutDate.getTime();

      dayCells.push(
        <button
          key={`day-${day}`}
          type="button"
          disabled={isPast}
          onClick={() => handleDateClick(currentDate)}
          onMouseEnter={() => !isPast && setHoveredDate(currentDate)}
          className={`w-10 h-10 text-xs font-semibold rounded-full flex items-center justify-center transition-all relative cursor-pointer ${
            isPast ? 'text-slate-200 cursor-not-allowed' : ''
          } ${
            between && !selected
              ? 'bg-primary-light/10 text-primary-light rounded-none'
              : ''
          } ${
            selected
              ? 'bg-primary-deep text-white shadow-md z-10 scale-105'
              : 'text-slate-700 hover:bg-slate-100'
          } ${
            isStart && checkOutDate ? 'rounded-l-full rounded-r-none bg-primary-deep' : ''
          } ${
            isEnd ? 'rounded-r-full rounded-l-none bg-primary-deep' : ''
          }`}
        >
          {day}
        </button>
      );
    }

    return (
      <div className="space-y-4">
        {/* Month Title */}
        <div className="text-center font-bold text-slate-800 text-sm">
          {monthNames[month]} {year}
        </div>
        {/* Days Header */}
        <div className="grid grid-cols-7 gap-y-1 justify-items-center">
          {daysOfWeek.map(day => (
            <span key={day} className="text-xs font-bold text-slate-400 w-10 text-center">
              {day}
            </span>
          ))}
        </div>
        {/* Grid Cells */}
        <div className="grid grid-cols-7 gap-y-1 justify-items-center">
          {dayCells}
        </div>
      </div>
    );
  };

  // Next month calculation
  const nextMonth = visibleMonth === 11 ? 0 : visibleMonth + 1;
  const nextYear = visibleMonth === 11 ? visibleYear + 1 : visibleYear;

  const isPrevDisabled = visibleYear === today.getFullYear() && visibleMonth === today.getMonth();

  return (
    <div 
      className="bg-white rounded-3xl shadow-premium border border-slate-100 p-6 flex flex-col gap-6 w-[320px] md:w-[680px]"
      style={{ backgroundColor: '#ffffff', opacity: 1 }}
    >
      
      {/* Calendar Controls */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={isPrevDisabled}
          onClick={() => handleMonthChange('prev')}
          className="p-1.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 text-slate-600" />
        </button>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select dates</span>
        <button
          type="button"
          onClick={() => handleMonthChange('next')}
          className="p-1.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* Dual Month View */}
      <div className="flex flex-col md:flex-row gap-8 justify-between">
        <div className="flex-1">{renderMonthGrid(visibleYear, visibleMonth)}</div>
        <div className="hidden md:block flex-1 border-l border-slate-100 pl-8">
          {renderMonthGrid(nextYear, nextMonth)}
        </div>
      </div>

      {/* Selected dates indicators & Action summary footer */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
        <div className="text-xs text-slate-500">
          {checkInDate ? (
            <span>
              Selected: <strong className="text-slate-800 font-semibold">{checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
              {checkOutDate && (
                <span> to <strong className="text-slate-800 font-semibold">{checkOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
              )}
            </span>
          ) : (
            <span>Select check-in & check-out dates</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onChange({ checkIn: '', checkOut: '' })}
          className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
        >
          Clear Dates
        </button>
      </div>

    </div>
  );
};

export default CalendarPicker;
