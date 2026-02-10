# Phase 4: Financial Management & Payout Engine Architecture

**Version:** 1.0  
**Date:** 2026-02-09  
**Status:** Design Complete  
**Criticality:** MAXIMUM - Handles Real Money

---

## 1. Executive Summary

The Financial Management & Payout Engine is FreeLync's **financial nervous system**. It is the most critical subsystem because **errors here mean real money loss, regulatory violations, and platform death**.

### 1.1 Core Principle
**"Money movement is not a feature—it's critical infrastructure."**

This system ensures:
- **Accuracy**: Every cent is accounted for, always
- **Auditability**: Complete financial trail for every transaction
- **Resilience**: Graceful handling of payment failures
- **Compliance**: Tax-ready records and regulatory defensibility
- **Separation**: Escrow ≠ Payout (decoupled by design)

### 1.2 The Rookie Mistake We're Avoiding

❌ **WRONG:** Escrow release → Instant payout to seller
```typescript
// NEVER DO THIS
async releaseEscrow(transactionId) {
  await updateEscrow(transactionId, 'released');
  await sendMoneyToSeller(sellerId, amount); // COUPLED!
}
```

✅ **CORRECT:** Escrow release → Balance credit → Payout request → Admin approval → Payout execution
```typescript
// PROPER SEPARATION
async releaseEscrow(transactionId) {
  // 1. Release escrow (state change only)
  await updateEscrow(transactionId, 'released');
  
  // 2. Credit seller balance (accounting)
  await creditSellerBalance(sellerId, netAmount, transactionId);
  
  // 3. Seller initiates payout when ready (separate flow)
  // 4. Admin approves payout (control layer)
  // 5. Payment processor executes (external system)
}
```

---

## 2. System Architecture

### 2.1 Financial Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    BUYER PAYMENT                            │
│                  (External Gateway)                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  ESCROW HOLDING                             │
│  • Transaction.escrow.is_escrowed = true                    │
│  • Funds held until conditions met                          │
│  • Status: pending → funded → released/refunded             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              COMMISSION CALCULATION                         │
│  • Platform fee: 2-5% of transaction amount                 │
│  • Payment processor fee: 2.9% + $0.30                      │
│  • Net amount = Gross - Commissions                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              SELLER BALANCE LEDGER                          │
│  • LedgerEntry: CREDIT for net amount                       │
│  • Balance updated atomically                               │
│  • Immutable audit trail                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              PAYOUT REQUEST (Seller-Initiated)              │
│  • Seller requests withdrawal                               │
│  • Status: PENDING → APPROVED/REJECTED → PROCESSING         │
│  • Admin approval required                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              PAYOUT EXECUTION                               │
│  • Payment processor API call                               │
│  • Status: PROCESSING → COMPLETED/FAILED                    │
│  • Reconciliation on success/failure                        │
│  • LedgerEntry: DEBIT on success                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Data Model

### 3.1 SellerBalance Model

**Purpose:** Track available and pending balances for each seller.

```prisma
model SellerBalance {
  id                String   @id @default(uuid())
  user_id           String   @unique
  user              User     @relation(fields: [user_id], references: [id])
  
  // Balance Tracking
  available_balance Decimal  @default(0) @db.Decimal(12, 2)  // Can withdraw
  pending_balance   Decimal  @default(0) @db.Decimal(12, 2)  // In escrow/processing
  total_earned      Decimal  @default(0) @db.Decimal(12, 2)  // Lifetime earnings
  total_withdrawn   Decimal  @default(0) @db.Decimal(12, 2)  // Lifetime withdrawals
  
  // Metadata
  currency          String   @default("ETB")
  last_payout_at    DateTime?
  
  // Relations
  ledger_entries    LedgerEntry[]
  payout_requests   PayoutRequest[]
  
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  
  @@map("seller_balances")
}
```

### 3.2 LedgerEntry Model

**Purpose:** Immutable double-entry accounting ledger.

```prisma
enum LedgerEntryType {
  CREDIT              // Money added to balance
  DEBIT               // Money removed from balance
  HOLD                // Money reserved (pending)
  RELEASE_HOLD        // Reserved money released
}

enum LedgerEntrySource {
  ESCROW_RELEASE      // From escrow release
  PAYOUT_COMPLETED    // Payout successful
  PAYOUT_FAILED       // Payout failed (reversal)
  REFUND_ISSUED       // Refund to buyer
  COMMISSION_EARNED   // Platform commission
  ADJUSTMENT          // Manual admin adjustment
}

model LedgerEntry {
  id                String            @id @default(uuid())
  
  // Account Reference
  seller_balance_id String
  seller_balance    SellerBalance     @relation(fields: [seller_balance_id], references: [id])
  
  // Entry Details
  type              LedgerEntryType
  source            LedgerEntrySource
  amount            Decimal           @db.Decimal(12, 2)
  currency          String            @default("ETB")
  
  // Balance Snapshots (for reconciliation)
  balance_before    Decimal           @db.Decimal(12, 2)
  balance_after     Decimal           @db.Decimal(12, 2)
  
  // References
  transaction_id    String?           // Source transaction
  transaction       Transaction?      @relation(fields: [transaction_id], references: [id])
  payout_request_id String?           // Related payout
  payout_request    PayoutRequest?    @relation(fields: [payout_request_id], references: [id])
  
  // Metadata
  description       String
  metadata          Json              @default("{}")
  
  // Audit
  created_by_id     String?
  created_by        User?             @relation("LedgerCreator", fields: [created_by_id], references: [id])
  
  created_at        DateTime          @default(now())
  
  @@index([seller_balance_id, created_at])
  @@index([transaction_id])
  @@index([payout_request_id])
  @@map("ledger_entries")
}
```

### 3.3 PayoutRequest Model

**Purpose:** Seller-initiated withdrawal requests with admin approval.

```prisma
enum PayoutRequestStatus {
  PENDING           // Awaiting admin approval
  APPROVED          // Admin approved, ready for processing
  REJECTED          // Admin rejected
  PROCESSING        // Payment in progress
  COMPLETED         // Successfully paid out
  FAILED            // Payment failed
  CANCELLED         // Cancelled by seller/admin
}

model PayoutRequest {
  id                String              @id @default(uuid())
  
  // Seller Reference
  seller_id         String
  seller            User                @relation("SellerPayouts", fields: [seller_id], references: [id])
  seller_balance_id String
  seller_balance    SellerBalance       @relation(fields: [seller_balance_id], references: [id])
  
  // Payout Details
  amount            Decimal             @db.Decimal(12, 2)
  currency          String              @default("ETB")
  status            PayoutRequestStatus @default(PENDING)
  
  // Payment Method
  payment_method    String              // "bank_transfer", "mobile_money"
  payment_details   Json                // Encrypted bank/mobile details
  
  // Approval Workflow
  requested_at      DateTime            @default(now())
  approved_at       DateTime?
  approved_by_id    String?
  approved_by       User?               @relation("PayoutApprover", fields: [approved_by_id], references: [id])
  
  rejected_at       DateTime?
  rejected_by_id    String?
  rejected_by       User?               @relation("PayoutRejecter", fields: [rejected_by_id], references: [id])
  rejection_reason  String?
  
  // Processing
  processing_started_at DateTime?
  completed_at      DateTime?
  failed_at         DateTime?
  failure_reason    String?
  
  // External Provider
  provider          String?             // "stripe", "paypal", "chapa"
  provider_payout_id String?            // External reference
  provider_response Json?
  
  // Reconciliation
  reconciled        Boolean             @default(false)
  reconciled_at     DateTime?
  reconciled_by_id  String?
  reconciled_by     User?               @relation("PayoutReconciler", fields: [reconciled_by_id], references: [id])
  
  // Retry Logic
  retry_count       Int                 @default(0)
  max_retries       Int                 @default(3)
  next_retry_at     DateTime?
  
  // Metadata
  notes             String?
  metadata          Json                @default("{}")
  
  // Relations
  ledger_entries    LedgerEntry[]
  
  created_at        DateTime            @default(now())
  updated_at        DateTime            @updatedAt
  
  @@index([seller_id, status])
  @@index([status, requested_at])
  @@map("payout_requests")
}
```

### 3.4 CommissionRecord Model

**Purpose:** Track platform and payment processor fees.

```prisma
model CommissionRecord {
  id                String      @id @default(uuid())
  
  // Transaction Reference
  transaction_id    String      @unique
  transaction       Transaction @relation(fields: [transaction_id], references: [id])
  
  // Amounts
  gross_amount      Decimal     @db.Decimal(12, 2)  // Total transaction amount
  platform_fee      Decimal     @db.Decimal(12, 2)  // FreeLync commission
  platform_fee_pct  Decimal     @db.Decimal(5, 2)   // Percentage (e.g., 2.50)
  processor_fee     Decimal     @db.Decimal(12, 2)  // Payment gateway fee
  net_amount        Decimal     @db.Decimal(12, 2)  // Amount to seller
  
  currency          String      @default("ETB")
  
  // Calculation Details
  calculation_method String     // "percentage", "tiered", "flat"
  calculation_metadata Json     @default("{}")
  
  // Audit
  calculated_at     DateTime    @default(now())
  
  @@map("commission_records")
}
```

### 3.5 RefundRecord Model

**Purpose:** Track refunds with proper accounting reversals.

```prisma
enum RefundStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

model RefundRecord {
  id                String        @id @default(uuid())
  
  // Transaction Reference
  transaction_id    String
  transaction       Transaction   @relation(fields: [transaction_id], references: [id])
  
  // Refund Details
  amount            Decimal       @db.Decimal(12, 2)
  currency          String        @default("ETB")
  status            RefundStatus  @default(PENDING)
  
  // Reason
  reason            String
  initiated_by_id   String
  initiated_by      User          @relation("RefundInitiator", fields: [initiated_by_id], references: [id])
  
  // Commission Reversal
  reverse_platform_fee Boolean    @default(true)
  reversed_fee      Decimal?      @db.Decimal(12, 2)
  
  // Processing
  processed_at      DateTime?
  failed_at         DateTime?
  failure_reason    String?
  
  // External Provider
  provider          String?
  provider_refund_id String?
  provider_response Json?
  
  // Metadata
  metadata          Json          @default("{}")
  
  created_at        DateTime      @default(now())
  updated_at        DateTime      @updatedAt
  
  @@index([transaction_id])
  @@map("refund_records")
}
```

### 3.6 FinancialReport Model

**Purpose:** Pre-generated financial reports for export.

```prisma
enum ReportType {
  DAILY_SUMMARY
  MONTHLY_SUMMARY
  SELLER_STATEMENT
  TAX_REPORT
  COMMISSION_REPORT
  RECONCILIATION_REPORT
}

model FinancialReport {
  id                String      @id @default(uuid())
  
  type              ReportType
  period_start      DateTime
  period_end        DateTime
  
  // Scope
  seller_id         String?     // For seller-specific reports
  seller            User?       @relation("SellerReports", fields: [seller_id], references: [id])
  
  // Report Data
  summary           Json        // High-level metrics
  details           Json        // Detailed breakdown
  
  // Export
  file_url          String?     // S3/storage URL
  file_format       String?     // "pdf", "csv", "excel"
  
  // Generation
  generated_at      DateTime    @default(now())
  generated_by_id   String?
  generated_by      User?       @relation("ReportGenerator", fields: [generated_by_id], references: [id])
  
  @@index([type, period_start])
  @@index([seller_id, period_start])
  @@map("financial_reports")
}
```

---

## 4. Financial Workflows

### 4.1 Escrow Release → Balance Credit

**Trigger:** Admin releases escrow after successful transaction.

```typescript
async function releaseEscrow(transactionId: string, adminContext: AdminContext) {
  return await prisma.$transaction(async (tx) => {
    // 1. Get transaction with commission
    const transaction = await tx.transaction.findUnique({
      where: { id: transactionId },
      include: { commission_record: true }
    });
    
    if (!transaction.commission_record) {
      throw new Error('Commission not calculated');
    }
    
    // 2. Update escrow status
    await tx.transaction.update({
      where: { id: transactionId },
      data: {
        escrow: {
          ...transaction.escrow,
          is_escrowed: false,
          released_at: new Date()
        }
      }
    });
    
    // 3. Get or create seller balance
    const sellerBalance = await tx.sellerBalance.upsert({
      where: { user_id: transaction.seller_id },
      create: {
        user_id: transaction.seller_id,
        available_balance: 0,
        pending_balance: 0
      },
      update: {}
    });
    
    // 4. Calculate net amount (already in commission record)
    const netAmount = transaction.commission_record.net_amount;
    
    // 5. Create ledger entry (CREDIT)
    await tx.ledgerEntry.create({
      data: {
        seller_balance_id: sellerBalance.id,
        type: 'CREDIT',
        source: 'ESCROW_RELEASE',
        amount: netAmount,
        balance_before: sellerBalance.available_balance,
        balance_after: sellerBalance.available_balance.add(netAmount),
        transaction_id: transactionId,
        description: `Escrow released for transaction ${transactionId}`,
        created_by_id: adminContext.userId
      }
    });
    
    // 6. Update seller balance
    await tx.sellerBalance.update({
      where: { id: sellerBalance.id },
      data: {
        available_balance: { increment: netAmount },
        total_earned: { increment: netAmount }
      }
    });
    
    // 7. Emit event for notification
    await eventDispatcher.emit('escrow.released', {
      transaction_id: transactionId,
      seller_id: transaction.seller_id,
      amount: netAmount,
      currency: transaction.currency
    });
    
    return { success: true, netAmount };
  });
}
```

### 4.2 Payout Request → Approval → Execution

**Step 1: Seller Initiates Payout**

```typescript
async function requestPayout(
  sellerId: string,
  amount: Decimal,
  paymentMethod: string,
  paymentDetails: any
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Get seller balance
    const balance = await tx.sellerBalance.findUnique({
      where: { user_id: sellerId }
    });
    
    // 2. Validate sufficient balance
    if (balance.available_balance.lessThan(amount)) {
      throw new Error('Insufficient balance');
    }
    
    // 3. Minimum payout check
    if (amount.lessThan(100)) { // Min 100 ETB
      throw new Error('Minimum payout is 100 ETB');
    }
    
    // 4. Create payout request
    const payoutRequest = await tx.payoutRequest.create({
      data: {
        seller_id: sellerId,
        seller_balance_id: balance.id,
        amount,
        payment_method: paymentMethod,
        payment_details: encrypt(paymentDetails), // Encrypt sensitive data
        status: 'PENDING'
      }
    });
    
    // 5. Hold funds (move from available to pending)
    await tx.ledgerEntry.create({
      data: {
        seller_balance_id: balance.id,
        type: 'HOLD',
        source: 'PAYOUT_REQUESTED',
        amount,
        balance_before: balance.available_balance,
        balance_after: balance.available_balance.sub(amount),
        payout_request_id: payoutRequest.id,
        description: `Payout request ${payoutRequest.id}`
      }
    });
    
    await tx.sellerBalance.update({
      where: { id: balance.id },
      data: {
        available_balance: { decrement: amount },
        pending_balance: { increment: amount }
      }
    });
    
    // 6. Notify admins
    await eventDispatcher.emit('payout.requested', {
      payout_request_id: payoutRequest.id,
      seller_id: sellerId,
      amount
    });
    
    return payoutRequest;
  });
}
```

**Step 2: Admin Approves/Rejects**

```typescript
async function approvePayout(
  payoutRequestId: string,
  adminContext: AdminContext
) {
  return await prisma.$transaction(async (tx) => {
    const payout = await tx.payoutRequest.findUnique({
      where: { id: payoutRequestId },
      include: { seller_balance: true }
    });
    
    if (payout.status !== 'PENDING') {
      throw new Error('Payout not in pending state');
    }
    
    // Update status
    await tx.payoutRequest.update({
      where: { id: payoutRequestId },
      data: {
        status: 'APPROVED',
        approved_at: new Date(),
        approved_by_id: adminContext.userId
      }
    });
    
    // Audit log
    await auditService.log({
      performedBy: adminContext,
      action: 'payout.approved',
      resourceType: 'PayoutRequest',
      resourceId: payoutRequestId,
      riskLevel: 'high'
    });
    
    // Trigger processing (async job)
    await payoutQueue.add('process-payout', { payoutRequestId });
    
    return { success: true };
  });
}

async function rejectPayout(
  payoutRequestId: string,
  reason: string,
  adminContext: AdminContext
) {
  return await prisma.$transaction(async (tx) => {
    const payout = await tx.payoutRequest.findUnique({
      where: { id: payoutRequestId },
      include: { seller_balance: true }
    });
    
    // Update status
    await tx.payoutRequest.update({
      where: { id: payoutRequestId },
      data: {
        status: 'REJECTED',
        rejected_at: new Date(),
        rejected_by_id: adminContext.userId,
        rejection_reason: reason
      }
    });
    
    // Release held funds
    await tx.ledgerEntry.create({
      data: {
        seller_balance_id: payout.seller_balance_id,
        type: 'RELEASE_HOLD',
        source: 'PAYOUT_REJECTED',
        amount: payout.amount,
        balance_before: payout.seller_balance.available_balance,
        balance_after: payout.seller_balance.available_balance.add(payout.amount),
        payout_request_id: payoutRequestId,
        description: `Payout rejected: ${reason}`,
        created_by_id: adminContext.userId
      }
    });
    
    await tx.sellerBalance.update({
      where: { id: payout.seller_balance_id },
      data: {
        available_balance: { increment: payout.amount },
        pending_balance: { decrement: payout.amount }
      }
    });
    
    // Notify seller
    await eventDispatcher.emit('payout.rejected', {
      payout_request_id: payoutRequestId,
      seller_id: payout.seller_id,
      reason
    });
    
    return { success: true };
  });
}
```

**Step 3: Execute Payout (Background Job)**

```typescript
async function executePayout(payoutRequestId: string) {
  const payout = await prisma.payoutRequest.findUnique({
    where: { id: payoutRequestId },
    include: { seller_balance: true, seller: true }
  });
  
  if (payout.status !== 'APPROVED') {
    throw new Error('Payout not approved');
  }
  
  try {
    // Update status to processing
    await prisma.payoutRequest.update({
      where: { id: payoutRequestId },
      data: {
        status: 'PROCESSING',
        processing_started_at: new Date()
      }
    });
    
    // Call payment provider
    const result = await paymentProvider.transfer({
      amount: payout.amount,
      currency: payout.currency,
      destination: decrypt(payout.payment_details),
      reference: payoutRequestId
    });
    
    if (result.success) {
      // Success: Complete payout
      await completePayout(payoutRequestId, result);
    } else {
      // Failure: Handle error
      await failPayout(payoutRequestId, result.error);
    }
    
  } catch (error) {
    await failPayout(payoutRequestId, error.message);
  }
}

async function completePayout(payoutRequestId: string, providerResult: any) {
  return await prisma.$transaction(async (tx) => {
    const payout = await tx.payoutRequest.findUnique({
      where: { id: payoutRequestId },
      include: { seller_balance: true }
    });
    
    // 1. Update payout status
    await tx.payoutRequest.update({
      where: { id: payoutRequestId },
      data: {
        status: 'COMPLETED',
        completed_at: new Date(),
        provider_payout_id: providerResult.id,
        provider_response: providerResult
      }
    });
    
    // 2. Create ledger entry (DEBIT)
    await tx.ledgerEntry.create({
      data: {
        seller_balance_id: payout.seller_balance_id,
        type: 'DEBIT',
        source: 'PAYOUT_COMPLETED',
        amount: payout.amount,
        balance_before: payout.seller_balance.pending_balance,
        balance_after: payout.seller_balance.pending_balance.sub(payout.amount),
        payout_request_id: payoutRequestId,
        description: `Payout completed: ${providerResult.id}`
      }
    });
    
    // 3. Update seller balance
    await tx.sellerBalance.update({
      where: { id: payout.seller_balance_id },
      data: {
        pending_balance: { decrement: payout.amount },
        total_withdrawn: { increment: payout.amount },
        last_payout_at: new Date()
      }
    });
    
    // 4. Notify seller
    await eventDispatcher.emit('payout.completed', {
      payout_request_id: payoutRequestId,
      seller_id: payout.seller_id,
      amount: payout.amount
    });
  });
}

async function failPayout(payoutRequestId: string, errorMessage: string) {
  return await prisma.$transaction(async (tx) => {
    const payout = await tx.payoutRequest.findUnique({
      where: { id: payoutRequestId },
      include: { seller_balance: true }
    });
    
    // Check retry count
    const shouldRetry = payout.retry_count < payout.max_retries;
    
    if (shouldRetry) {
      // Schedule retry
      const nextRetryAt = new Date(Date.now() + Math.pow(2, payout.retry_count) * 60000);
      
      await tx.payoutRequest.update({
        where: { id: payoutRequestId },
        data: {
          status: 'APPROVED', // Back to approved for retry
          retry_count: { increment: 1 },
          next_retry_at: nextRetryAt,
          failure_reason: errorMessage
        }
      });
      
      await payoutQueue.add('process-payout', { payoutRequestId }, {
        delay: Math.pow(2, payout.retry_count) * 60000
      });
      
    } else {
      // Max retries reached: Fail permanently
      await tx.payoutRequest.update({
        where: { id: payoutRequestId },
        data: {
          status: 'FAILED',
          failed_at: new Date(),
          failure_reason: errorMessage
        }
      });
      
      // Release held funds back to available
      await tx.ledgerEntry.create({
        data: {
          seller_balance_id: payout.seller_balance_id,
          type: 'RELEASE_HOLD',
          source: 'PAYOUT_FAILED',
          amount: payout.amount,
          balance_before: payout.seller_balance.available_balance,
          balance_after: payout.seller_balance.available_balance.add(payout.amount),
          payout_request_id: payoutRequestId,
          description: `Payout failed: ${errorMessage}`
        }
      });
      
      await tx.sellerBalance.update({
        where: { id: payout.seller_balance_id },
        data: {
          available_balance: { increment: payout.amount },
          pending_balance: { decrement: payout.amount }
        }
      });
      
      // Notify seller and admins
      await eventDispatcher.emit('payout.failed', {
        payout_request_id: payoutRequestId,
        seller_id: payout.seller_id,
        error: errorMessage
      });
    }
  });
}
```

### 4.3 Refund Processing

```typescript
async function processRefund(
  transactionId: string,
  amount: Decimal,
  reason: string,
  adminContext: AdminContext
) {
  return await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.findUnique({
      where: { id: transactionId },
      include: { commission_record: true }
    });
    
    // 1. Create refund record
    const refund = await tx.refundRecord.create({
      data: {
        transaction_id: transactionId,
        amount,
        reason,
        initiated_by_id: adminContext.userId,
        status: 'PENDING'
      }
    });
    
    // 2. If escrow was released, reverse seller balance
    if (!transaction.escrow.is_escrowed) {
      const sellerBalance = await tx.sellerBalance.findUnique({
        where: { user_id: transaction.seller_id }
      });
      
      // Debit seller balance
      await tx.ledgerEntry.create({
        data: {
          seller_balance_id: sellerBalance.id,
          type: 'DEBIT',
          source: 'REFUND_ISSUED',
          amount,
          balance_before: sellerBalance.available_balance,
          balance_after: sellerBalance.available_balance.sub(amount),
          transaction_id: transactionId,
          description: `Refund issued: ${reason}`,
          created_by_id: adminContext.userId
        }
      });
      
      await tx.sellerBalance.update({
        where: { id: sellerBalance.id },
        data: {
          available_balance: { decrement: amount }
        }
      });
    }
    
    // 3. Process refund via payment provider
    try {
      const result = await paymentProvider.refund({
        transaction_id: transactionId,
        amount,
        reason
      });
      
      await tx.refundRecord.update({
        where: { id: refund.id },
        data: {
          status: 'COMPLETED',
          processed_at: new Date(),
          provider_refund_id: result.id,
          provider_response: result
        }
      });
      
    } catch (error) {
      await tx.refundRecord.update({
        where: { id: refund.id },
        data: {
          status: 'FAILED',
          failed_at: new Date(),
          failure_reason: error.message
        }
      });
      
      throw error;
    }
    
    return refund;
  });
}
```

---

## 5. Commission Calculation

### 5.1 Tiered Commission Structure

```typescript
interface CommissionTier {
  min: number;
  max: number;
  rate: number;
}

const COMMISSION_TIERS: CommissionTier[] = [
  { min: 0, max: 10000, rate: 0.05 },      // 5% for 0-10k
  { min: 10001, max: 50000, rate: 0.03 },  // 3% for 10k-50k
  { min: 50001, max: Infinity, rate: 0.02 } // 2% for 50k+
];

function calculateCommission(grossAmount: Decimal): CommissionCalculation {
  const amount = grossAmount.toNumber();
  
  // Find applicable tier
  const tier = COMMISSION_TIERS.find(t => amount >= t.min && amount <= t.max);
  
  // Platform fee
  const platformFee = grossAmount.mul(tier.rate);
  
  // Payment processor fee (e.g., Stripe: 2.9% + $0.30)
  const processorFee = grossAmount.mul(0.029).add(0.30);
  
  // Net amount
  const netAmount = grossAmount.sub(platformFee).sub(processorFee);
  
  return {
    gross_amount: grossAmount,
    platform_fee: platformFee,
    platform_fee_pct: new Decimal(tier.rate * 100),
    processor_fee: processorFee,
    net_amount: netAmount,
    calculation_method: 'tiered'
  };
}

async function recordCommission(transactionId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId }
  });
  
  const commission = calculateCommission(transaction.amount);
  
  return prisma.commissionRecord.create({
    data: {
      transaction_id: transactionId,
      ...commission,
      currency: transaction.currency
    }
  });
}
```

---

## 6. Financial Reports

### 6.1 Seller Statement

```typescript
async function generateSellerStatement(
  sellerId: string,
  periodStart: Date,
  periodEnd: Date
) {
  // Get all ledger entries for period
  const entries = await prisma.ledgerEntry.findMany({
    where: {
      seller_balance: { user_id: sellerId },
      created_at: { gte: periodStart, lte: periodEnd }
    },
    include: {
      transaction: true,
      payout_request: true
    },
    orderBy: { created_at: 'asc' }
  });
  
  // Calculate summary
  const summary = {
    opening_balance: entries[0]?.balance_before || 0,
    closing_balance: entries[entries.length - 1]?.balance_after || 0,
    total_credits: entries
      .filter(e => e.type === 'CREDIT')
      .reduce((sum, e) => sum.add(e.amount), new Decimal(0)),
    total_debits: entries
      .filter(e => e.type === 'DEBIT')
      .reduce((sum, e) => sum.add(e.amount), new Decimal(0)),
    total_transactions: entries.filter(e => e.transaction_id).length,
    total_payouts: entries.filter(e => e.payout_request_id).length
  };
  
  // Create report
  return prisma.financialReport.create({
    data: {
      type: 'SELLER_STATEMENT',
      seller_id: sellerId,
      period_start: periodStart,
      period_end: periodEnd,
      summary,
      details: { entries }
    }
  });
}
```

### 6.2 Tax Report

```typescript
async function generateTaxReport(
  sellerId: string,
  taxYear: number
) {
  const periodStart = new Date(taxYear, 0, 1);
  const periodEnd = new Date(taxYear, 11, 31, 23, 59, 59);
  
  // Get all completed transactions
  const transactions = await prisma.transaction.findMany({
    where: {
      seller_id: sellerId,
      status: 'completed',
      created_at: { gte: periodStart, lte: periodEnd }
    },
    include: {
      commission_record: true,
      listing: true
    }
  });
  
  // Calculate tax summary
  const taxSummary = {
    tax_year: taxYear,
    total_gross_income: transactions.reduce(
      (sum, t) => sum.add(t.commission_record.gross_amount),
      new Decimal(0)
    ),
    total_platform_fees: transactions.reduce(
      (sum, t) => sum.add(t.commission_record.platform_fee),
      new Decimal(0)
    ),
    total_net_income: transactions.reduce(
      (sum, t) => sum.add(t.commission_record.net_amount),
      new Decimal(0)
    ),
    transaction_count: transactions.length,
    transactions_by_category: groupBy(transactions, t => t.listing.category)
  };
  
  return prisma.financialReport.create({
    data: {
      type: 'TAX_REPORT',
      seller_id: sellerId,
      period_start: periodStart,
      period_end: periodEnd,
      summary: taxSummary,
      details: { transactions }
    }
  });
}
```

---

## 7. Reconciliation

### 7.1 Daily Reconciliation

```typescript
async function reconcileDaily(date: Date) {
  // 1. Sum all ledger entries for the day
  const ledgerTotal = await prisma.ledgerEntry.aggregate({
    where: {
      created_at: {
        gte: startOfDay(date),
        lte: endOfDay(date)
      }
    },
    _sum: {
      amount: true
    }
  });
  
  // 2. Sum all seller balances
  const balanceTotal = await prisma.sellerBalance.aggregate({
    _sum: {
      available_balance: true,
      pending_balance: true
    }
  });
  
  // 3. Compare with expected
  const expected = balanceTotal._sum.available_balance.add(
    balanceTotal._sum.pending_balance
  );
  
  const discrepancy = expected.sub(ledgerTotal._sum.amount);
  
  if (!discrepancy.equals(0)) {
    // Alert admins of discrepancy
    await eventDispatcher.emit('reconciliation.discrepancy', {
      date,
      expected,
      actual: ledgerTotal._sum.amount,
      discrepancy
    });
  }
  
  return {
    date,
    expected,
    actual: ledgerTotal._sum.amount,
    discrepancy,
    status: discrepancy.equals(0) ? 'BALANCED' : 'DISCREPANCY'
  };
}
```

---

## 8. Security & Compliance

### 8.1 Data Protection
- **Encryption**: Payment details encrypted at rest (AES-256)
- **PCI Compliance**: Never store full card numbers
- **Access Control**: Financial operations require high-level permissions

### 8.2 Audit Trail
- Every ledger entry is immutable
- All payout approvals/rejections logged
- Admin actions audited with IP and timestamp

### 8.3 Fraud Prevention
- **Minimum payout**: 100 ETB
- **Maximum daily payout**: 100,000 ETB per seller
- **Velocity checks**: Max 3 payouts per day
- **Anomaly detection**: Flag unusual patterns

---

## 9. API Endpoints

### 9.1 Seller Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/financial/balance` | Get my balance |
| GET | `/financial/ledger` | Get ledger history |
| POST | `/financial/payout/request` | Request payout |
| GET | `/financial/payouts` | Get my payout requests |
| GET | `/financial/reports/statement` | Generate statement |
| GET | `/financial/reports/tax` | Generate tax report |

### 9.2 Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/financial/payouts` | Get all payout requests |
| PATCH | `/admin/financial/payouts/:id/approve` | Approve payout |
| PATCH | `/admin/financial/payouts/:id/reject` | Reject payout |
| POST | `/admin/financial/refunds` | Process refund |
| GET | `/admin/financial/reconciliation` | Run reconciliation |
| GET | `/admin/financial/reports` | Generate reports |

---

## 10. Success Metrics

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Ledger Accuracy | 100% | < 99.99% |
| Payout Success Rate | > 95% | < 90% |
| Reconciliation Discrepancy | 0 ETB | > 1 ETB |
| Avg. Payout Approval Time | < 24 hours | > 48 hours |
| Failed Payout Recovery | > 98% | < 95% |

---

## 11. Implementation Checklist

- [ ] Database schema migration
- [ ] SellerBalance and LedgerEntry models
- [ ] PayoutRequest workflow
- [ ] Commission calculation service
- [ ] Refund processing
- [ ] Financial reports generation
- [ ] Reconciliation cron job
- [ ] Payment provider integration
- [ ] Admin approval UI
- [ ] Seller dashboard
- [ ] Export functionality (PDF, CSV)
- [ ] Fraud detection rules
- [ ] Audit logging
- [ ] Tax report templates

---

## 12. Conclusion

The Financial Management & Payout Engine is FreeLync's **most critical subsystem**. By treating money movement as critical infrastructure with:

1. **Proper separation** of escrow and payout logic
2. **Immutable ledger** for complete audit trail
3. **Admin approval** workflow for control
4. **Reconciliation** for accuracy verification
5. **Tax-ready reports** for compliance

We ensure that **every cent is accounted for, every transaction is traceable, and every financial operation is defensible under audit**.

This system is designed for **financial correctness above all else**—because in financial systems, mistakes are not bugs, they're **money loss and regulatory violations**.
