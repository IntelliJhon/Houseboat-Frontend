import React, { useState, useMemo } from 'react';
import { X, CheckCheck, Search, Sparkles } from 'lucide-react';
import type { NotificationItem } from '../../services/notificationService';
import { NotificationCard } from './NotificationCard';
import { NotificationFilter } from './NotificationFilter';
import type { TimeframeFilter, CategoryFilter } from './NotificationFilter';
import { NotificationEmptyState } from './NotificationEmptyState';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('all');
  const [category, setCategory] = useState<CategoryFilter>('ALL');

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = n.title.toLowerCase().includes(query);
        const matchesMsg = n.message.toLowerCase().includes(query);
        if (!matchesTitle && !matchesMsg) return false;
      }

      // Category filter
      if (category !== 'ALL' && n.type !== category) {
        return false;
      }

      // Timeframe filter
      if (timeframe !== 'all') {
        const date = new Date(n.createdAt);
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - 7);

        if (timeframe === 'today' && date < startOfToday) return false;
        if (timeframe === 'yesterday' && (date < startOfYesterday || date >= startOfToday)) return false;
        if (timeframe === 'week' && date < startOfWeek) return false;
        if (timeframe === 'older' && date >= startOfWeek) return false;
      }

      return true;
    });
  }, [notifications, searchQuery, timeframe, category]);

  // Group by Today, Yesterday, This Week, Older
  const groupedNotifications = useMemo(() => {
    const today: NotificationItem[] = [];
    const yesterday: NotificationItem[] = [];
    const thisWeek: NotificationItem[] = [];
    const older: NotificationItem[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    filteredNotifications.forEach((n) => {
      const date = new Date(n.createdAt);
      if (date >= startOfToday) {
        today.push(n);
      } else if (date >= startOfYesterday) {
        yesterday.push(n);
      } else if (date >= startOfWeek) {
        thisWeek.push(n);
      } else {
        older.push(n);
      }
    });

    return [
      { title: 'Today', items: today },
      { title: 'Yesterday', items: yesterday },
      { title: 'This Week', items: thisWeek },
      { title: 'Older', items: older },
    ].filter((g) => g.items.length > 0);
  }, [filteredNotifications]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Blurred Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-in Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-100 flex flex-col transform transition-transform duration-300 ease-in-out">
          
          {/* Header */}
          <div className="bg-primary-deep text-white px-6 py-5 shrink-0 flex items-center justify-between">
            <div>
              <h3 className="font-heading text-lg font-bold flex items-center gap-2">
                Notification Center <Sparkles className="w-4 h-4 text-accent-gold" />
              </h3>
              <p className="text-[11px] text-white/70 font-semibold uppercase tracking-wider mt-0.5">
                {unreadCount > 0 ? `${unreadCount} Unread Notifications` : 'All caught up'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Controls Bar: Search & Mark All Read */}
          <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-3 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notifications..."
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary-emerald/20 focus:border-secondary-emerald"
                />
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllAsRead}
                  className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-secondary-emerald" /> Mark Read
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <NotificationFilter
              activeTimeframe={timeframe}
              activeCategory={category}
              onTimeframeChange={setTimeframe}
              onCategoryChange={setCategory}
            />
          </div>

          {/* Grouped Notifications List Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {groupedNotifications.length > 0 ? (
              groupedNotifications.map((group) => (
                <div key={group.title} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {group.title}
                    </span>
                    <hr className="flex-1 border-slate-100" />
                  </div>
                  <div className="space-y-2.5">
                    {group.items.map((n) => (
                      <NotificationCard
                        key={n.id}
                        notification={n}
                        onMarkAsRead={onMarkAsRead}
                        onDelete={onDeleteNotification}
                        onClickAction={onClose}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <NotificationEmptyState
                title="No Matching Notifications"
                message="Try adjusting your filter tabs or search query."
              />
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
