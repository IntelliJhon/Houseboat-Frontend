import React, { useState } from 'react';
import { CheckCheck, Bell } from 'lucide-react';
import { useNotifications } from '../../../hooks/useNotifications';
import { NotificationCard } from '../../../components/notifications/NotificationCard';
import { NotificationFilter } from '../../../components/notifications/NotificationFilter';
import type { TimeframeFilter, CategoryFilter } from '../../../components/notifications/NotificationFilter';
import { NotificationEmptyState } from '../../../components/notifications/NotificationEmptyState';

interface NotificationsSectionProps {
  role?: 'CUSTOMER' | 'HOST' | 'ADMIN';
}

export const NotificationsSection: React.FC<NotificationsSectionProps> = ({ role = 'HOST' }) => {
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('all');
  const [category, setCategory] = useState<CategoryFilter>('ALL');

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications({ role });

  // Filter list by selected timeframe and category
  const filteredNotifications = notifications.filter((n) => {
    if (category !== 'ALL' && n.type !== category) return false;

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

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-premium flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-emerald/10 text-secondary-emerald text-[11px] font-bold uppercase tracking-wider">
            <Bell className="w-3.5 h-3.5" /> Real-time Activity Logs
          </div>
          <h2 className="font-heading text-2xl font-extrabold text-primary-deep flex items-center gap-2">
            Notification Center <Bell className="w-5 h-5 text-indigo-600" />
          </h2>
          <p className="text-xs text-slate-500 font-sans">
            Centralized stream for booking updates, compliance alerts, payment transfers, and system notices.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
          >
            <CheckCheck className="w-4 h-4 text-emerald-400" /> Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-premium">
        <NotificationFilter
          activeTimeframe={timeframe}
          activeCategory={category}
          onTimeframeChange={setTimeframe}
          onCategoryChange={setCategory}
        />

        {/* Notifications Feed */}
        <div className="pt-6 space-y-3">
          {isLoading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-secondary-emerald border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-400">Loading notifications stream...</p>
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((n) => (
              <NotificationCard
                key={n.id}
                notification={n}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))
          ) : (
            <NotificationEmptyState
              title="No Notifications Found"
              message="No notifications match the selected category and timeframe filters."
            />
          )}
        </div>
      </div>
    </div>
  );
};
