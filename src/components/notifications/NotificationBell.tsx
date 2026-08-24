import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationBadge } from './NotificationBadge';
import { NotificationDropdown } from './NotificationDropdown';
import { NotificationDrawer } from './NotificationDrawer';

interface NotificationBellProps {
  role?: 'CUSTOMER' | 'HOST' | 'ADMIN';
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ role, className = '' }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications({ role });

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        aria-label="Open notifications"
        className="relative p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200/80 shadow-xs bg-white"
      >
        <Bell className="w-4 h-4" />
        <NotificationBadge
          count={unreadCount}
          className="absolute -top-1 -right-1"
        />
      </button>

      {/* Popover Dropdown */}
      <NotificationDropdown
        isOpen={isDropdownOpen}
        onClose={() => setIsDropdownOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDeleteNotification={deleteNotification}
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />

      {/* Full Center Drawer */}
      <NotificationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDeleteNotification={deleteNotification}
      />
    </div>
  );
};
