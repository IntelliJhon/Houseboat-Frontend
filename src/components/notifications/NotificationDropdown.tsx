import React from 'react';
import { CheckCheck, SlidersHorizontal, X } from 'lucide-react';
import type { NotificationItem } from '../../services/notificationService';
import { NotificationCard } from './NotificationCard';
import { NotificationEmptyState } from './NotificationEmptyState';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onOpenDrawer: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onOpenDrawer,
}) => {
  if (!isOpen) return null;

  const recent = notifications.slice(0, 5);

  return (
    <>
      {/* Backdrop overlay to dismiss popover when clicking outside */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Dropdown Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-sm font-bold">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-secondary-emerald text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                title="Mark all as read"
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications Stream */}
        <div className="p-3 overflow-y-auto space-y-2.5 flex-1 max-h-[400px]">
          {recent.length > 0 ? (
            recent.map((n) => (
              <NotificationCard
                key={n.id}
                notification={n}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDeleteNotification}
                onClickAction={onClose}
              />
            ))
          ) : (
            <NotificationEmptyState />
          )}
        </div>

        {/* Dropdown Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 shrink-0 text-center">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenDrawer();
            }}
            className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-secondary-emerald" /> View Full Notification Center
          </button>
        </div>
      </div>
    </>
  );
};
