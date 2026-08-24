import React, { useState } from 'react';
import { Sparkles, CheckCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../../../hooks/useNotifications';
import { NotificationCard } from '../../../components/notifications/NotificationCard';
import { NotificationFilter } from '../../../components/notifications/NotificationFilter';
import type { TimeframeFilter, CategoryFilter } from '../../../components/notifications/NotificationFilter';
import { NotificationEmptyState } from '../../../components/notifications/NotificationEmptyState';

export const AdminNotificationsSection: React.FC = () => {
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('all');
  const [category, setCategory] = useState<CategoryFilter>('ALL');

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications({ role: 'ADMIN' });

  // Critical alerts counter
  const criticalCount = notifications.filter((n) => n.priority === 'CRITICAL' && !n.isRead).length;

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
      {/* Admin Section Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" /> Platform Control Center
          </div>
          <h2 className="font-heading text-2xl font-extrabold flex items-center gap-2">
            Admin Notification Stream <Sparkles className="w-5 h-5 text-accent-gold" />
          </h2>
          <p className="text-xs text-slate-400 font-sans">
            Real-time feed monitoring host approvals, vessel compliance submissions, booking transactions, and system alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {criticalCount > 0 && (
            <div className="px-3 py-2 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-2xl text-xs font-bold flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-rose-400" /> {criticalCount} Critical Alert{criticalCount > 1 ? 's' : ''}
            </div>
          )}

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="px-4 py-2.5 bg-secondary-emerald hover:bg-secondary-emerald/90 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
            >
              <CheckCheck className="w-4 h-4" /> Mark All Read ({unreadCount})
            </button>
          )}
        </div>
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
              <p className="text-xs font-semibold text-slate-400">Loading admin notification stream...</p>
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
              title="No Admin Alerts"
              message="No system notifications match the selected category or timeframe filters."
            />
          )}
        </div>
      </div>
    </div>
  );
};
