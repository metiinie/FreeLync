import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuditService } from '../services/audit.service';
import { Reflector } from '@nestjs/core';
import { RiskLevel } from '@prisma/client';
export interface AuditMetadata {
    action: string;
    resourceType: string;
    riskLevel?: RiskLevel;
    captureBeforeState?: boolean;
    captureAfterState?: boolean;
    resourceIdExtractor?: (req: any, res: any) => string;
}
export declare class AuditInterceptor implements NestInterceptor {
    private auditService;
    private reflector;
    constructor(auditService: AuditService, reflector: Reflector);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private captureBeforeState;
    private captureAfterState;
    private calculateChanges;
    private extractResourceId;
    private generateRequestId;
}
