import { NestMiddleware } from '@nestjs/common';
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
export declare class AdminIdentityMiddleware implements NestMiddleware {
    private adminSessionService;
    constructor(adminSessionService: AdminSessionService);
    use(req: Request, res: Response, next: NextFunction): Promise<void>;
    private extractToken;
}
