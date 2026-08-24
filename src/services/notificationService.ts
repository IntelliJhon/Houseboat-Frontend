import api from './api';

export interface NotificationItem {
  id: string;
  userId: string;
  role: 'CUSTOMER' | 'HOST' | 'ADMIN';
  type: 'BOOKING' | 'PAYMENT' | 'HOUSEBOAT' | 'APPROVAL' | 'SYSTEM' | 'REVIEW' | 'MAINTENANCE' | 'MESSAGE' | 'CALENDAR';
  title: string;
  message: string;
  referenceType: string | null;
  referenceId: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isRead: boolean;
  readAt: string | null;
  actionUrl: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationFilterOptions {
  role?: 'CUSTOMER' | 'HOST' | 'ADMIN';
  type?: string;
  category?: string;
  priority?: string;
  isRead?: boolean;
  timeframe?: 'today' | 'yesterday' | 'week' | 'older';
  page?: number;
  limit?: number;
}

export interface GetNotificationsResponse {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
}

export const notificationService = {
  async getNotifications(options: NotificationFilterOptions = {}): Promise<GetNotificationsResponse> {
    const response = await api.get('/v1/notifications', { params: options });
    return response.data?.data;
  },

  async getUnreadNotifications(): Promise<NotificationItem[]> {
    const response = await api.get('/v1/notifications/unread');
    return response.data?.data?.notifications || [];
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get('/v1/notifications/count');
    return response.data?.data?.count || 0;
  },

  async markAsRead(id: string): Promise<NotificationItem> {
    const response = await api.patch(`/v1/notifications/${id}/read`);
    return response.data?.data?.notification;
  },

  async markAllAsRead(): Promise<number> {
    const response = await api.patch('/v1/notifications/read-all');
    return response.data?.data?.count || 0;
  },

  async deleteNotification(id: string): Promise<boolean> {
    const response = await api.delete(`/v1/notifications/${id}`);
    return response.data?.success || false;
  },
};
