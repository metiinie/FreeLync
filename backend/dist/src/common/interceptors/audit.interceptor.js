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
exports.AuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const audit_service_1 = require("../services/audit.service");
const core_1 = require("@nestjs/core");
let AuditInterceptor = class AuditInterceptor {
    auditService;
    reflector;
    constructor(auditService, reflector) {
        this.auditService = auditService;
        this.reflector = reflector;
    }
    intercept(context, next) {
        const auditMetadata = this.reflector.get('audit', context.getHandler());
        if (!auditMetadata) {
            return next.handle();
        }
        const request = context.switchToHttp().getRequest();
        const adminContext = request.adminContext;
        if (!adminContext) {
            return next.handle();
        }
        const startTime = Date.now();
        const requestId = this.generateRequestId();
        let beforeState = null;
        if (auditMetadata.captureBeforeState) {
            beforeState = this.captureBeforeState(request, auditMetadata);
        }
        return next.handle().pipe((0, operators_1.tap)(async (response) => {
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
        }), (0, operators_1.catchError)(async (error) => {
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
            return (0, rxjs_1.throwError)(() => error);
        }));
    }
    captureBeforeState(request, metadata) {
        return {
            params: request.params,
            body: request.body,
            timestamp: new Date().toISOString(),
        };
    }
    captureAfterState(response, metadata) {
        return response;
    }
    calculateChanges(before, after) {
        if (!before || !after) {
            return null;
        }
        const changes = {};
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
    extractResourceId(request, response, metadata) {
        if (metadata.resourceIdExtractor) {
            return metadata.resourceIdExtractor(request, response);
        }
        return (request.params?.id ||
            request.params?.listingId ||
            request.params?.userId ||
            request.params?.transactionId ||
            response?.id ||
            response?.data?.id ||
            'unknown');
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
};
exports.AuditInterceptor = AuditInterceptor;
exports.AuditInterceptor = AuditInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_service_1.AuditService,
        core_1.Reflector])
], AuditInterceptor);
//# sourceMappingURL=audit.interceptor.js.map