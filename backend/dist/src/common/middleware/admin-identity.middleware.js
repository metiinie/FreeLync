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
exports.AdminIdentityMiddleware = void 0;
const common_1 = require("@nestjs/common");
const admin_session_service_1 = require("../services/admin-session.service");
let AdminIdentityMiddleware = class AdminIdentityMiddleware {
    adminSessionService;
    constructor(adminSessionService) {
        this.adminSessionService = adminSessionService;
    }
    async use(req, res, next) {
        const token = this.extractToken(req);
        if (!token) {
            return next();
        }
        try {
            const session = await this.adminSessionService.validateSession(token);
            if (session && session.is_active && !session.revoked) {
                req.adminContext = {
                    userId: session.user_id,
                    sessionId: session.id,
                    role: session.user.role,
                    permissions: session.user.permissions,
                    permissionGroups: session.user.permission_groups,
                    ip: req.ip || req.socket.remoteAddress || 'unknown',
                    userAgent: req.headers['user-agent'],
                };
                await this.adminSessionService.updateActivity(session.id);
            }
        }
        catch (error) {
            console.error('Admin identity validation failed:', error);
        }
        next();
    }
    extractToken(req) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        return null;
    }
};
exports.AdminIdentityMiddleware = AdminIdentityMiddleware;
exports.AdminIdentityMiddleware = AdminIdentityMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [admin_session_service_1.AdminSessionService])
], AdminIdentityMiddleware);
//# sourceMappingURL=admin-identity.middleware.js.map