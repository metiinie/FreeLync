"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminSessionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const crypto = __importStar(require("crypto"));
let AdminSessionService = class AdminSessionService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createSession(data) {
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
    async validateSession(token) {
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
        if (!session.is_active ||
            session.revoked ||
            session.expires_at < new Date() ||
            !session.user.is_active) {
            return null;
        }
        if (session.user.locked_until && session.user.locked_until > new Date()) {
            return null;
        }
        return session;
    }
    async updateActivity(sessionId) {
        await this.prisma.adminSession.update({
            where: { id: sessionId },
            data: {
                last_activity: new Date(),
            },
        });
    }
    async revokeSession(sessionId, reason) {
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
    async revokeAllUserSessions(userId, reason) {
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
    async getUserActiveSessions(userId) {
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
    async refreshSession(refreshToken) {
        const session = await this.prisma.adminSession.findUnique({
            where: { refresh_token: refreshToken },
            include: {
                user: true,
            },
        });
        if (!session || !session.is_active || session.revoked) {
            return null;
        }
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
    async cleanupExpiredSessions() {
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
    async getUserSessionStats(userId, days = 30) {
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
        const activeSessions = sessions.filter((s) => s.is_active && !s.revoked && s.expires_at > new Date());
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
    generateToken() {
        return crypto.randomBytes(32).toString('hex');
    }
};
exports.AdminSessionService = AdminSessionService;
exports.AdminSessionService = AdminSessionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminSessionService);
//# sourceMappingURL=admin-session.service.js.map