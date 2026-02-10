import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
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

@Injectable()
export class AuditInterceptor implements NestInterceptor {
    constructor(
        private auditService: AuditService,
        private reflector: Reflector,
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const auditMetadata = this.reflector.get<AuditMetadata>(
            'audit',
            context.getHandler(),
        );

        if (!auditMetadata) {
            return next.handle();
        }

        const request = context.switchToHttp().getRequest();
        const adminContext = request.adminContext;

        if (!adminContext) {
            // No admin context, skip auditing
            return next.handle();
        }

        const startTime = Date.now();
        const requestId = this.generateRequestId();

        // Capture before state if needed
        let beforeState: any = null;
        if (auditMetadata.captureBeforeState) {
            beforeState = this.captureBeforeState(request, auditMetadata);
        }

        return next.handle().pipe(
            tap(async (response) => {
                // Success - log the action
                const afterState = auditMetadata.captureAfterState
                    ? this.captureAfterState(response, auditMetadata)
                    : null;

                const changes = this.calculateChanges(beforeState, afterState);

                await this.auditService.log({
                    performedBy: adminContext,
                    action: auditMetadata.action,
                    resourceType: auditMetadata.resourceType,
                    resourceId: this.extractResourceId(request, response, auditMetadata),
                    reason: request.body?.reason || request.query?.reason,
                    beforeState,
                    afterState,
                    changes,
                    riskLevel: auditMetadata.riskLevel || 'medium',
                    status: 'success',
                    requestId,
                    metadata: {
                        duration: Date.now() - startTime,
                        endpoint: request.url,
                        method: request.method,
                        params: request.params,
                        query: request.query,
                    },
                });
            }),
            catchError(async (error) => {
                // Failure - log the failed attempt
                await this.auditService.log({
                    performedBy: adminContext,
                    action: auditMetadata.action,
                    resourceType: auditMetadata.resourceType,
                    resourceId: this.extractResourceId(request, null, auditMetadata),
                    reason: request.body?.reason || request.query?.reason,
                    beforeState,
                    status: 'failure',
                    errorMessage: error.message,
                    riskLevel: auditMetadata.riskLevel || 'medium',
                    requestId,
                    metadata: {
                        duration: Date.now() - startTime,
                        endpoint: request.url,
                        method: request.method,
                        params: request.params,
                        query: request.query,
                        errorStack: error.stack,
                    },
                });

                return throwError(() => error);
            }),
        );
    }

    private captureBeforeState(request: any, metadata: AuditMetadata): any {
        // This would typically fetch the current state of the resource
        // Implementation depends on the resource type
        return {
            params: request.params,
            body: request.body,
            timestamp: new Date().toISOString(),
        };
    }

    private captureAfterState(response: any, metadata: AuditMetadata): any {
        // Capture the response data
        return response;
    }

    private calculateChanges(before: any, after: any): any {
        if (!before || !after) {
            return null;
        }

        // Simple diff calculation
        // In production, use a proper diff library like 'deep-diff'
        const changes: any = {};

        if (typeof after === 'object' && typeof before === 'object') {
            Object.keys(after).forEach((key) => {
                if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
                    changes[key] = {
                        before: before[key],
                        after: after[key],
                    };
                }
            });
        }

        return Object.keys(changes).length > 0 ? changes : null;
    }

    private extractResourceId(
        request: any,
        response: any,
        metadata: AuditMetadata,
    ): string {
        // Use custom extractor if provided
        if (metadata.resourceIdExtractor) {
            return metadata.resourceIdExtractor(request, response);
        }

        // Default extraction logic
        return (
            request.params?.id ||
            request.params?.listingId ||
            request.params?.userId ||
            request.params?.transactionId ||
            response?.id ||
            response?.data?.id ||
            'unknown'
        );
    }

    private generateRequestId(): string {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
