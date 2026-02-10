import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AdminSessionService } from '../services/admin-session.service';
import { UserRole } from '@prisma/client';

export interface AdminContextType {
    userId: string;
    sessionId: string;
    role: UserRole;
    permissions: string[];
    permissionGroups: string[];
    ip: string;
    userAgent?: string;
}

declare global {
    namespace Express {
        interface Request {
            adminContext?: AdminContextType;
        }
    }
}

@Injectable()
export class AdminIdentityMiddleware implements NestMiddleware {
    constructor(private adminSessionService: AdminSessionService) { }

    async use(req: Request, res: Response, next: NextFunction) {
        const token = this.extractToken(req);

        if (!token) {
            return next();
        }

        try {
            const session = await this.adminSessionService.validateSession(token);

            if (session && session.is_active && !session.revoked) {
                // Attach admin identity to request
                req.adminContext = {
                    userId: session.user_id,
                    sessionId: session.id,
                    role: session.user.role,
                    permissions: session.user.permissions,
                    permissionGroups: session.user.permission_groups,
                    ip: req.ip || req.socket.remoteAddress || 'unknown',
                    userAgent: req.headers['user-agent'],
                };

                // Update last activity
                await this.adminSessionService.updateActivity(session.id);
            }
        } catch (error) {
            console.error('Admin identity validation failed:', error);
        }

        next();
    }

    private extractToken(req: Request): string | null {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        return null;
    }
}
