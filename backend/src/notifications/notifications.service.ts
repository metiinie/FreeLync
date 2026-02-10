import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationPriority } from '@prisma/client';

@Injectable()
export class NotificationService {
    constructor(private prisma: PrismaService) { }

    /**
     * Find all notifications for a user
     */
    async findAll(userId: string, filters?: { read?: boolean; limit?: number }) {
        return this.prisma.notification.findMany({
            where: {
                user_id: userId,
                read: filters?.read
            },
            orderBy: { created_at: 'desc' },
            take: filters?.limit || 50,
            include: {
                template: true
            }
        });
    }

    /**
     * Create a notification manually
     */
    async create(data: any, userId: string) {
        return this.prisma.notification.create({
            data: {
                ...data,
                user_id: userId,
            },
        });
    }

    /**
     * Create notification from template with variable interpolation
     */
    async createFromTemplate(
        templateCode: string,
        userId: string,
        variables: Record<string, any>,
        options?: {
            priority?: NotificationPriority;
            channels?: any;
            scheduled_for?: Date;
            triggered_by_id?: string;
            event_type?: string;
            event_id?: string;
        }
    ) {
        // Find template
        const template = await this.prisma.notificationTemplate.findUnique({
            where: { code: templateCode }
        });

        if (!template || !template.is_active) {
            console.warn(`Template ${templateCode} not found or inactive`);
            return null;
        }

        // Get user preferences
        const preferences = await this.getUserPreferences(userId);

        // Interpolate variables
        const title = this.interpolate(template.title_template, variables);
        const message = this.interpolate(template.message_template, variables);

        // Determine channels based on preferences and template
        const channels = this.determineChannels(
            template.category,
            template.default_channels as any,
            preferences,
            options?.channels
        );

        // Create notification
        return this.prisma.notification.create({
            data: {
                user_id: userId,
                template_id: template.id,
                type: this.mapCategoryToType(template.category),
                title,
                message,
                variables,
                priority: options?.priority || template.default_priority,
                channels,
                event_type: options?.event_type,
                event_id: options?.event_id,
                triggered_by_id: options?.triggered_by_id,
                scheduled_for: options?.scheduled_for,
                status: options?.scheduled_for ? 'scheduled' : 'pending'
            }
        });
    }

    /**
     * Interpolate template variables
     */
    private interpolate(template: string, variables: Record<string, any>): string {
        return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
            const value = this.getNestedValue(variables, path);
            return value !== undefined ? String(value) : match;
        });
    }

    /**
     * Get nested value from object using dot notation
     */
    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Determine which channels to use based on preferences
     */
    private determineChannels(
        category: string,
        defaultChannels: any,
        preferences: any,
        override?: any
    ): any {
        if (override) return override;

        const categoryPrefs = preferences?.[category] || {};

        return {
            in_app: categoryPrefs.in_app ?? defaultChannels.in_app ?? true,
            email: categoryPrefs.email ?? defaultChannels.email ?? true,
            sms: categoryPrefs.sms ?? defaultChannels.sms ?? false,
            push: categoryPrefs.push ?? defaultChannels.push ?? false
        };
    }

    /**
     * Get user notification preferences
     */
    private async getUserPreferences(userId: string) {
        const prefs = await this.prisma.notificationPreference.findUnique({
            where: { user_id: userId }
        });

        if (!prefs) {
            // Create default preferences
            return this.prisma.notificationPreference.create({
                data: { user_id: userId }
            });
        }

        return prefs;
    }

    /**
     * Map category to notification type
     */
    private mapCategoryToType(category: string): any {
        const mapping: Record<string, any> = {
            'transactional': 'transaction_update',
            'system': 'system_alert',
            'marketing': 'promotional'
        };
        return mapping[category] || 'general';
    }

    /**
     * Mark notification as read
     */
    async markAsRead(id: string, userId: string) {
        return this.prisma.notification.update({
            where: { id, user_id: userId },
            data: { read: true, read_at: new Date() },
        });
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { user_id: userId, read: false },
            data: { read: true, read_at: new Date() }
        });
    }

    /**
     * Delete notification
     */
    async delete(id: string, userId: string) {
        return this.prisma.notification.delete({
            where: { id, user_id: userId }
        });
    }

    /**
     * Get unread count
     */
    async getUnreadCount(userId: string): Promise<number> {
        return this.prisma.notification.count({
            where: { user_id: userId, read: false }
        });
    }

    /**
     * Update delivery status
     */
    async updateDeliveryStatus(
        notificationId: string,
        channel: string,
        status: string,
        details?: {
            provider?: string;
            provider_id?: string;
            error_code?: string;
            error_message?: string;
        }
    ) {
        // Create log entry
        await this.prisma.notificationLog.create({
            data: {
                notification_id: notificationId,
                channel,
                status,
                provider: details?.provider,
                provider_id: details?.provider_id,
                error_code: details?.error_code,
                error_message: details?.error_message,
                completed_at: ['delivered', 'failed', 'bounced'].includes(status) ? new Date() : null
            }
        });

        // Update notification status
        const updateData: any = {
            delivery_status: {
                [channel]: status
            }
        };

        if (status === 'sent') {
            updateData.sent_at = new Date();
        } else if (status === 'delivered') {
            updateData.delivered_at = new Date();
        } else if (status === 'failed' || status === 'bounced') {
            updateData.failed_at = new Date();
            updateData.failure_reason = details?.error_message;
        }

        return this.prisma.notification.update({
            where: { id: notificationId },
            data: updateData
        });
    }

    /**
     * Get user preferences
     */
    async getPreferences(userId: string) {
        let prefs = await this.prisma.notificationPreference.findUnique({
            where: { user_id: userId }
        });

        if (!prefs) {
            prefs = await this.prisma.notificationPreference.create({
                data: { user_id: userId }
            });
        }

        return prefs;
    }

    /**
     * Update user preferences
     */
    async updatePreferences(userId: string, data: any) {
        return this.prisma.notificationPreference.upsert({
            where: { user_id: userId },
            create: { user_id: userId, ...data },
            update: data
        });
    }
}
