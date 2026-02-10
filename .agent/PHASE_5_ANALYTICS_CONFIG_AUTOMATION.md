# Phase 5: Analytics, Configuration & Automation Layer Architecture

**Version:** 1.0  
**Date:** 2026-02-09  
**Status:** Design Complete  
**Criticality:** HIGH - Affects Platform Operations & Revenue

---

## 1. Executive Summary

The Analytics, Configuration & Automation Layer is FreeLync's **operational control center**. It provides:

- **Analytics**: Data-driven insights for executive decisions
- **Configuration**: Controlled platform settings with audit trails
- **Automation**: Safe, predictable workflows for time-driven actions

### 1.1 Core Principle
**"Configuration changes affect real money. Automations can trigger irreversible actions. Both must be controlled, auditable, and safe."**

This system ensures:
- **Accuracy**: Analytics reflect true platform state
- **Control**: Configuration changes require approval and are traceable
- **Safety**: Automations are predictable, reversible where possible, and fail gracefully
- **Observability**: Every change and automation execution is logged

---

## 2. System Architecture

### 2.1 Three-Layer Design

```
┌─────────────────────────────────────────────────────────────┐
│                    ANALYTICS LAYER                          │
│  • Revenue metrics                                          │
│  • Growth tracking                                          │
│  • Transaction analytics                                    │
│  • User behavior insights                                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                 CONFIGURATION LAYER                         │
│  • Commission rates                                         │
│  • Payment gateway settings                                 │
│  • Feature flags                                            │
│  • Maintenance mode                                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  AUTOMATION LAYER                           │
│  • Scheduled workflows                                      │
│  • Rule-based triggers                                      │
│  • State-driven actions                                     │
│  • Batch operations                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Data Model

### 3.1 Analytics Models

#### **PlatformMetric Model**

**Purpose:** Store aggregated platform metrics for fast querying.

```prisma
enum MetricType {
  REVENUE
  TRANSACTION_COUNT
  USER_GROWTH
  LISTING_GROWTH
  PAYOUT_VOLUME
  COMMISSION_EARNED
  DISPUTE_RATE
  VERIFICATION_RATE
  CONVERSION_RATE
}

enum MetricPeriod {
  HOURLY
  DAILY
  WEEKLY
  MONTHLY
  YEARLY
}

model PlatformMetric {
  id              String        @id @default(uuid())
  
  // Metric Identity
  type            MetricType
  period          MetricPeriod
  period_start    DateTime
  period_end      DateTime
  
  // Metric Values
  value           Decimal       @db.Decimal(15, 2)
  count           Int?          // For countable metrics
  percentage      Decimal?      @db.Decimal(5, 2)  // For rate metrics
  
  // Breakdown (JSON for flexibility)
  breakdown       Json          @default("{}")  // e.g., by category, region
  
  // Metadata
  currency        String        @default("ETB")
  calculated_at   DateTime      @default(now())
  
  @@unique([type, period, period_start])
  @@index([type, period_start])
  @@map("platform_metrics")
}
```

#### **AnalyticsSnapshot Model**

**Purpose:** Point-in-time snapshots of key platform state.

```prisma
model AnalyticsSnapshot {
  id              String   @id @default(uuid())
  
  snapshot_date   DateTime @default(now())
  
  // User Metrics
  total_users     Int
  active_users    Int      // Active in last 30 days
  verified_users  Int
  
  // Listing Metrics
  total_listings  Int
  active_listings Int
  sold_listings   Int
  
  // Transaction Metrics
  total_transactions Int
  completed_transactions Int
  disputed_transactions Int
  
  // Financial Metrics
  total_revenue   Decimal  @db.Decimal(15, 2)
  total_payouts   Decimal  @db.Decimal(15, 2)
  pending_escrow  Decimal  @db.Decimal(15, 2)
  
  // Metadata
  metadata        Json     @default("{}")
  
  @@index([snapshot_date])
  @@map("analytics_snapshots")
}
```

---

### 3.2 Configuration Models

#### **PlatformConfig Model**

**Purpose:** Store platform-wide configuration with versioning.

```prisma
enum ConfigCategory {
  COMMISSION
  PAYMENT_GATEWAY
  FEATURE_FLAG
  SYSTEM_SETTING
  INTEGRATION
  SECURITY
}

enum ConfigStatus {
  DRAFT           // Being edited
  PENDING         // Awaiting approval
  ACTIVE          // Currently in use
  SCHEDULED       // Scheduled for future activation
  ARCHIVED        // No longer in use
}

model PlatformConfig {
  id              String        @id @default(uuid())
  
  // Config Identity
  key             String        @unique  // e.g., "commission.tier1.rate"
  category        ConfigCategory
  name            String
  description     String?
  
  // Config Value
  value           Json          // Flexible value storage
  value_type      String        // "number", "string", "boolean", "json"
  
  // Validation
  validation_rules Json         @default("{}")  // Min/max, regex, etc.
  
  // Status & Lifecycle
  status          ConfigStatus  @default(DRAFT)
  version         Int           @default(1)
  
  // Scheduling
  scheduled_at    DateTime?     // When to activate
  activated_at    DateTime?
  deactivated_at  DateTime?
  
  // Approval Workflow
  created_by_id   String
  created_by      User          @relation("ConfigCreator", fields: [created_by_id], references: [id])
  
  approved_by_id  String?
  approved_by     User?         @relation("ConfigApprover", fields: [approved_by_id], references: [id])
  approved_at     DateTime?
  
  // Audit
  change_history  ConfigChangeHistory[]
  
  created_at      DateTime      @default(now())
  updated_at      DateTime      @updatedAt
  
  @@index([category, status])
  @@index([key, version])
  @@map("platform_configs")
}
```

#### **ConfigChangeHistory Model**

**Purpose:** Immutable audit trail of all configuration changes.

```prisma
model ConfigChangeHistory {
  id              String        @id @default(uuid())
  
  config_id       String
  config          PlatformConfig @relation(fields: [config_id], references: [id])
  
  // Change Details
  version         Int
  previous_value  Json?
  new_value       Json
  
  // Change Reason
  change_reason   String
  change_type     String        // "created", "updated", "activated", "deactivated"
  
  // Actor
  changed_by_id   String
  changed_by      User          @relation("ConfigChanger", fields: [changed_by_id], references: [id])
  
  // Impact Assessment
  affected_users  Int?          // Estimated users affected
  affected_transactions Int?
  risk_level      String        // "low", "medium", "high", "critical"
  
  // Rollback
  can_rollback    Boolean       @default(true)
  rolled_back     Boolean       @default(false)
  rolled_back_at  DateTime?
  
  created_at      DateTime      @default(now())
  
  @@index([config_id, version])
  @@map("config_change_history")
}
```

#### **FeatureFlag Model**

**Purpose:** Control feature rollout with targeting and experimentation.

```prisma
enum FeatureFlagStatus {
  DISABLED
  ENABLED_FOR_TESTING
  ENABLED_FOR_PERCENTAGE
  ENABLED_FOR_USERS
  ENABLED_GLOBALLY
}

model FeatureFlag {
  id              String            @id @default(uuid())
  
  // Flag Identity
  key             String            @unique  // e.g., "new_checkout_flow"
  name            String
  description     String?
  
  // Status
  status          FeatureFlagStatus @default(DISABLED)
  
  // Targeting
  enabled_percentage Decimal?       @db.Decimal(5, 2)  // 0-100
  enabled_user_ids   String[]       @default([])
  enabled_roles      String[]       @default([])
  
  // Metadata
  owner_id        String
  owner           User              @relation("FeatureFlagOwner", fields: [owner_id], references: [id])
  
  tags            String[]          @default([])
  
  // Lifecycle
  enabled_at      DateTime?
  disabled_at     DateTime?
  
  created_at      DateTime          @default(now())
  updated_at      DateTime          @updatedAt
  
  @@index([status])
  @@map("feature_flags")
}
```

#### **MaintenanceMode Model**

**Purpose:** Control platform availability and graceful degradation.

```prisma
enum MaintenanceType {
  FULL            // Platform completely unavailable
  READ_ONLY       // No writes allowed
  FEATURE_SPECIFIC // Specific features disabled
}

model MaintenanceMode {
  id              String          @id @default(uuid())
  
  type            MaintenanceType
  
  // Scope
  affected_features String[]      @default([])  // For FEATURE_SPECIFIC
  
  // Messaging
  title           String
  message         String
  estimated_end   DateTime?
  
  // Status
  is_active       Boolean         @default(false)
  
  // Scheduling
  scheduled_start DateTime?
  scheduled_end   DateTime?
  
  // Activation
  activated_by_id String?
  activated_by    User?           @relation("MaintenanceActivator", fields: [activated_by_id], references: [id])
  activated_at    DateTime?
  
  deactivated_at  DateTime?
  
  created_at      DateTime        @default(now())
  updated_at      DateTime        @updatedAt
  
  @@index([is_active])
  @@map("maintenance_modes")
}
```

---

### 3.3 Automation Models

#### **AutomationWorkflow Model**

**Purpose:** Define automated workflows with triggers and actions.

```prisma
enum WorkflowTriggerType {
  SCHEDULED       // Cron-based
  EVENT           // Platform event
  STATE_CHANGE    // Entity state change
  MANUAL          // Admin-triggered
}

enum WorkflowStatus {
  DRAFT
  ACTIVE
  PAUSED
  ARCHIVED
}

model AutomationWorkflow {
  id              String              @id @default(uuid())
  
  // Workflow Identity
  name            String
  description     String?
  
  // Trigger Configuration
  trigger_type    WorkflowTriggerType
  trigger_config  Json                // Cron expression, event type, etc.
  
  // Actions
  actions         Json                // Array of actions to execute
  
  // Status
  status          WorkflowStatus      @default(DRAFT)
  
  // Execution Settings
  max_retries     Int                 @default(3)
  timeout_seconds Int                 @default(300)
  
  // Safety
  dry_run_mode    Boolean             @default(false)
  requires_approval Boolean           @default(false)
  
  // Metadata
  created_by_id   String
  created_by      User                @relation("WorkflowCreator", fields: [created_by_id], references: [id])
  
  tags            String[]            @default([])
  
  // Execution History
  executions      WorkflowExecution[]
  
  // Stats
  total_executions Int                @default(0)
  success_count   Int                 @default(0)
  failure_count   Int                 @default(0)
  
  last_executed_at DateTime?
  
  created_at      DateTime            @default(now())
  updated_at      DateTime            @updatedAt
  
  @@index([status, trigger_type])
  @@map("automation_workflows")
}
```

#### **WorkflowExecution Model**

**Purpose:** Track individual workflow executions with full audit trail.

```prisma
enum ExecutionStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
  REQUIRES_APPROVAL
}

model WorkflowExecution {
  id              String          @id @default(uuid())
  
  workflow_id     String
  workflow        AutomationWorkflow @relation(fields: [workflow_id], references: [id])
  
  // Execution Details
  status          ExecutionStatus @default(PENDING)
  
  // Trigger Context
  triggered_by    String          // "schedule", "event", "admin"
  trigger_data    Json            @default("{}")
  
  // Execution Trace
  started_at      DateTime?
  completed_at    DateTime?
  duration_ms     Int?
  
  // Actions Executed
  actions_executed Json           @default("[]")  // Array of action results
  
  // Results
  success         Boolean?
  error_message   String?
  error_stack     String?
  
  // Output
  output_data     Json            @default("{}")
  affected_entities Json          @default("{}")  // What was changed
  
  // Retry
  retry_count     Int             @default(0)
  
  // Approval (if required)
  approved_by_id  String?
  approved_by     User?           @relation("ExecutionApprover", fields: [approved_by_id], references: [id])
  approved_at     DateTime?
  
  created_at      DateTime        @default(now())
  
  @@index([workflow_id, created_at])
  @@index([status])
  @@map("workflow_executions")
}
```

#### **ScheduledTask Model**

**Purpose:** One-off or recurring scheduled tasks.

```prisma
enum TaskStatus {
  SCHEDULED
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}

model ScheduledTask {
  id              String      @id @default(uuid())
  
  // Task Identity
  name            String
  description     String?
  task_type       String      // "send_notification", "generate_report", etc.
  
  // Scheduling
  scheduled_for   DateTime
  recurrence      String?     // Cron expression for recurring tasks
  
  // Payload
  payload         Json        @default("{}")
  
  // Status
  status          TaskStatus  @default(SCHEDULED)
  
  // Execution
  executed_at     DateTime?
  completed_at    DateTime?
  error_message   String?
  
  // Result
  result          Json?
  
  // Metadata
  created_by_id   String
  created_by      User        @relation("TaskCreator", fields: [created_by_id], references: [id])
  
  created_at      DateTime    @default(now())
  updated_at      DateTime    @updatedAt
  
  @@index([status, scheduled_for])
  @@map("scheduled_tasks")
}
```

---

## 4. Analytics System

### 4.1 Metric Calculation

**Revenue Metrics:**

```typescript
async function calculateRevenueMetrics(
  periodStart: Date,
  periodEnd: Date
) {
  // Total platform revenue (commissions)
  const commissions = await prisma.commissionRecord.aggregate({
    where: {
      calculated_at: { gte: periodStart, lte: periodEnd }
    },
    _sum: {
      platform_fee: true,
      processor_fee: true
    }
  });
  
  // Gross transaction volume
  const transactions = await prisma.transaction.aggregate({
    where: {
      status: 'completed',
      created_at: { gte: periodStart, lte: periodEnd }
    },
    _sum: { amount: true },
    _count: true
  });
  
  // Payouts processed
  const payouts = await prisma.payoutRequest.aggregate({
    where: {
      status: 'COMPLETED',
      completed_at: { gte: periodStart, lte: periodEnd }
    },
    _sum: { amount: true },
    _count: true
  });
  
  return {
    platform_revenue: commissions._sum.platform_fee,
    processor_fees: commissions._sum.processor_fee,
    gross_volume: transactions._sum.amount,
    transaction_count: transactions._count,
    payout_volume: payouts._sum.amount,
    payout_count: payouts._count,
    net_revenue: commissions._sum.platform_fee.sub(commissions._sum.processor_fee)
  };
}
```

**Growth Metrics:**

```typescript
async function calculateGrowthMetrics(
  periodStart: Date,
  periodEnd: Date
) {
  // New users
  const newUsers = await prisma.user.count({
    where: {
      created_at: { gte: periodStart, lte: periodEnd }
    }
  });
  
  // New listings
  const newListings = await prisma.listing.count({
    where: {
      created_at: { gte: periodStart, lte: periodEnd }
    }
  });
  
  // Active users (transacted in period)
  const activeUsers = await prisma.transaction.findMany({
    where: {
      created_at: { gte: periodStart, lte: periodEnd }
    },
    select: { buyer_id: true, seller_id: true },
    distinct: ['buyer_id', 'seller_id']
  });
  
  return {
    new_users: newUsers,
    new_listings: newListings,
    active_users: new Set([
      ...activeUsers.map(t => t.buyer_id),
      ...activeUsers.map(t => t.seller_id)
    ]).size
  };
}
```

**Conversion Metrics:**

```typescript
async function calculateConversionMetrics(
  periodStart: Date,
  periodEnd: Date
) {
  // Listing to transaction conversion
  const listings = await prisma.listing.count({
    where: {
      created_at: { gte: periodStart, lte: periodEnd }
    }
  });
  
  const soldListings = await prisma.listing.count({
    where: {
      created_at: { gte: periodStart, lte: periodEnd },
      status: 'sold'
    }
  });
  
  // Inquiry to transaction conversion
  const inquiries = await prisma.notification.count({
    where: {
      type: 'listing_inquiry',
      created_at: { gte: periodStart, lte: periodEnd }
    }
  });
  
  const transactions = await prisma.transaction.count({
    where: {
      created_at: { gte: periodStart, lte: periodEnd }
    }
  });
  
  return {
    listing_conversion_rate: (soldListings / listings) * 100,
    inquiry_conversion_rate: (transactions / inquiries) * 100
  };
}
```

### 4.2 Analytics Dashboard Queries

**Executive Dashboard:**

```typescript
async function getExecutiveDashboard(timeRange: string) {
  const { start, end } = parseTimeRange(timeRange);
  
  // Get or calculate metrics
  const revenue = await getMetric('REVENUE', 'DAILY', start, end);
  const growth = await getMetric('USER_GROWTH', 'DAILY', start, end);
  const transactions = await getMetric('TRANSACTION_COUNT', 'DAILY', start, end);
  
  // Get latest snapshot
  const snapshot = await prisma.analyticsSnapshot.findFirst({
    orderBy: { snapshot_date: 'desc' }
  });
  
  return {
    revenue: {
      current: revenue.value,
      trend: calculateTrend(revenue),
      breakdown: revenue.breakdown
    },
    growth: {
      new_users: growth.count,
      trend: calculateTrend(growth)
    },
    transactions: {
      count: transactions.count,
      value: transactions.value,
      trend: calculateTrend(transactions)
    },
    snapshot: snapshot
  };
}
```

---

## 5. Configuration Management

### 5.1 Commission Rate Configuration

**Workflow:**

```typescript
async function updateCommissionRate(
  tier: string,
  newRate: number,
  adminContext: AdminContext,
  effectiveDate?: Date
) {
  // 1. Validate
  if (newRate < 0 || newRate > 10) {
    throw new Error('Commission rate must be between 0% and 10%');
  }
  
  // 2. Get current config
  const currentConfig = await prisma.platformConfig.findUnique({
    where: { key: `commission.${tier}.rate` }
  });
  
  // 3. Create new version
  const newConfig = await prisma.platformConfig.create({
    data: {
      key: `commission.${tier}.rate`,
      category: 'COMMISSION',
      name: `Commission Rate - ${tier}`,
      value: { rate: newRate },
      value_type: 'number',
      status: effectiveDate ? 'SCHEDULED' : 'PENDING',
      version: (currentConfig?.version || 0) + 1,
      scheduled_at: effectiveDate,
      created_by_id: adminContext.userId
    }
  });
  
  // 4. Create change history
  await prisma.configChangeHistory.create({
    data: {
      config_id: newConfig.id,
      version: newConfig.version,
      previous_value: currentConfig?.value,
      new_value: { rate: newRate },
      change_reason: `Commission rate update for ${tier}`,
      change_type: 'updated',
      changed_by_id: adminContext.userId,
      risk_level: newRate > (currentConfig?.value?.rate || 0) ? 'high' : 'medium'
    }
  });
  
  // 5. Require approval for high-risk changes
  if (newRate > 5) {
    await notificationService.createFromTemplate(
      'CONFIG_APPROVAL_REQUIRED',
      adminContext.userId,
      {
        config_key: newConfig.key,
        config_id: newConfig.id,
        risk_level: 'high'
      }
    );
  }
  
  // 6. Audit log
  await auditService.log({
    performedBy: adminContext,
    action: 'config.commission.updated',
    resourceType: 'PlatformConfig',
    resourceId: newConfig.id,
    riskLevel: 'high'
  });
  
  return newConfig;
}
```

**Activation:**

```typescript
async function activateConfig(
  configId: string,
  adminContext: AdminContext
) {
  return await prisma.$transaction(async (tx) => {
    const config = await tx.platformConfig.findUnique({
      where: { id: configId }
    });
    
    if (config.status !== 'PENDING' && config.status !== 'SCHEDULED') {
      throw new Error('Config not ready for activation');
    }
    
    // Deactivate current active config
    await tx.platformConfig.updateMany({
      where: {
        key: config.key,
        status: 'ACTIVE'
      },
      data: {
        status: 'ARCHIVED',
        deactivated_at: new Date()
      }
    });
    
    // Activate new config
    await tx.platformConfig.update({
      where: { id: configId },
      data: {
        status: 'ACTIVE',
        activated_at: new Date(),
        approved_by_id: adminContext.userId,
        approved_at: new Date()
      }
    });
    
    // Create change history
    await tx.configChangeHistory.create({
      data: {
        config_id: configId,
        version: config.version,
        new_value: config.value,
        change_reason: 'Config activated',
        change_type: 'activated',
        changed_by_id: adminContext.userId,
        risk_level: 'high'
      }
    });
    
    // Emit event
    await eventDispatcher.emit('config.activated', {
      config_id: configId,
      key: config.key,
      value: config.value
    });
  });
}
```

### 5.2 Feature Flag Management

**Check Feature Flag:**

```typescript
async function isFeatureEnabled(
  flagKey: string,
  userId?: string,
  userRole?: string
): Promise<boolean> {
  const flag = await prisma.featureFlag.findUnique({
    where: { key: flagKey }
  });
  
  if (!flag) return false;
  
  switch (flag.status) {
    case 'DISABLED':
      return false;
      
    case 'ENABLED_GLOBALLY':
      return true;
      
    case 'ENABLED_FOR_TESTING':
      // Only for admins
      return userRole === 'admin';
      
    case 'ENABLED_FOR_USERS':
      return userId && flag.enabled_user_ids.includes(userId);
      
    case 'ENABLED_FOR_PERCENTAGE':
      // Consistent hashing for stable rollout
      if (!userId) return false;
      const hash = hashUserId(userId);
      return (hash % 100) < flag.enabled_percentage.toNumber();
      
    default:
      return false;
  }
}
```

**Gradual Rollout:**

```typescript
async function rolloutFeature(
  flagKey: string,
  targetPercentage: number,
  adminContext: AdminContext
) {
  const flag = await prisma.featureFlag.findUnique({
    where: { key: flagKey }
  });
  
  if (!flag) throw new Error('Feature flag not found');
  
  // Gradual increase: 1% → 5% → 10% → 25% → 50% → 100%
  const rolloutSteps = [1, 5, 10, 25, 50, 100];
  const currentPercentage = flag.enabled_percentage?.toNumber() || 0;
  
  if (targetPercentage <= currentPercentage) {
    throw new Error('Target percentage must be higher than current');
  }
  
  await prisma.featureFlag.update({
    where: { key: flagKey },
    data: {
      status: 'ENABLED_FOR_PERCENTAGE',
      enabled_percentage: targetPercentage
    }
  });
  
  await auditService.log({
    performedBy: adminContext,
    action: 'feature.rollout',
    resourceType: 'FeatureFlag',
    resourceId: flag.id,
    afterState: { percentage: targetPercentage }
  });
}
```

### 5.3 Maintenance Mode

**Activate Maintenance:**

```typescript
async function activateMaintenanceMode(
  type: MaintenanceType,
  message: string,
  estimatedEnd: Date,
  adminContext: AdminContext
) {
  const maintenance = await prisma.maintenanceMode.create({
    data: {
      type,
      title: 'Scheduled Maintenance',
      message,
      estimated_end: estimatedEnd,
      is_active: true,
      activated_by_id: adminContext.userId,
      activated_at: new Date()
    }
  });
  
  // Broadcast to all connected users
  await eventDispatcher.emit('maintenance.activated', {
    type,
    message,
    estimated_end: estimatedEnd
  });
  
  // Audit
  await auditService.log({
    performedBy: adminContext,
    action: 'maintenance.activated',
    resourceType: 'MaintenanceMode',
    resourceId: maintenance.id,
    riskLevel: 'critical'
  });
  
  return maintenance;
}
```

---

## 6. Automation System

### 6.1 Scheduled Workflows

**Daily Revenue Report:**

```typescript
const dailyRevenueReportWorkflow = {
  name: 'Daily Revenue Report',
  trigger_type: 'SCHEDULED',
  trigger_config: {
    cron: '0 8 * * *',  // Every day at 8 AM
    timezone: 'Africa/Addis_Ababa'
  },
  actions: [
    {
      type: 'calculate_metrics',
      params: {
        metrics: ['REVENUE', 'TRANSACTION_COUNT', 'PAYOUT_VOLUME'],
        period: 'DAILY'
      }
    },
    {
      type: 'generate_report',
      params: {
        report_type: 'DAILY_SUMMARY',
        format: 'pdf'
      }
    },
    {
      type: 'send_notification',
      params: {
        recipients: ['admin@freelync.com'],
        template: 'DAILY_REVENUE_REPORT'
      }
    }
  ]
};
```

**Document Expiry Checker:**

```typescript
const documentExpiryWorkflow = {
  name: 'Document Expiry Checker',
  trigger_type: 'SCHEDULED',
  trigger_config: {
    cron: '0 0 * * *',  // Daily at midnight
    timezone: 'Africa/Addis_Ababa'
  },
  actions: [
    {
      type: 'query_database',
      params: {
        model: 'VerificationDocument',
        where: {
          expiry_date: {
            lte: { days: 30 }  // Expiring in 30 days
          },
          status: 'VERIFIED'
        }
      }
    },
    {
      type: 'send_notifications',
      params: {
        template: 'VERIFICATION_EXPIRING',
        batch_size: 100
      }
    },
    {
      type: 'update_status',
      params: {
        model: 'VerificationDocument',
        where: {
          expiry_date: { lte: 'now' }
        },
        data: {
          status: 'EXPIRED'
        }
      }
    }
  ]
};
```

### 6.2 Event-Driven Workflows

**Auto-Approve Low-Risk Payouts:**

```typescript
const autoApprovePayoutsWorkflow = {
  name: 'Auto-Approve Low-Risk Payouts',
  trigger_type: 'EVENT',
  trigger_config: {
    event_type: 'payout.requested'
  },
  actions: [
    {
      type: 'evaluate_conditions',
      params: {
        conditions: [
          { field: 'amount', operator: 'lte', value: 5000 },
          { field: 'seller.verified', operator: 'eq', value: true },
          { field: 'seller.trust_score', operator: 'gte', value: 8 }
        ]
      }
    },
    {
      type: 'approve_payout',
      params: {
        auto_approved: true,
        reason: 'Auto-approved: Low risk'
      }
    }
  ],
  requires_approval: false
};
```

### 6.3 Workflow Execution Engine

```typescript
async function executeWorkflow(
  workflowId: string,
  triggerData: any
) {
  const workflow = await prisma.automationWorkflow.findUnique({
    where: { id: workflowId }
  });
  
  if (workflow.status !== 'ACTIVE') {
    throw new Error('Workflow not active');
  }
  
  // Create execution record
  const execution = await prisma.workflowExecution.create({
    data: {
      workflow_id: workflowId,
      status: 'PENDING',
      triggered_by: 'schedule',
      trigger_data: triggerData
    }
  });
  
  try {
    // Update to running
    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: 'RUNNING',
        started_at: new Date()
      }
    });
    
    const results = [];
    
    // Execute actions sequentially
    for (const action of workflow.actions) {
      const result = await executeAction(action, triggerData);
      results.push(result);
      
      // Stop on failure if not configured to continue
      if (!result.success && !action.continue_on_failure) {
        throw new Error(`Action failed: ${result.error}`);
      }
    }
    
    // Mark as completed
    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: 'COMPLETED',
        completed_at: new Date(),
        duration_ms: Date.now() - execution.started_at.getTime(),
        actions_executed: results,
        success: true
      }
    });
    
    // Update workflow stats
    await prisma.automationWorkflow.update({
      where: { id: workflowId },
      data: {
        total_executions: { increment: 1 },
        success_count: { increment: 1 },
        last_executed_at: new Date()
      }
    });
    
  } catch (error) {
    // Mark as failed
    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: 'FAILED',
        completed_at: new Date(),
        error_message: error.message,
        error_stack: error.stack
      }
    });
    
    // Update workflow stats
    await prisma.automationWorkflow.update({
      where: { id: workflowId },
      data: {
        total_executions: { increment: 1 },
        failure_count: { increment: 1 }
      }
    });
    
    // Retry if configured
    if (execution.retry_count < workflow.max_retries) {
      await scheduleRetry(execution.id, execution.retry_count + 1);
    }
  }
}
```

---

## 7. Safety & Governance

### 7.1 Configuration Safeguards

**Approval Requirements:**

```typescript
const CONFIG_APPROVAL_RULES = {
  COMMISSION: {
    requiresApproval: true,
    approvers: ['ceo', 'cfo'],
    minApprovers: 1
  },
  PAYMENT_GATEWAY: {
    requiresApproval: true,
    approvers: ['cto', 'cfo'],
    minApprovers: 2
  },
  FEATURE_FLAG: {
    requiresApproval: false,  // Can be toggled quickly
    approvers: ['cto']
  }
};
```

**Validation Rules:**

```typescript
const CONFIG_VALIDATION = {
  'commission.tier1.rate': {
    type: 'number',
    min: 0,
    max: 10,
    step: 0.1
  },
  'payout.minimum_amount': {
    type: 'number',
    min: 100,
    max: 10000
  },
  'payment.gateway.api_key': {
    type: 'string',
    encrypted: true,
    pattern: /^sk_live_[a-zA-Z0-9]{32}$/
  }
};
```

**Rollback Capability:**

```typescript
async function rollbackConfig(
  configId: string,
  adminContext: AdminContext
) {
  const config = await prisma.platformConfig.findUnique({
    where: { id: configId },
    include: {
      change_history: {
        orderBy: { version: 'desc' },
        take: 2
      }
    }
  });
  
  const previousVersion = config.change_history[1];
  
  if (!previousVersion || !previousVersion.can_rollback) {
    throw new Error('Cannot rollback this configuration');
  }
  
  // Create new version with previous value
  await prisma.platformConfig.update({
    where: { id: configId },
    data: {
      value: previousVersion.previous_value,
      version: { increment: 1 }
    }
  });
  
  // Mark as rolled back
  await prisma.configChangeHistory.update({
    where: { id: previousVersion.id },
    data: {
      rolled_back: true,
      rolled_back_at: new Date()
    }
  });
}
```

### 7.2 Automation Safeguards

**Dry Run Mode:**

```typescript
async function executeWorkflowDryRun(
  workflowId: string,
  triggerData: any
) {
  const workflow = await prisma.automationWorkflow.findUnique({
    where: { id: workflowId }
  });
  
  const simulation = {
    workflow_id: workflowId,
    would_execute: [],
    estimated_impact: {}
  };
  
  for (const action of workflow.actions) {
    const impact = await simulateAction(action, triggerData);
    simulation.would_execute.push({
      action: action.type,
      impact: impact
    });
  }
  
  return simulation;
}
```

**Rate Limiting:**

```typescript
const AUTOMATION_RATE_LIMITS = {
  'send_notification': {
    max_per_hour: 1000,
    max_per_day: 10000
  },
  'update_status': {
    max_per_execution: 100,
    max_per_hour: 500
  },
  'approve_payout': {
    max_per_hour: 50,
    max_total_amount: 100000  // ETB
  }
};
```

**Circuit Breaker:**

```typescript
class AutomationCircuitBreaker {
  private failureCount = 0;
  private lastFailure: Date;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  async execute(workflowId: string, fn: Function) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure.getTime() > 60000) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await fn();
      
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failureCount = 0;
      }
      
      return result;
      
    } catch (error) {
      this.failureCount++;
      this.lastFailure = new Date();
      
      if (this.failureCount >= 5) {
        this.state = 'OPEN';
        await this.notifyAdmins(workflowId);
      }
      
      throw error;
    }
  }
}
```

---

## 8. API Endpoints

### 8.1 Analytics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/dashboard` | Executive dashboard |
| GET | `/analytics/revenue` | Revenue metrics |
| GET | `/analytics/growth` | Growth metrics |
| GET | `/analytics/transactions` | Transaction analytics |
| GET | `/analytics/snapshots` | Historical snapshots |
| POST | `/analytics/custom-query` | Custom analytics query |

### 8.2 Configuration Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/config` | List all configs |
| GET | `/admin/config/:key` | Get config by key |
| POST | `/admin/config` | Create new config |
| PATCH | `/admin/config/:id` | Update config |
| POST | `/admin/config/:id/activate` | Activate config |
| POST | `/admin/config/:id/rollback` | Rollback config |
| GET | `/admin/config/:id/history` | Get change history |

### 8.3 Feature Flag Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/features` | List all flags |
| POST | `/admin/features` | Create flag |
| PATCH | `/admin/features/:key` | Update flag |
| POST | `/admin/features/:key/enable` | Enable flag |
| POST | `/admin/features/:key/disable` | Disable flag |
| POST | `/admin/features/:key/rollout` | Gradual rollout |

### 8.4 Automation Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/workflows` | List workflows |
| POST | `/admin/workflows` | Create workflow |
| PATCH | `/admin/workflows/:id` | Update workflow |
| POST | `/admin/workflows/:id/execute` | Manual execution |
| POST | `/admin/workflows/:id/dry-run` | Simulate execution |
| GET | `/admin/workflows/:id/executions` | Execution history |

---

## 9. Monitoring & Observability

### 9.1 Key Metrics

**Analytics Health:**
- Metric calculation latency
- Snapshot generation time
- Query performance

**Configuration Health:**
- Pending approvals count
- Failed activations
- Rollback frequency

**Automation Health:**
- Workflow success rate
- Average execution time
- Failed executions count
- Circuit breaker trips

### 9.2 Alerts

```typescript
const ALERT_RULES = {
  'analytics.calculation_failed': {
    severity: 'high',
    notify: ['cto@freelync.com']
  },
  'config.high_risk_change': {
    severity: 'critical',
    notify: ['ceo@freelync.com', 'cfo@freelync.com']
  },
  'automation.circuit_breaker_open': {
    severity: 'critical',
    notify: ['cto@freelync.com']
  },
  'automation.high_failure_rate': {
    severity: 'high',
    threshold: 0.2,  // 20% failure rate
    notify: ['devops@freelync.com']
  }
};
```

---

## 10. Implementation Checklist

- [ ] Analytics models and metric calculation
- [ ] Configuration management with approval workflow
- [ ] Feature flag system with gradual rollout
- [ ] Maintenance mode controls
- [ ] Automation workflow engine
- [ ] Scheduled task processor
- [ ] Admin dashboard UI
- [ ] Analytics visualization
- [ ] Configuration approval UI
- [ ] Workflow builder UI
- [ ] Monitoring and alerting
- [ ] Audit logging
- [ ] Documentation

---

## 11. Conclusion

The Analytics, Configuration & Automation Layer provides FreeLync with:

✅ **Data-Driven Insights**: Accurate analytics for executive decisions  
✅ **Controlled Configuration**: Auditable settings with approval workflows  
✅ **Safe Automation**: Predictable workflows with safeguards  
✅ **Operational Flexibility**: Feature flags and maintenance controls  
✅ **Complete Observability**: Full audit trails and monitoring  

This system ensures that **analytics are accurate, configuration changes are controlled, and automations are safe**—enabling confident platform evolution without compromising financial correctness or stability.
