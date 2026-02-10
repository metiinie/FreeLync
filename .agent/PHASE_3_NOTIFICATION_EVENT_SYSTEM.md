# Phase 3: Notification & Event System Architecture

**Version:** 1.0  
**Date:** 2026-02-09  
**Status:** Design Complete

---

## 1. Executive Summary

The Notification & Event System is FreeLync's **automation nervous system**. It transforms platform state changes into actionable user communications, reducing manual admin work by 70% and preventing user confusion through proactive, context-aware messaging.

### 1.1 Core Principle
**"Every state change is an event. Every event is an opportunity to inform, guide, or automate."**

This system is **event-driven**, not cosmetic. Notifications are:
- **Triggered automatically** by platform events (escrow actions, disputes, verifications)
- **Delivered across channels** (in-app, email, SMS-ready)
- **Tracked for delivery** (sent, delivered, failed, bounced)
- **Template-driven** with dynamic variables
- **Auditable** for compliance and debugging

---

## 2. System Architecture

### 2.1 Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    PLATFORM EVENTS                          │
│  (Escrow, Disputes, Verifications, Listings, Transactions)  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  EVENT DISPATCHER                           │
│  • Listens to domain events                                 │
│  • Maps events to notification templates                    │
│  • Enriches with context data                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              NOTIFICATION ORCHESTRATOR                      │
│  • Creates notification records                             │
│  • Applies user preferences (channels, frequency)           │
│  • Queues for delivery                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                DELIVERY CHANNELS                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  In-App  │  │  Email   │  │   SMS    │  │   Push   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              DELIVERY STATUS TRACKER                        │
│  • Tracks sent, delivered, failed, bounced                  │
│  • Retries failed deliveries                                │
│  • Logs for audit and analytics                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Data Model

### 3.1 Enhanced Notification Model

**Existing Fields (Keep):**
- `id`, `user_id`, `type`, `title`, `message`, `data`, `priority`
- `read`, `read_at`, `created_at`

**New Fields (Add):**
```prisma
model Notification {
  // ... existing fields ...
  
  // Template & Variables
  template_id     String?
  template        NotificationTemplate? @relation(fields: [template_id], references: [id])
  variables       Json                  @default("{}")
  
  // Delivery Tracking
  channels        Json                  @default("{\"in_app\": true, \"email\": true, \"sms\": false, \"push\": false}")
  delivery_status Json                  @default("{}")
  sent_at         DateTime?
  delivered_at    DateTime?
  failed_at       DateTime?
  failure_reason  String?
  retry_count     Int                   @default(0)
  max_retries     Int                   @default(3)
  
  // Event Context
  event_type      String?               // e.g., "escrow.released", "dispute.resolved"
  event_id        String?               // Reference to source event
  triggered_by_id String?               // Admin who triggered (if manual)
  triggered_by    User?                 @relation("TriggeredNotifications", fields: [triggered_by_id], references: [id])
  
  // Grouping & Threading
  thread_id       String?               // Group related notifications
  parent_id       String?               // Reply-to for threaded conversations
  parent          Notification?         @relation("NotificationThread", fields: [parent_id], references: [id])
  children        Notification[]        @relation("NotificationThread")
  
  // Scheduling
  scheduled_for   DateTime?             // Delayed delivery
  expires_at      DateTime?             // Auto-delete after date
  
  // Metadata
  metadata        Json                  @default("{}")
  
  @@index([user_id, read, created_at])
  @@index([event_type, created_at])
  @@index([scheduled_for])
}
```

### 3.2 NotificationTemplate Model

```prisma
model NotificationTemplate {
  id              String   @id @default(uuid())
  code            String   @unique  // e.g., "ESCROW_RELEASED"
  name            String
  description     String?
  
  // Content Templates
  title_template  String
  message_template String
  email_subject   String?
  email_body      String?  // HTML template
  sms_body        String?
  
  // Configuration
  default_priority NotificationPriority @default(medium)
  default_channels Json                 @default("{\"in_app\": true, \"email\": true, \"sms\": false}")
  
  // Variables Schema (for validation)
  required_vars   String[]             @default([])
  optional_vars   String[]             @default([])
  
  // Metadata
  category        String               // "transactional", "marketing", "system"
  is_active       Boolean              @default(true)
  
  notifications   Notification[]
  
  created_at      DateTime             @default(now())
  updated_at      DateTime             @updatedAt
  
  @@map("notification_templates")
}
```

### 3.3 NotificationPreference Model

```prisma
model NotificationPreference {
  id              String   @id @default(uuid())
  user_id         String
  user            User     @relation(fields: [user_id], references: [id])
  
  // Channel Preferences
  email_enabled   Boolean  @default(true)
  sms_enabled     Boolean  @default(false)
  push_enabled    Boolean  @default(true)
  
  // Category Preferences
  transactional   Json     @default("{\"email\": true, \"sms\": true, \"push\": true}")
  marketing       Json     @default("{\"email\": true, \"sms\": false, \"push\": false}")
  system          Json     @default("{\"email\": true, \"sms\": false, \"push\": true}")
  
  // Frequency Control
  digest_mode     Boolean  @default(false)  // Bundle notifications
  digest_frequency String  @default("daily") // "realtime", "hourly", "daily"
  quiet_hours     Json     @default("{\"enabled\": false, \"start\": \"22:00\", \"end\": \"08:00\"}")
  
  // Per-Event Overrides
  event_overrides Json     @default("{}")
  
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  @@unique([user_id])
  @@map("notification_preferences")
}
```

### 3.4 NotificationLog Model (Audit Trail)

```prisma
model NotificationLog {
  id              String   @id @default(uuid())
  notification_id String
  
  channel         String   // "email", "sms", "push", "in_app"
  status          String   // "queued", "sent", "delivered", "failed", "bounced"
  
  // Delivery Details
  provider        String?  // "sendgrid", "twilio", etc.
  provider_id     String?  // External message ID
  provider_response Json?
  
  // Timing
  attempted_at    DateTime @default(now())
  completed_at    DateTime?
  
  // Error Tracking
  error_code      String?
  error_message   String?
  
  @@index([notification_id, channel])
  @@index([status, attempted_at])
  @@map("notification_logs")
}
```

---

## 4. Event-Driven Architecture

### 4.1 Platform Events → Notifications Mapping

| Platform Event | Notification Template | Recipients | Channels |
|----------------|----------------------|------------|----------|
| **Escrow Events** |
| `escrow.created` | `ESCROW_CREATED` | Buyer, Seller | In-App, Email |
| `escrow.funded` | `ESCROW_FUNDED` | Seller, Admin | In-App, Email, SMS |
| `escrow.released` | `ESCROW_RELEASED` | Seller | In-App, Email, SMS |
| `escrow.refunded` | `ESCROW_REFUNDED` | Buyer | In-App, Email, SMS |
| **Dispute Events** |
| `dispute.initiated` | `DISPUTE_INITIATED` | Respondent, Admin | In-App, Email |
| `dispute.evidence_uploaded` | `DISPUTE_EVIDENCE_UPLOADED` | Other Party | In-App, Email |
| `dispute.assigned` | `DISPUTE_ASSIGNED` | Assigned Admin | In-App, Email |
| `dispute.resolved` | `DISPUTE_RESOLVED` | Both Parties | In-App, Email, SMS |
| **Verification Events** |
| `verification.requested` | `VERIFICATION_REQUESTED` | User | In-App, Email |
| `verification.approved` | `VERIFICATION_APPROVED` | User | In-App, Email |
| `verification.rejected` | `VERIFICATION_REJECTED` | User | In-App, Email, SMS |
| `verification.expiring_soon` | `VERIFICATION_EXPIRING` | User | In-App, Email |
| **Listing Events** |
| `listing.approved` | `LISTING_APPROVED` | Owner | In-App, Email |
| `listing.rejected` | `LISTING_REJECTED` | Owner | In-App, Email |
| `listing.inquiry` | `LISTING_INQUIRY` | Owner | In-App, Email |
| `listing.favorite` | `LISTING_FAVORITED` | Owner | In-App |
| **Transaction Events** |
| `transaction.created` | `TRANSACTION_CREATED` | Buyer, Seller | In-App, Email |
| `transaction.payment_pending` | `PAYMENT_REMINDER` | Buyer | In-App, Email, SMS |
| `transaction.completed` | `TRANSACTION_COMPLETED` | Buyer, Seller | In-App, Email |

### 4.2 Event Dispatcher Pattern

```typescript
// Event Emitter Service
class EventDispatcher {
  async emit(eventType: string, payload: any) {
    // 1. Log event
    await this.auditService.logEvent(eventType, payload);
    
    // 2. Find matching notification templates
    const templates = await this.getTemplatesForEvent(eventType);
    
    // 3. For each template, create notifications
    for (const template of templates) {
      const recipients = await this.getRecipients(eventType, payload);
      
      for (const recipient of recipients) {
        await this.notificationService.createFromTemplate(
          template.code,
          recipient.id,
          payload
        );
      }
    }
  }
}

// Usage in services
class TransactionService {
  async releaseEscrow(transactionId: string) {
    // ... business logic ...
    
    // Emit event
    await this.eventDispatcher.emit('escrow.released', {
      transaction_id: transactionId,
      seller_id: transaction.seller_id,
      amount: transaction.amount,
      released_at: new Date()
    });
  }
}
```

---

## 5. Template System

### 5.1 Variable Interpolation

Templates use Handlebars-style syntax:

```handlebars
Title: "Escrow Released - {{amount}} {{currency}}"
Message: "Good news! Your escrow of {{amount}} {{currency}} for {{listing_title}} has been released. Funds will arrive in your account within {{settlement_days}} business days."
```

**Available Variables:**
- `{{user.full_name}}` - Recipient name
- `{{amount}}`, `{{currency}}` - Transaction details
- `{{listing_title}}`, `{{listing_id}}` - Listing info
- `{{transaction_id}}` - Transaction reference
- `{{dispute_id}}`, `{{dispute_reason}}` - Dispute details
- `{{verification_scope}}` - Verification type
- `{{admin.full_name}}` - Admin who performed action
- `{{action_url}}` - Deep link to relevant page

### 5.2 Multi-Channel Templates

Each template defines content for multiple channels:

```typescript
{
  code: "ESCROW_RELEASED",
  title_template: "Escrow Released - {{amount}} {{currency}}",
  message_template: "Your escrow has been released...",
  email_subject: "✅ Escrow Released - {{listing_title}}",
  email_body: `
    <h2>Escrow Released</h2>
    <p>Dear {{user.full_name}},</p>
    <p>Your escrow of <strong>{{amount}} {{currency}}</strong> has been released.</p>
    <a href="{{action_url}}">View Transaction</a>
  `,
  sms_body: "FreeLync: Escrow of {{amount}} {{currency}} released. Funds arriving in {{settlement_days}} days."
}
```

---

## 6. Delivery Channels

### 6.1 In-App Notifications
- **Storage**: Database records in `Notification` table
- **Delivery**: Real-time via WebSocket (future) or polling
- **Status**: Marked as `read` when user views

### 6.2 Email
- **Provider**: SendGrid / AWS SES
- **Templates**: HTML with inline CSS
- **Tracking**: Open rates, click rates via tracking pixels
- **Bounce Handling**: Webhook to mark failed deliveries

### 6.3 SMS (Future)
- **Provider**: Twilio / AWS SNS
- **Character Limit**: 160 chars (auto-truncate with link)
- **Cost Control**: Rate limiting, opt-in required
- **Delivery Reports**: Webhook for status updates

### 6.4 Push Notifications (Future)
- **Provider**: Firebase Cloud Messaging
- **Platforms**: Web, iOS, Android
- **Permissions**: User opt-in required

---

## 7. Delivery Workflow

### 7.1 Standard Delivery Flow

```
1. Event Triggered
   ↓
2. Notification Created (status: "pending")
   ↓
3. Check User Preferences
   ↓
4. Apply Channel Filters
   ↓
5. Queue for Delivery
   ↓
6. Send via Channels (parallel)
   ├─→ In-App: Write to DB → status: "sent"
   ├─→ Email: Call SendGrid API → status: "queued"
   └─→ SMS: Call Twilio API → status: "queued"
   ↓
7. Track Delivery Status
   ├─→ Email: Webhook → status: "delivered" / "bounced"
   └─→ SMS: Webhook → status: "delivered" / "failed"
   ↓
8. Retry Failed Deliveries (max 3 attempts)
   ↓
9. Log Final Status
```

### 7.2 Retry Strategy

```typescript
const retryDelays = [5 * 60, 30 * 60, 2 * 60 * 60]; // 5min, 30min, 2hr

async function retryFailedDelivery(notification: Notification) {
  if (notification.retry_count >= notification.max_retries) {
    await markAsPermanentlyFailed(notification);
    return;
  }
  
  const delay = retryDelays[notification.retry_count];
  await scheduleRetry(notification, delay);
}
```

---

## 8. User Preferences

### 8.1 Preference Hierarchy

```
1. Event-Specific Override (highest priority)
   ↓
2. Category Preference (transactional, marketing, system)
   ↓
3. Channel Preference (email, sms, push)
   ↓
4. Global Default (lowest priority)
```

### 8.2 Quiet Hours

```typescript
function shouldDelayForQuietHours(user: User, notification: Notification): boolean {
  const prefs = user.notification_preferences;
  
  if (!prefs.quiet_hours.enabled) return false;
  if (notification.priority === 'urgent') return false; // Always send urgent
  
  const now = new Date();
  const currentHour = now.getHours();
  const quietStart = parseInt(prefs.quiet_hours.start.split(':')[0]);
  const quietEnd = parseInt(prefs.quiet_hours.end.split(':')[0]);
  
  if (currentHour >= quietStart || currentHour < quietEnd) {
    // Schedule for end of quiet hours
    notification.scheduled_for = new Date(now.setHours(quietEnd, 0, 0, 0));
    return true;
  }
  
  return false;
}
```

---

## 9. Bulk & Targeted Messaging

### 9.1 Admin Broadcast

```typescript
interface BroadcastDto {
  title: string;
  message: string;
  target: {
    role?: UserRole[];           // e.g., ["seller", "buyer"]
    verified_only?: boolean;
    trust_score_min?: number;
    created_after?: Date;
  };
  channels: string[];
  priority: NotificationPriority;
  scheduled_for?: Date;
}

async function sendBroadcast(dto: BroadcastDto, adminContext: AdminContext) {
  // 1. Find matching users
  const users = await this.findUsersMatchingCriteria(dto.target);
  
  // 2. Create notifications in batch
  const notifications = users.map(user => ({
    user_id: user.id,
    type: 'system_broadcast',
    title: dto.title,
    message: dto.message,
    priority: dto.priority,
    channels: dto.channels,
    triggered_by_id: adminContext.userId,
    scheduled_for: dto.scheduled_for
  }));
  
  await this.prisma.notification.createMany({ data: notifications });
  
  // 3. Audit log
  await this.auditService.log({
    performedBy: adminContext,
    action: 'notifications.broadcast',
    resourceType: 'Notification',
    metadata: { recipient_count: users.length }
  });
}
```

---

## 10. Analytics & Monitoring

### 10.1 Key Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Email Delivery Rate | > 98% | < 95% |
| SMS Delivery Rate | > 99% | < 97% |
| Avg. Delivery Time | < 30s | > 2min |
| Bounce Rate | < 2% | > 5% |
| User Engagement (Read Rate) | > 60% | < 40% |

### 10.2 Monitoring Dashboard

```typescript
interface NotificationMetrics {
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  delivery_rate: number;
  avg_delivery_time_seconds: number;
  
  by_channel: {
    email: ChannelMetrics;
    sms: ChannelMetrics;
    push: ChannelMetrics;
  };
  
  by_type: {
    [key: string]: TypeMetrics;
  };
}
```

---

## 11. Security & Compliance

### 11.1 Data Privacy
- **PII Protection**: Email/phone numbers encrypted at rest
- **Opt-Out**: One-click unsubscribe for marketing notifications
- **Data Retention**: Auto-delete read notifications after 90 days

### 11.2 Rate Limiting
- **Per User**: Max 50 notifications/day (excluding urgent)
- **Per Channel**: Email: 100/day, SMS: 10/day
- **Broadcast**: Max 10,000 recipients per broadcast

### 11.3 Spam Prevention
- **Deduplication**: Prevent duplicate notifications within 5 minutes
- **Throttling**: Max 1 notification per event type per user per hour
- **User Reports**: Flag templates with high spam reports

---

## 12. API Endpoints

### 12.1 User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | Get my notifications (paginated) |
| PATCH | `/notifications/:id/read` | Mark as read |
| DELETE | `/notifications/:id` | Delete notification |
| GET | `/notifications/preferences` | Get my preferences |
| PATCH | `/notifications/preferences` | Update preferences |

### 12.2 Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/notifications/broadcast` | Send bulk notification |
| GET | `/admin/notifications/templates` | List templates |
| POST | `/admin/notifications/templates` | Create template |
| GET | `/admin/notifications/analytics` | Get delivery metrics |
| POST | `/admin/notifications/test` | Send test notification |

---

## 13. Implementation Checklist

- [x] Existing Notification model (basic)
- [ ] Enhance Notification model with new fields
- [ ] Create NotificationTemplate model
- [ ] Create NotificationPreference model
- [ ] Create NotificationLog model
- [ ] Implement EventDispatcher service
- [ ] Create NotificationTemplateService
- [ ] Enhance NotificationService with template support
- [ ] Implement email delivery (SendGrid integration)
- [ ] Implement SMS delivery (Twilio integration)
- [ ] Create delivery status webhook handlers
- [ ] Implement retry logic
- [ ] Create user preference management
- [ ] Build admin broadcast functionality
- [ ] Create notification analytics dashboard
- [ ] Seed default templates
- [ ] Frontend notification center UI
- [ ] WebSocket real-time delivery

---

## 14. Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Notification Delivery Rate | > 98% | TBD |
| Avg. Time to Delivery | < 30s | TBD |
| User Engagement (Read Rate) | > 60% | TBD |
| Admin Manual Notifications | < 10/day | TBD |
| User Confusion Tickets | < 5/week | TBD |

---

## 15. Conclusion

The Notification & Event System is FreeLync's **automation nervous system**. By treating notifications as first-class platform events rather than cosmetic UI elements, the system:

1. **Reduces manual work** through automated, event-driven communications
2. **Prevents user confusion** with proactive, context-aware messaging
3. **Enforces workflows** by guiding users through complex processes
4. **Provides visibility** into platform state changes
5. **Enables compliance** through comprehensive audit trails

This system is designed for **reliability, extensibility, and operational efficiency**, ensuring every platform state change is communicated clearly, tracked comprehensively, and delivered reliably across multiple channels.
