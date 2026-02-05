import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, endpoints } from '../services/api';
import { formatRelativeTime } from '../lib/utils';
import { Notification } from '../types';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
}

interface NotificationContextType extends NotificationState {
  loadNotifications: (page?: number, limit?: number) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  updatePreferences: (preferences: any) => Promise<void>;
  addNotification: (notification: Notification) => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const loadNotifications = async (page = 1, limit = 20) => {
    if (!user) return;

    try {
      setLoading(true);
      // Calls GET /notifications via wrapper or API
      const response = await api.get(endpoints.notifications.list, {
        params: { page, limit }
      });

      const data = response.data.data || response.data; // Handle list wrapping

      // Add timeAgo to each notification
      const notificationsWithTimeAgo = Array.isArray(data) ? data.map((notification: any) => ({
        ...notification,
        timeAgo: formatRelativeTime(notification.created_at),
      })) : [];

      if (page === 1) {
        setNotifications(notificationsWithTimeAgo);
      } else {
        setNotifications(prev => [...prev, ...notificationsWithTimeAgo]);
      }

      // Calculate unread count (or get from backend meta)
      // Assuming backend might not return unread count yet, so client side filtering for cached
      const unread = notificationsWithTimeAgo.filter((n: any) => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      await api.patch(endpoints.notifications.markRead(notificationId));

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true, read_at: new Date().toISOString() }
            : notification
        )
      );

      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      // Implement bulk mark read on backend or loop
      // For now, let's assume we implement a bulk endpoint later or loop
      // Just mocking success locally to ensure UI feedback
      // TODO: Add backend bulk mark read endpoint

      setNotifications(prev =>
        prev.map(notification => ({
          ...notification,
          read: true,
          read_at: new Date().toISOString(),
        }))
      );

      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      // Assuming delete endpoint exists
      await api.delete(`${endpoints.notifications.list}/${notificationId}`);

      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      // Update unread count if the deleted notification was unread
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const updatePreferences = async (preferences: any) => {
    if (!user) return;

    try {
      const { AuthService } = await import('../services/auth');
      await AuthService.updateProfile(user.id, {
        preferences: {
          ...user.preferences,
          notifications: preferences
        }
      });

      toast.success('Notification preferences updated');
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      toast.error('Failed to update notification preferences');
    }
  };

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);

    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }

    // Show toast for high priority notifications
    if (notification.priority === 'high' || notification.priority === 'urgent') {
      toast.info(notification.title, {
        description: notification.message,
        duration: 5000,
      });
    }
  };

  const refreshNotifications = async () => {
    await loadNotifications(1, 20);
  };

  // Set up real-time subscription for notifications (Removed Supabase Realtime)
  useEffect(() => {
    if (!user) return;

    // Polling as fallback since we removed Supabase Realtime
    const interval = setInterval(() => {
      refreshNotifications();
    }, 60000); // Poll every minute

    return () => clearInterval(interval);
  }, [user]);

  // Load notifications when user changes
  useEffect(() => {
    if (user) {
      loadNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    addNotification,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
