"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let NotificationService = class NotificationService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(userId, filters) {
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
    async create(data, userId) {
        return this.prisma.notification.create({
            data: {
                ...data,
                user_id: userId,
            },
        });
    }
    async createFromTemplate(templateCode, userId, variables, options) {
        const template = await this.prisma.notificationTemplate.findUnique({
            where: { code: templateCode }
        });
        if (!template || !template.is_active) {
            console.warn(`Template ${templateCode} not found or inactive`);
            return null;
        }
        const preferences = await this.getUserPreferences(userId);
        const title = this.interpolate(template.title_template, variables);
        const message = this.interpolate(template.message_template, variables);
        const channels = this.determineChannels(template.category, template.default_channels, preferences, options?.channels);
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
    interpolate(template, variables) {
        return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
            const value = this.getNestedValue(variables, path);
            return value !== undefined ? String(value) : match;
        });
    }
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    determineChannels(category, defaultChannels, preferences, override) {
        if (override)
            return override;
        const categoryPrefs = preferences?.[category] || {};
        return {
            in_app: categoryPrefs.in_app ?? defaultChannels.in_app ?? true,
            email: categoryPrefs.email ?? defaultChannels.email ?? true,
            sms: categoryPrefs.sms ?? defaultChannels.sms ?? false,
            push: categoryPrefs.push ?? defaultChannels.push ?? false
        };
    }
    async getUserPreferences(userId) {
        const prefs = await this.prisma.notificationPreference.findUnique({
            where: { user_id: userId }
        });
        if (!prefs) {
            return this.prisma.notificationPreference.create({
                data: { user_id: userId }
            });
        }
        return prefs;
    }
    mapCategoryToType(category) {
        const mapping = {
            'transactional': 'transaction_update',
            'system': 'system_alert',
            'marketing': 'promotional'
        };
        return mapping[category] || 'general';
    }
    async markAsRead(id, userId) {
        return this.prisma.notification.update({
            where: { id, user_id: userId },
            data: { read: true, read_at: new Date() },
        });
    }
    async markAllAsRead(userId) {
        return this.prisma.notification.updateMany({
            where: { user_id: userId, read: false },
            data: { read: true, read_at: new Date() }
        });
    }
    async delete(id, userId) {
        return this.prisma.notification.delete({
            where: { id, user_id: userId }
        });
    }
    async getUnreadCount(userId) {
        return this.prisma.notification.count({
            where: { user_id: userId, read: false }
        });
    }
    async updateDeliveryStatus(notificationId, channel, status, details) {
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
        const updateData = {
            delivery_status: {
                [channel]: status
            }
        };
        if (status === 'sent') {
            updateData.sent_at = new Date();
        }
        else if (status === 'delivered') {
            updateData.delivered_at = new Date();
        }
        else if (status === 'failed' || status === 'bounced') {
            updateData.failed_at = new Date();
            updateData.failure_reason = details?.error_message;
        }
        return this.prisma.notification.update({
            where: { id: notificationId },
            data: updateData
        });
    }
    async getPreferences(userId) {
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
    async updatePreferences(userId, data) {
        return this.prisma.notificationPreference.upsert({
            where: { user_id: userId },
            create: { user_id: userId, ...data },
            update: data
        });
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationService);
//# sourceMappingURL=notifications.service.js.map