# Phase 0: Control Layer - Implementation Guide

## 🎯 Overview

This guide walks you through implementing the Control Layer in your FreeLync application. Follow these steps in order.

---

## Step 1: Database Migration

### 1.1 Generate Migration

```bash
cd backend
npx prisma migrate dev --name add_control_layer
```

This will:
- Create new tables: `permissions`, `permission_groups`, `audit_logs`, `admin_sessions`, `action_approvals`
- Add new columns to `users` table for admin features
- Create necessary indexes

### 1.2 Verify Migration

```bash
npx prisma studio
```

Check that all new tables exist.

---

## Step 2: Seed Permissions

### 2.1 Run Seed Script

```bash
npx ts-node prisma/seed-control-layer.ts
```

This creates:
- 38 permissions across 8 categories
- 5 permission groups (listing_manager, user_manager, finance_team, support_team, compliance_team)

### 2.2 Verify Permissions

```bash
npx prisma studio
```

Check `permissions` and `permission_groups` tables.

---

## Step 3: Update App Module

### 3.1 Import CommonModule

Edit `src/app.module.ts`:

```typescript
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { AdminIdentityMiddleware } from './common/middleware/admin-identity.middleware';

@Module({
  imports: [
    // ... existing imports
    CommonModule, // Add this
  ],
  // ... rest of module
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply admin identity middleware to all admin routes
    consumer
      .apply(AdminIdentityMiddleware)
      .forRoutes('admin/*');
  }
}
```

---

## Step 4: Assign Permissions to Existing Admins

### 4.1 Create Admin Setup Script

Create `backend/scripts/setup-admin.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupAdmin(email: string, permissionGroups: string[]) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`User not found: ${email}`);
    return;
  }

  await prisma.user.update({
    where: { email },
    data: {
      role: 'super_admin', // or 'admin', 'finance_admin', etc.
      permission_groups: permissionGroups,
    },
  });

  console.log(`✅ Updated ${email} with groups: ${permissionGroups.join(', ')}`);
}

async function main() {
  // Update your admin users
  await setupAdmin('admin@freelync.com', ['listing_manager', 'user_manager', 'finance_team']);
  
  // Add more admins as needed
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run it:

```bash
npx ts-node scripts/setup-admin.ts
```

---

## Step 5: Refactor Existing Admin Endpoints

### 5.1 Update Listings Controller

**BEFORE:**

```typescript
@Patch(':id/approve')
async approveListing(@Param('id') id: string) {
  const adminId = 'admin-id'; // HARDCODED!
  return this.listingsService.approveListing(id, adminId);
}
```

**AFTER:**

```typescript
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
  @Body() dto: { reason: string },
  @AdminContext() admin: AdminContextType,
) {
  return this.listingsService.approveListing(id, {
    approvedBy: admin.userId,
    reason: dto.reason,
  });
}
```

### 5.2 Update Transactions Controller

**BEFORE:**

```typescript
@Post(':id/release-escrow')
async releaseEscrow(@Param('id') id: string) {
  const adminId = 'admin-id'; // HARDCODED!
  return this.transactionsService.releaseEscrow(id, adminId);
}
```

**AFTER:**

```typescript
@Post(':id/release-escrow')
@RequirePermissions('transactions.escrow.release')
@Audited({
  action: 'escrow.release',
  resourceType: 'Transaction',
  riskLevel: 'critical', // Financial operation!
  captureBeforeState: true,
  captureAfterState: true,
})
async releaseEscrow(
  @Param('id') id: string,
  @Body() dto: { reason: string; verificationCode: string },
  @AdminContext() admin: AdminContextType,
) {
  // Critical actions require detailed reason
  if (!dto.reason || dto.reason.length < 30) {
    throw new BadRequestException(
      'Detailed justification required for escrow release (min 30 characters)',
    );
  }

  return this.transactionsService.releaseEscrow(id, {
    releasedBy: admin.userId,
    reason: dto.reason,
    verificationCode: dto.verificationCode,
  });
}
```

### 5.3 Update Users Controller

**BEFORE:**

```typescript
@Patch(':id/verify')
async verifyUser(@Param('id') id: string) {
  return this.usersService.verifyUser(id);
}
```

**AFTER:**

```typescript
@Patch(':id/verify')
@RequirePermissions('users.verify')
@Audited({
  action: 'user.verify',
  resourceType: 'User',
  riskLevel: 'medium',
  captureBeforeState: true,
  captureAfterState: true,
})
async verifyUser(
  @Param('id') id: string,
  @Body() dto: { reason?: string },
  @AdminContext() admin: AdminContextType,
) {
  return this.usersService.verifyUser(id, {
    verifiedBy: admin.userId,
    reason: dto.reason,
  });
}
```

---

## Step 6: Add Guards to Controllers

Update all admin controllers:

```typescript
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';

@Controller('admin/...')
@UseGuards(JwtAuthGuard, PermissionGuard) // Add these
@UseInterceptors(AuditInterceptor)        // Add this
export class YourAdminController {
  // ... endpoints
}
```

---

## Step 7: Update Frontend

### 7.1 Update Admin Context

The frontend should send the admin's JWT token in the Authorization header:

```typescript
// frontend/src/services/api.ts

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 7.2 Add Reason Fields to Admin Forms

Update admin action forms to include reason fields:

```typescript
// Example: Approve Listing Form
const handleApproveListing = async (listingId: string) => {
  const reason = prompt('Reason for approval (min 10 characters):');
  
  if (!reason || reason.length < 10) {
    toast.error('Reason required (min 10 characters)');
    return;
  }

  await ListingsService.approveListing(listingId, { reason });
};
```

### 7.3 Update Service Methods

```typescript
// frontend/src/services/listings.ts

export class ListingsService {
  static async approveListing(id: string, data: { reason: string }) {
    return api.patch(`/admin/listings/${id}/approve`, data);
  }

  static async rejectListing(id: string, data: { reason: string }) {
    return api.patch(`/admin/listings/${id}/reject`, data);
  }

  static async deleteListing(id: string, data: { reason: string }) {
    return api.delete(`/admin/listings/${id}`, { data });
  }
}
```

---

## Step 8: Create Audit Log Viewer (Frontend)

Create `frontend/src/pages/AuditLogs.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { AuditService } from '../services/audit';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    riskLevel: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadLogs = async () => {
    const response = await AuditService.getAuditTrail(filters);
    setLogs(response.data);
  };

  return (
    <div>
      <h1>Audit Logs</h1>
      
      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Action"
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
        />
        {/* More filters... */}
      </div>

      {/* Logs Table */}
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Admin</th>
            <th>Action</th>
            <th>Resource</th>
            <th>Risk Level</th>
            <th>Status</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{new Date(log.created_at).toLocaleString()}</td>
              <td>{log.performed_by.full_name}</td>
              <td>{log.action}</td>
              <td>{log.resource_type} ({log.resource_id})</td>
              <td>
                <span className={`badge ${log.risk_level}`}>
                  {log.risk_level}
                </span>
              </td>
              <td>{log.status}</td>
              <td>{log.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

## Step 9: Testing

### 9.1 Test Permission System

```bash
# Try accessing endpoint without permission
curl -X PATCH http://localhost:3000/api/admin/listings/123/approve \
  -H "Authorization: Bearer <token_without_permission>"

# Should return 403 Forbidden
```

### 9.2 Test Audit Logging

```bash
# Perform an admin action
curl -X PATCH http://localhost:3000/api/admin/listings/123/approve \
  -H "Authorization: Bearer <valid_admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Verified all documents"}'

# Check audit log
curl http://localhost:3000/api/admin/audit-logs \
  -H "Authorization: Bearer <valid_admin_token>"
```

### 9.3 Test Session Management

```bash
# Create session
curl -X POST http://localhost:3000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@freelync.com", "password": "password"}'

# Use returned token
# Session should auto-expire after configured timeout
```

---

## Step 10: Monitoring & Maintenance

### 10.1 Set Up Audit Log Archiving

Create a cron job to archive old logs:

```typescript
// backend/src/tasks/archive-logs.task.ts

import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AuditService } from '../common/services/audit.service';

@Injectable()
export class ArchiveLogsTask {
  constructor(private auditService: AuditService) {}

  @Cron('0 0 * * *') // Daily at midnight
  async archiveOldLogs() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const count = await this.auditService.archiveOldLogs(sixMonthsAgo);
    console.log(`Archived ${count} audit logs`);
  }
}
```

### 10.2 Monitor High-Risk Actions

```typescript
// backend/src/tasks/monitor-high-risk.task.ts

@Injectable()
export class MonitorHighRiskTask {
  constructor(private auditService: AuditService) {}

  @Cron('0 * * * *') // Every hour
  async checkHighRiskActions() {
    const highRiskActions = await this.auditService.getHighRiskActions(50);
    
    // Alert if too many high-risk actions
    if (highRiskActions.length > 20) {
      // Send alert to compliance team
      console.warn(`High number of high-risk actions: ${highRiskActions.length}`);
    }
  }
}
```

---

## ✅ Verification Checklist

- [ ] Database migration completed
- [ ] Permissions seeded
- [ ] Admin users assigned permission groups
- [ ] All admin controllers use `@UseGuards(JwtAuthGuard, PermissionGuard)`
- [ ] All admin controllers use `@UseInterceptors(AuditInterceptor)`
- [ ] All admin endpoints use `@RequirePermissions(...)`
- [ ] All critical endpoints use `@Audited(...)`
- [ ] All hardcoded admin IDs replaced with `@AdminContext()`
- [ ] Frontend sends JWT token in Authorization header
- [ ] Frontend includes reason fields for critical actions
- [ ] Audit log viewer created
- [ ] Permission denied returns 403 with clear message
- [ ] Audit logs capture all admin actions
- [ ] Session management working correctly

---

## 🎉 Success!

Your FreeLync platform now has:

✅ **No hardcoded admin IDs** - All actions traced to real admin users
✅ **Role-based permissions** - Granular control over who can do what
✅ **Complete audit trail** - Every action logged with full context
✅ **Compliance-ready** - Audit logs support legal/regulatory requirements
✅ **Security** - Session management, IP tracking, MFA support
✅ **Accountability** - Every admin action has a reason and can be traced

---

## 📚 Next Steps

1. **Implement MFA** - Add two-factor authentication for critical actions
2. **Add Approval Workflow** - Require approval for critical actions
3. **Build Admin Dashboard** - Show admin activity, high-risk actions, etc.
4. **Export Audit Reports** - Generate compliance reports
5. **Implement Dispute Resolution** - Use audit logs for dispute investigation

---

## 🆘 Troubleshooting

### Permission Denied Errors

```
Error: Missing required permissions: listings.approve
```

**Solution**: Assign the permission to the admin user:

```typescript
await prisma.user.update({
  where: { email: 'admin@freelync.com' },
  data: {
    permissions: {
      push: 'listings.approve',
    },
  },
});
```

### Audit Logs Not Created

**Check:**
1. Is `@Audited` decorator present?
2. Is `AuditInterceptor` applied to controller?
3. Is `adminContext` available in request?

### Session Expired

**Solution**: Implement token refresh:

```typescript
const refreshSession = async (refreshToken: string) => {
  const response = await api.post('/auth/refresh', { refreshToken });
  localStorage.setItem('adminToken', response.data.token);
};
```

---

## 📖 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [NestJS Guards](https://docs.nestjs.com/guards)
- [NestJS Interceptors](https://docs.nestjs.com/interceptors)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
