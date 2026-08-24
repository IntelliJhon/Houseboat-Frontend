import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { notificationService } from '../services/notificationService';
import type { NotificationItem, NotificationFilterOptions } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const SOCKET_URL = 'http://localhost:5000';

export function useNotifications(initialFilters: NotificationFilterOptions = {}) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<NotificationFilterOptions>(initialFilters);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await notificationService.getNotifications(filters);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, filters]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time Socket.IO Connection
  useEffect(() => {
    if (!user?.id) return;

    const socket: Socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('register-user', { userId: user.id, role: user.role });
    });

    socket.on('notification:new', (payload: { notification: NotificationItem; unreadCount: number }) => {
      toast((t) => (
        <div className="flex items-start gap-3" onClick={() => toast.dismiss(t.id)}>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-xs uppercase">
            {payload.notification.type}
          </div>
          <div>
            <div className="font-bold text-xs text-slate-900">{payload.notification.title}</div>
            <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{payload.notification.message}</div>
          </div>
        </div>
      ), { duration: 4000 });

      setNotifications((prev) => [payload.notification, ...prev]);
      setUnreadCount(payload.unreadCount);
    });

    return () => {
      socket.emit('leave-user', { userId: user.id, role: user.role });
      socket.disconnect();
    };
  }, [user?.id, user?.role]);

  const markAsRead = async (id: string) => {
    try {
      const updated = await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: updated.readAt } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    filters,
    setFilters,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
