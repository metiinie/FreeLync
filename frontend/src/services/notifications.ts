import { api, endpoints } from './api';
import { Notification, CreateNotificationData } from '../types';

export class NotificationsService {
  // Get user notifications
  static async getUserNotifications(
    userId: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<{ success: boolean; data: Notification[]; total: number; message?: string }> {
    try {
      const response = await api.get(endpoints.notifications.list, { params: pagination });
      const data = response.data || [];
      const notificationsWithTimeAgo = data.map((notification: any) => ({
        ...notification,
        timeAgo: this.formatRelativeTime(notification.created_at),
      }));

      return {
        success: true,
        data: notificationsWithTimeAgo,
        total: data.length, // Total count ideally from response headers or wrapper
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        total: 0,
        message: error.message || 'Failed to fetch notifications',
      };
    }
  }

  // Get unread notifications count
  static async getUnreadCount(userId: string): Promise<{ success: boolean; count: number; message?: string }> {
    try {
      // Assuming backend supports filter count
      const response = await api.get(endpoints.notifications.list, { params: { read: false } });
      const count = (response.data || []).length;
      return { success: true, count };
    } catch (error: any) {
      return { success: false, count: 0, message: error.message };
    }
  }

  // Create a new notification
  static async createNotification(
    notificationData: CreateNotificationData
  ): Promise<{ success: boolean; data: Notification | null; message?: string }> {
    // Backend handles creation usually, but if client creates:
    try {
      const response = await api.post(endpoints.notifications.list, notificationData);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, data: null, message: error.message };
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<{ success: boolean; message?: string }> {
    try {
      await api.patch(endpoints.notifications.markRead(notificationId));
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to mark as read' };
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(userId: string): Promise<{ success: boolean; message?: string }> {
    // Needs backend endpoint
    return { success: false, message: 'Not implemented in this migration step' };
  }

  // Delete notification
  static async deleteNotification(notificationId: string): Promise<{ success: boolean; message?: string }> {
    try {
      await api.delete(`${endpoints.notifications.list}/${notificationId}`);
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // Delete all notifications for user
  static async deleteAllNotifications(userId: string): Promise<{ success: boolean; message?: string }> {
    // Needs backend endpoint
    return { success: false, message: 'Not implemented' };
  }

  // Stub helpers that really should be backend logic triggered by events
  static async createListingApprovalNotification(userId: string, listingTitle: string, listingId: string, approved: boolean) {
    return this.createNotification({
      user_id: userId,
      type: approved ? 'listing_approved' : 'listing_rejected',
      title: approved ? 'Listing Approved!' : 'Listing Rejected',
      message: approved ? `Listing "${listingTitle}" approved.` : `Listing "${listingTitle}" rejected.`,
      link: approved ? `/listing/${listingId}` : '/profile?tab=my-listings',
      priority: 'high',
      channels: { in_app: true } as any,
      expires_at: ''
    });
  }

  static async createPaymentReceivedNotification(sellerId: string, listingTitle: string, amount: number, currency: string, transactionId: string) {
    return this.createNotification({
      user_id: sellerId,
      type: 'payment_received',
      title: 'Payment Received!',
      message: `Payment of ${amount} ${currency} for "${listingTitle}" received.`,
      link: `/profile?tab=my-transactions&transaction=${transactionId}`,
      priority: 'high',
      channels: { in_app: true } as any,
      expires_at: ''
    });
  }

  static async createEscrowReleaseNotification(sellerId: string, listingTitle: string, amount: number, currency: string, transactionId: string) {
    return this.createNotification({
      user_id: sellerId,
      type: 'escrow_released',
      title: 'Funds Released!',
      message: `Funds for "${listingTitle}" released.`,
      link: `/profile?tab=my-transactions&transaction=${transactionId}`,
      priority: 'high',
      channels: { in_app: true } as any,
      expires_at: ''
    });
  }

  static async createUserVerificationNotification(userId: string, verified: boolean) {
    return this.createNotification({
      user_id: userId,
      type: 'user_verified',
      title: verified ? 'Account Verified!' : 'Verification Required',
      message: verified ? 'Account verified.' : 'Verification pending.',
      link: '/profile',
      priority: verified ? 'high' : 'medium',
      channels: { in_app: true } as any,
      expires_at: ''
    });
  }

  static async createSystemNotification(userId: string, title: string, message: string, priority: any = 'medium', link?: string) {
    return this.createNotification({
      user_id: userId,
      type: 'system_message',
      title,
      message,
      link,
      priority,
      channels: { in_app: true } as any,
      expires_at: ''
    });
  }

  static async createAdminNotification(title: string, message: string, priority: any = 'medium', link?: string) {
    // Requires backend logic to broadcast
    return { success: false, data: [] as Notification[], message: 'Backend broadcast needed' };
  }

  static async getNotificationStats(userId: string) {
    // Needs backend stats endpoint
    return { success: false, data: null, message: 'Stats not implemented' };
  }

  // Format relative time
  private static formatRelativeTime(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return time.toLocaleDateString();
    }
  }
}
