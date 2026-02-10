import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminSession } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class AdminSessionService {
    constructor(private prisma: PrismaService) { }

    /**
     * Create a new admin session
     */
    async createSession(data: {
        userId: string;
        ipAddress: string;
        userAgent?: string;
        location?: any;
        expiresIn?: number; // seconds
    }): Promise<AdminSession> {
        const token = this.generateToken();
        const refreshToken = this.generateToken();
        const expiresAt = new Date(Date.now() + (data.expiresIn || 3600) * 1000);

        return this.prisma.adminSession.create({
            data: {
                user_id: data.userId,
                token,
                refresh_token: refreshToken,
                ip_address: data.ipAddress,
                user_agent: data.userAgent,
                location: data.location,
                expires_at: expiresAt,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        full_name: true,
                        role: true,
                        permissions: true,
                        permission_groups: true,
                    },
                },
            },
        });
    }

    /**
     * Validate a session token
     */
    async validateSession(token: string) {
        const session = await this.prisma.adminSession.findUnique({
            where: { token },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        full_name: true,
                        role: true,
                        permissions: true,
                        permission_groups: true,
                        is_active: true,
                        locked_until: true,
                    },
                },
            },
        });

        if (!session) {
            return null;
        }

        // Check if session is valid
        if (
            !session.is_active ||
            session.revoked ||
            session.expires_at < new Date() ||
            !session.user.is_active
        ) {
            return null;
        }

        // Check if user is locked
        if (session.user.locked_until && session.user.locked_until > new Date()) {
            return null;
        }

        return session;
    }

    /**
     * Update session activity timestamp
     */
    async updateActivity(sessionId: string): Promise<void> {
        await this.prisma.adminSession.update({
            where: { id: sessionId },
            data: {
                last_activity: new Date(),
            },
        });
    }

    /**
     * Revoke a session
     */
    async revokeSession(sessionId: string, reason?: string): Promise<void> {
        await this.prisma.adminSession.update({
            where: { id: sessionId },
            data: {
                is_active: false,
                revoked: true,
                revoked_at: new Date(),
                revoked_reason: reason,
            },
        });
    }

    /**
     * Revoke all sessions for a user
     */
    async revokeAllUserSessions(userId: string, reason?: string): Promise<number> {
        const result = await this.prisma.adminSession.updateMany({
            where: {
                user_id: userId,
                is_active: true,
                revoked: false,
            },
            data: {
                is_active: false,
                revoked: true,
                revoked_at: new Date(),
                revoked_reason: reason || 'All sessions revoked',
            },
        });

        return result.count;
    }

    /**
     * Get active sessions for a user
     */
    async getUserActiveSessions(userId: string): Promise<AdminSession[]> {
        return this.prisma.adminSession.findMany({
            where: {
                user_id: userId,
                is_active: true,
                revoked: false,
                expires_at: {
                    gt: new Date(),
                },
            },
            orderBy: {
                last_activity: 'desc',
            },
        });
    }

    /**
     * Refresh a session token
     */
    async refreshSession(refreshToken: string): Promise<AdminSession | null> {
        const session = await this.prisma.adminSession.findUnique({
            where: { refresh_token: refreshToken },
            include: {
                user: true,
            },
        });

        if (!session || !session.is_active || session.revoked) {
            return null;
        }

        // Generate new tokens
        const newToken = this.generateToken();
        const newRefreshToken = this.generateToken();
        const expiresAt = new Date(Date.now() + session.user.session_timeout * 1000);

        return this.prisma.adminSession.update({
            where: { id: session.id },
            data: {
                token: newToken,
                refresh_token: newRefreshToken,
                expires_at: expiresAt,
                last_activity: new Date(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        full_name: true,
                        role: true,
                        permissions: true,
                        permission_groups: true,
                    },
                },
            },
        });
    }

    /**
     * Clean up expired sessions
     */
    async cleanupExpiredSessions(): Promise<number> {
        const result = await this.prisma.adminSession.updateMany({
            where: {
                expires_at: {
                    lt: new Date(),
                },
                is_active: true,
            },
            data: {
                is_active: false,
            },
        });

        return result.count;
    }

    /**
     * Get session statistics for a user
     */
    async getUserSessionStats(userId: string, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const sessions = await this.prisma.adminSession.findMany({
            where: {
                user_id: userId,
                created_at: {
                    gte: startDate,
                },
            },
        });

        const activeSessions = sessions.filter(
            (s) => s.is_active && !s.revoked && s.expires_at > new Date(),
        );

        const ipAddresses = [...new Set(sessions.map((s) => s.ip_address))];

        return {
            totalSessions: sessions.length,
            activeSessions: activeSessions.length,
            revokedSessions: sessions.filter((s) => s.revoked).length,
            uniqueIpAddresses: ipAddresses.length,
            ipAddresses,
            lastActivity: sessions.length > 0 ? sessions[0].last_activity : null,
        };
    }

    /**
     * Generate a secure random token
     */
    private generateToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }
}
