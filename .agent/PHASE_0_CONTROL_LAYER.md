# Phase 0: Control Layer - Architecture & Implementation Plan

## Executive Summary

The Control Layer is the foundational security and accountability infrastructure for FreeLync. It ensures every critical action is traceable, authorized, and auditable for compliance, dispute resolution, and security investigations.

---

## 🎯 Core Objectives

1. **Eliminate hardcoded admin identities** - Proper admin authentication and identity management
2. **Implement role-based access control (RBAC)** - Granular permissions for different admin roles
3. **Centralized audit logging** - Every critical action recorded with full context
4. **Action metadata capture** - Who, what, when, why, and before/after state
5. **Compliance-ready** - Support for regulatory audits and legal disputes
6. **Security investigation support** - Forensic-grade audit trails

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  (Controllers, Services, Business Logic)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Control Layer (Phase 0)                    │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Identity   │  │     RBAC     │  │    Audit     │      │
│  │  Management  │  │   Engine     │  │   Logger     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Permission  │  │   Action     │  │   Change     │      │
│  │   Guards     │  │  Metadata    │  │   Tracker    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  (Prisma, PostgreSQL, Audit Database)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Models

### 1. Enhanced User Model (Admin Identity)

```prisma
enum UserRole {
  buyer
  seller
  admin              // Basic admin
  super_admin        // Full platform control
  finance_admin      // Financial operations only
  support_admin      // User support only
  compliance_admin   // Audit and compliance only
}

model User {
  // ... existing fields ...
  
  // Admin-specific fields
  admin_metadata      Json?      // Admin-specific data
  permissions         String[]   @default([]) // Explicit permissions
  permission_groups   String[]   @default([]) // Permission group memberships
  last_password_change DateTime?
  mfa_enabled         Boolean    @default(false)
  mfa_secret          String?
  session_timeout     Int        @default(3600) // seconds
  
  // Audit trail
  performed_actions   AuditLog[] @relation("PerformedBy")
  affected_actions    AuditLog[] @relation("AffectedUser")
  
  // Security
  failed_login_attempts Int      @default(0)
  locked_until        DateTime?
  ip_whitelist        String[]   @default([])
}
```

### 2. Permission System

```prisma
model Permission {
  id          String   @id @default(uuid())
  name        String   @unique // e.g., "listings.approve", "users.verify"
  resource    String   // e.g., "listings", "users", "transactions"
  action      String   // e.g., "create", "read", "update", "delete", "approve"
  description String
  category    String   // e.g., "listing_management", "user_management"
  risk_level  RiskLevel @default(medium)
  
  groups      PermissionGroup[]
  
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  
  @@unique([resource, action])
  @@map("permissions")
}

enum RiskLevel {
  low
  medium
  high
  critical
}

model PermissionGroup {
  id          String   @id @default(uuid())
  name        String   @unique // e.g., "listing_manager", "finance_team"
  description String
  permissions Permission[]
  
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  
  @@map("permission_groups")
}
```

### 3. Audit Log System

```prisma
model AuditLog {
  id              String   @id @default(uuid())
  
  // Who performed the action
  performed_by_id String
  performed_by    User     @relation("PerformedBy", fields: [performed_by_id], references: [id])
  performed_by_role UserRole
  performed_by_ip String
  performed_by_user_agent String?
  
  // What action was performed
  action          String   // e.g., "listing.approve", "user.verify", "escrow.release"
  resource_type   String   // e.g., "Listing", "User", "Transaction"
  resource_id     String   // ID of the affected resource
  
  // Why it was performed
  reason          String?  // Admin-provided reason
  justification   String?  // Business justification
  
  // What changed
  before_state    Json?    // State before action
  after_state     Json?    // State after action
  changes         Json?    // Detailed diff of changes
  
  // Context
  request_id      String?  // For correlating related actions
  session_id      String?  // Admin session ID
  metadata        Json     @default("{}")
  
  // Risk assessment
  risk_level      RiskLevel
  requires_approval Boolean @default(false)
  approved_by_id  String?
  approved_by     User?    @relation("AffectedUser", fields: [approved_by_id], references: [id])
  approved_at     DateTime?
  
  // Status
  status          AuditStatus @default(success)
  error_message   String?
  
  // Compliance
  retention_until DateTime? // For GDPR/compliance
  archived        Boolean   @default(false)
  
  created_at      DateTime  @default(now())
  
  @@index([performed_by_id, created_at])
  @@index([resource_type, resource_id])
  @@index([action, created_at])
  @@index([risk_level, created_at])
  @@map("audit_logs")
}

enum AuditStatus {
  success
  failure
  pending
  rolled_back
}
```

### 4. Admin Session Management

```prisma
model AdminSession {
  id              String   @id @default(uuid())
  user_id         String
  user            User     @relation(fields: [user_id], references: [id])
  
  token           String   @unique
  refresh_token   String?  @unique
  
  ip_address      String
  user_agent      String?
  location        Json?    // Geolocation data
  
  expires_at      DateTime
  last_activity   DateTime @default(now())
  
  is_active       Boolean  @default(true)
  revoked         Boolean  @default(false)
  revoked_at      DateTime?
  revoked_reason  String?
  
  created_at      DateTime @default(now())
  
  @@index([user_id, is_active])
  @@index([token])
  @@map("admin_sessions")
}
```

### 5. Action Approval Workflow

```prisma
model ActionApproval {
  id              String   @id @default(uuid())
  
  // Action details
  action_type     String
  resource_type   String
  resource_id     String
  action_data     Json
  
  // Requester
  requested_by_id String
  requested_by    User     @relation("RequestedActions", fields: [requested_by_id], references: [id])
  request_reason  String
  
  // Approver
  approved_by_id  String?
  approved_by     User?    @relation("ApprovedActions", fields: [approved_by_id], references: [id])
  approval_reason String?
  
  // Status
  status          ApprovalStatus @default(pending)
  expires_at      DateTime
  
  // Audit
  audit_log_id    String?  @unique
  
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  @@index([status, created_at])
  @@map("action_approvals")
}

enum ApprovalStatus {
  pending
  approved
  rejected
  expired
  cancelled
}
```

---

## 🔐 Permission System Design

### Permission Naming Convention

```
<resource>.<action>[.<scope>]

Examples:
- listings.approve
- listings.reject
- listings.delete.any (delete any listing)
- listings.delete.own (delete own listings only)
- users.verify
- users.suspend
- transactions.escrow.release
- transactions.refund
- audit.view
- audit.export
- settings.commission.update
```

### Default Permission Groups

```typescript
const PERMISSION_GROUPS = {
  SUPER_ADMIN: [
    '*.*', // All permissions
  ],
  
  LISTING_MANAGER: [
    'listings.view',
    'listings.approve',
    'listings.reject',
    'listings.update',
    'listings.delete',
    'listings.feature',
  ],
  
  USER_MANAGER: [
    'users.view',
    'users.verify',
    'users.suspend',
    'users.update',
    'users.export',
  ],
  
  FINANCE_ADMIN: [
    'transactions.view',
    'transactions.escrow.release',
    'transactions.refund',
    'transactions.export',
    'commissions.view',
    'commissions.export',
  ],
  
  SUPPORT_ADMIN: [
    'users.view',
    'listings.view',
    'inquiries.view',
    'inquiries.respond',
    'notifications.send',
  ],
  
  COMPLIANCE_ADMIN: [
    'audit.view',
    'audit.export',
    'users.view',
    'transactions.view',
    'reports.generate',
  ],
};
```

---

## 🛡️ Middleware & Guards

### 1. Admin Identity Middleware

```typescript
// src/common/middleware/admin-identity.middleware.ts

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AdminSessionService } from '../services/admin-session.service';

@Injectable()
export class AdminIdentityMiddleware implements NestMiddleware {
  constructor(private adminSessionService: AdminSessionService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = this.extractToken(req);
    
    if (!token) {
      return next();
    }

    try {
      const session = await this.adminSessionService.validateSession(token);
      
      if (session && session.is_active && !session.revoked) {
        // Attach admin identity to request
        req['adminContext'] = {
          userId: session.user_id,
          sessionId: session.id,
          role: session.user.role,
          permissions: session.user.permissions,
          permissionGroups: session.user.permission_groups,
          ip: req.ip,
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
```

### 2. Permission Guard

```typescript
// src/common/guards/permission.guard.ts

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from '../services/permission.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const adminContext = request.adminContext;

    if (!adminContext) {
      return false;
    }

    // Check if user has required permissions
    return this.permissionService.hasPermissions(
      adminContext.userId,
      requiredPermissions,
    );
  }
}
```

### 3. Audit Interceptor

```typescript
// src/common/interceptors/audit.interceptor.ts

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

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private auditService: AuditService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditMetadata = this.reflector.get('audit', context.getHandler());
    
    if (!auditMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const adminContext = request.adminContext;
    const startTime = Date.now();

    // Capture before state if needed
    const beforeState = this.captureBeforeState(request, auditMetadata);

    return next.handle().pipe(
      tap(async (response) => {
        // Success - log the action
        await this.auditService.log({
          performedBy: adminContext,
          action: auditMetadata.action,
          resourceType: auditMetadata.resourceType,
          resourceId: this.extractResourceId(request, response, auditMetadata),
          reason: request.body?.reason || request.query?.reason,
          beforeState,
          afterState: this.captureAfterState(response, auditMetadata),
          changes: this.calculateChanges(beforeState, response),
          riskLevel: auditMetadata.riskLevel || 'medium',
          status: 'success',
          metadata: {
            duration: Date.now() - startTime,
            endpoint: request.url,
            method: request.method,
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
          metadata: {
            duration: Date.now() - startTime,
            endpoint: request.url,
            method: request.method,
            errorStack: error.stack,
          },
        });
        
        return throwError(() => error);
      }),
    );
  }

  private captureBeforeState(request: any, metadata: any): any {
    // Implementation depends on resource type
    return null;
  }

  private captureAfterState(response: any, metadata: any): any {
    // Implementation depends on resource type
    return response;
  }

  private calculateChanges(before: any, after: any): any {
    // Deep diff calculation
    return null;
  }

  private extractResourceId(request: any, response: any, metadata: any): string {
    return request.params?.id || response?.id || 'unknown';
  }
}
```

---

## 🎨 Decorators for Easy Integration

### 1. @RequirePermissions Decorator

```typescript
// src/common/decorators/require-permissions.decorator.ts

import { SetMetadata } from '@nestjs/common';

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);
```

### 2. @Audited Decorator

```typescript
// src/common/decorators/audited.decorator.ts

import { SetMetadata } from '@nestjs/common';

export interface AuditMetadata {
  action: string;
  resourceType: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  captureBeforeState?: boolean;
  captureAfterState?: boolean;
}

export const Audited = (metadata: AuditMetadata) =>
  SetMetadata('audit', metadata);
```

### 3. @AdminContext Decorator

```typescript
// src/common/decorators/admin-context.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const AdminContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.adminContext;
  },
);
```

---

## 📝 Usage Examples

### Example 1: Listing Approval with Full Audit

```typescript
// src/listings/listings.controller.ts

@Controller('admin/listings')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class AdminListingsController {
  constructor(private listingsService: ListingsService) {}

  @Patch(':id/approve')
  @RequirePermissions('listings.approve')
  @Audited({
    action: 'listing.approve',
    resourceType: 'Listing',
    riskLevel: 'medium',
    captureBeforeState: true,
    captureAfterState: true,
  })
  async approveListing(
    @Param('id') id: string,
    @Body() dto: ApproveListingDto,
    @AdminContext() admin: AdminContextType,
  ) {
    // The admin identity is automatically available
    // The action will be automatically audited
    // Permissions are automatically checked
    
    return this.listingsService.approveListing(id, {
      approvedBy: admin.userId,
      reason: dto.reason,
      notes: dto.notes,
    });
  }
}
```

### Example 2: Escrow Release with High-Risk Audit

```typescript
@Patch('transactions/:id/release-escrow')
@RequirePermissions('transactions.escrow.release')
@Audited({
  action: 'escrow.release',
  resourceType: 'Transaction',
  riskLevel: 'critical', // Financial operation
  captureBeforeState: true,
  captureAfterState: true,
})
async releaseEscrow(
  @Param('id') id: string,
  @Body() dto: ReleaseEscrowDto,
  @AdminContext() admin: AdminContextType,
) {
  // Validate reason is provided for critical actions
  if (!dto.reason || dto.reason.length < 20) {
    throw new BadRequestException(
      'Detailed reason required for escrow release (min 20 characters)',
    );
  }

  return this.transactionsService.releaseEscrow(id, {
    releasedBy: admin.userId,
    reason: dto.reason,
    verificationCode: dto.verificationCode,
  });
}
```

---

## 🔍 Audit Query & Analysis

### Audit Service Methods

```typescript
// src/common/services/audit.service.ts

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: AuditLogInput): Promise<AuditLog> {
    return this.prisma.auditLog.create({
      data: {
        performed_by_id: data.performedBy.userId,
        performed_by_role: data.performedBy.role,
        performed_by_ip: data.performedBy.ip,
        performed_by_user_agent: data.performedBy.userAgent,
        action: data.action,
        resource_type: data.resourceType,
        resource_id: data.resourceId,
        reason: data.reason,
        before_state: data.beforeState,
        after_state: data.afterState,
        changes: data.changes,
        risk_level: data.riskLevel,
        status: data.status,
        error_message: data.errorMessage,
        metadata: data.metadata,
        session_id: data.performedBy.sessionId,
      },
    });
  }

  async getAuditTrail(filters: AuditFilters): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: {
        performed_by_id: filters.userId,
        action: filters.action,
        resource_type: filters.resourceType,
        resource_id: filters.resourceId,
        risk_level: filters.riskLevel,
        created_at: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
      include: {
        performed_by: {
          select: {
            id: true,
            full_name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    });
  }

  async getResourceHistory(
    resourceType: string,
    resourceId: string,
  ): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: {
        resource_type: resourceType,
        resource_id: resourceId,
      },
      include: {
        performed_by: true,
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async getAdminActivity(
    adminId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AdminActivityReport> {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        performed_by_id: adminId,
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return {
      totalActions: logs.length,
      actionsByType: this.groupBy(logs, 'action'),
      actionsByRisk: this.groupBy(logs, 'risk_level'),
      successRate: this.calculateSuccessRate(logs),
      timeline: this.buildTimeline(logs),
    };
  }
}
```

---

## 🚀 Implementation Roadmap

### Week 1: Foundation
- [ ] Update Prisma schema with new models
- [ ] Run migrations
- [ ] Create base services (AuditService, PermissionService, AdminSessionService)
- [ ] Implement middleware and guards

### Week 2: Core Features
- [ ] Implement permission system
- [ ] Create decorators (@Audited, @RequirePermissions, @AdminContext)
- [ ] Build audit interceptor
- [ ] Add admin session management

### Week 3: Integration
- [ ] Refactor existing admin endpoints to use new system
- [ ] Remove all hardcoded admin IDs
- [ ] Add audit logging to critical operations
- [ ] Implement permission checks

### Week 4: Admin UI & Testing
- [ ] Build admin permission management UI
- [ ] Create audit log viewer
- [ ] Add admin session management UI
- [ ] Write comprehensive tests
- [ ] Security audit

---

## 📈 Success Metrics

1. **100% of critical actions audited** - No admin action goes unlogged
2. **Zero hardcoded admin IDs** - All admin operations use proper identity
3. **Complete audit trail** - Every action has before/after state
4. **Role-based access working** - Permissions properly enforced
5. **Compliance-ready** - Audit logs support legal/regulatory requirements

---

## 🔒 Security Considerations

1. **Audit log immutability** - Logs cannot be modified or deleted
2. **Encrypted sensitive data** - PII in audit logs encrypted at rest
3. **Access control on audit logs** - Only compliance admins can view
4. **Session timeout** - Admin sessions expire after inactivity
5. **MFA for critical actions** - Escrow release requires 2FA
6. **IP whitelisting** - Restrict admin access to known IPs
7. **Anomaly detection** - Alert on unusual admin behavior

---

This Control Layer transforms FreeLync from a basic admin panel into an **enterprise-grade, audit-ready platform** suitable for handling real financial transactions with full accountability and traceability.
