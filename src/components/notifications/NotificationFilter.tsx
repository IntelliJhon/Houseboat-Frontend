import React from 'react';

export type TimeframeFilter = 'all' | 'today' | 'yesterday' | 'week' | 'older';
export type CategoryFilter = 'ALL' | 'BOOKING' | 'PAYMENT' | 'APPROVAL' | 'MAINTENANCE' | 'REVIEW' | 'SYSTEM';

interface NotificationFilterProps {
  activeTimeframe: TimeframeFilter;
  activeCategory: CategoryFilter;
  onTimeframeChange: (tf: TimeframeFilter) => void;
  onCategoryChange: (cat: CategoryFilter) => void;
}

export const NotificationFilter: React.FC<NotificationFilterProps> = ({
  activeTimeframe,
  activeCategory,
  onTimeframeChange,
  onCategoryChange,
}) => {
  const timeframes: { label: string; value: TimeframeFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'This Week', value: 'week' },
    { label: 'Older', value: 'older' },
  ];

  const categories: { label: string; value: CategoryFilter }[] = [
    { label: 'All Categories', value: 'ALL' },
    { label: 'Bookings', value: 'BOOKING' },
    { label: 'Payments', value: 'PAYMENT' },
    { label: 'Approvals', value: 'APPROVAL' },
    { label: 'Maintenance', value: 'MAINTENANCE' },
    { label: 'Reviews', value: 'REVIEW' },
  ];

  return (
    <div className="space-y-3 pb-3 border-b border-slate-100">
      {/* Timeframe Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 py-1">
        {timeframes.map((tf) => (
          <button
            key={tf.value}
            type="button"
            onClick={() => onTimeframeChange(tf.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTimeframe === tf.value
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 py-0.5">
        {categories.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => onCategoryChange(cat.value)}
            className={`px-3 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
              activeCategory === cat.value
                ? 'bg-secondary-emerald/10 border-secondary-emerald text-secondary-emerald shadow-2xs'
                : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 bg-slate-50/50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
};
