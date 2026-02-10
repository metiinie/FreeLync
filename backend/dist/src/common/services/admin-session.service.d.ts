import { PrismaService } from '../../prisma/prisma.service';
import { AdminSession } from '@prisma/client';
export declare class AdminSessionService {
    private prisma;
    constructor(prisma: PrismaService);
    createSession(data: {
        userId: string;
        ipAddress: string;
        userAgent?: string;
        location?: any;
        expiresIn?: number;
    }): Promise<AdminSession>;
    validateSession(token: string): Promise<({
        user: {
            id: string;
            permissions: string[];
            email: string;
            full_name: string;
            role: import(".prisma/client").$Enums.UserRole;
            is_active: boolean;
            permission_groups: string[];
            locked_until: Date | null;
        };
    } & {
        id: string;
        created_at: Date;
        is_active: boolean;
        location: import("@prisma/client/runtime/library").JsonValue | null;
        expires_at: Date;
        user_id: string;
        token: string;
        refresh_token: string | null;
        ip_address: string;
        user_agent: string | null;
        last_activity: Date;
        revoked: boolean;
        revoked_at: Date | null;
        revoked_reason: string | null;
    }) | null>;
    updateActivity(sessionId: string): Promise<void>;
    revokeSession(sessionId: string, reason?: string): Promise<void>;
    revokeAllUserSessions(userId: string, reason?: string): Promise<number>;
    getUserActiveSessions(userId: string): Promise<AdminSession[]>;
    refreshSession(refreshToken: string): Promise<AdminSession | null>;
    cleanupExpiredSessions(): Promise<number>;
    getUserSessionStats(userId: string, days?: number): Promise<{
        totalSessions: number;
        activeSessions: number;
        revokedSessions: number;
        uniqueIpAddresses: number;
        ipAddresses: string[];
        lastActivity: Date | null;
    }>;
    private generateToken;
}
