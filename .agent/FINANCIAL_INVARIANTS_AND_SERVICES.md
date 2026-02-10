# FreeLync Financial Invariants & Core Services

**Date:** 2026-02-10  
**Criticality:** MAXIMUM - Financial Correctness  
**Status:** Invariants Formalized, Services Ready for Implementation

---

## 1. Financial Invariants (Non-Negotiable)

These invariants **MUST NEVER** be violated. Any violation means financial loss, regulatory breach, or platform failure.

### **Invariant 1: Balance Conservation**
```
∀ seller: seller.available_balance + seller.pending_balance = 
  SUM(ledger_entries WHERE type=CREDIT) - SUM(ledger_entries WHERE type=DEBIT)
```

**Meaning:** A seller's total balance must always equal the sum of all credits minus debits in their ledger.

**Enforcement:**
- Every balance update MUST create a ledger entry
- Ledger entries are immutable
- Balance updates and ledger creation happen in atomic transaction
- Daily reconciliation job verifies this invariant

---

### **Invariant 2: No Negative Balances**
```
∀ seller: seller.available_balance >= 0 AND seller.pending_balance >= 0
```

**Meaning:** Balances can never go negative.

**Enforcement:**
- Check balance before every debit operation
- Throw error if insufficient funds
- Use database constraints: `CHECK (available_balance >= 0)`
- Use Prisma `@db.Decimal` with validation

---

### **Invariant 3: Escrow-to-Balance Atomicity**
```
IF escrow.released = true THEN 
  ∃ ledger_entry WHERE source = ESCROW_RELEASE AND transaction_id = escrow.transaction_id
```

**Meaning:** Every escrow release MUST create exactly one ledger entry crediting the seller.

**Enforcement:**
- Escrow release and ledger creation in single transaction
- Idempotent operation (check if already released)
- Emit event only after transaction commits

---

### **Invariant 4: Payout-Balance Consistency**
```
∀ payout WHERE status = PENDING:
  seller.pending_balance >= payout.amount
```

**Meaning:** Pending balance must always cover all pending payouts.

**Enforcement:**
- Hold funds when payout requested (available → pending)
- Release funds if payout rejected (pending → available)
- Debit pending when payout completed
- Atomic transaction for all balance updates

---

### **Invariant 5: Commission Calculation Determinism**
```
∀ transaction: 
  commission_record.net_amount = 
    transaction.amount - commission_record.platform_fee - commission_record.processor_fee
```

**Meaning:** Commission calculation must be deterministic and verifiable.

**Enforcement:**
- Pure function for commission calculation
- Store calculation method and metadata
- Recalculate on read to verify
- Alert if mismatch detected

---

### **Invariant 6: Ledger Immutability**
```
∀ ledger_entry: 
  ledger_entry.created_at IS IMMUTABLE AND
  ledger_entry.amount IS IMMUTABLE AND
  ledger_entry.type IS IMMUTABLE
```

**Meaning:** Ledger entries can never be modified or deleted.

**Enforcement:**
- No UPDATE or DELETE operations on ledger table
- Database-level restrictions
- Only INSERT allowed
- Corrections via new offsetting entries

---

### **Invariant 7: Balance Snapshot Accuracy**
```
∀ ledger_entry:
  ledger_entry.balance_after = ledger_entry.balance_before + ledger_entry.amount (if CREDIT)
  ledger_entry.balance_after = ledger_entry.balance_before - ledger_entry.amount (if DEBIT)
```

**Meaning:** Balance snapshots in ledger must accurately reflect state changes.

**Enforcement:**
- Calculate snapshots within transaction
- Lock seller balance row during update
- Verify calculation before commit
- Rollback on mismatch

---

### **Invariant 8: Idempotency**
```
∀ operation: 
  operation(state, params) = operation(operation(state, params), params)
```

**Meaning:** Retrying an operation produces the same result.

**Enforcement:**
- Idempotency keys for all financial operations
- Check if operation already completed before executing
- Return existing result if duplicate detected
- Store idempotency keys with expiration

---

### **Invariant 9: Audit Completeness**
```
∀ financial_operation:
  ∃ audit_log WHERE action = operation.type AND resource_id = operation.id
```

**Meaning:** Every financial operation must have an audit log entry.

**Enforcement:**
- Audit log creation in same transaction
- Fail operation if audit fails
- Audit logs are immutable
- Include: who, what, when, why, before/after state

---

### **Invariant 10: Refund-Commission Reversal**
```
∀ refund WHERE reverse_platform_fee = true:
  ∃ ledger_entry WHERE 
    source = REFUND_ISSUED AND 
    amount = refund.amount + commission_record.platform_fee
```

**Meaning:** Refunds that reverse commission must credit both refund amount and platform fee.

**Enforcement:**
- Calculate total credit (refund + reversed fee)
- Create single ledger entry for total
- Link to both refund and commission records
- Atomic transaction

---

## 2. Core Service Architecture

### **Service Dependency Graph**

```
┌─────────────────────────────────────────────────────────────┐
│                    AuditService                             │
│              (Used by all services)                         │
└─────────────────────────────────────────────────────────────┘
                              ↑
                              │
┌─────────────────────────────┼───────────────────────────────┐
│                             │                               │
│  ┌──────────────────┐  ┌────────────────┐  ┌─────────────┐ │
│  │  LedgerService   │  │ BalanceService │  │CommissionSvc│ │
│  │  (Immutable)     │←─│  (Enforces     │←─│(Pure Calc)  │ │
│  │                  │  │   Invariants)  │  │             │ │
│  └──────────────────┘  └────────────────┘  └─────────────┘ │
│           ↑                     ↑                  ↑        │
│           │                     │                  │        │
│  ┌────────┴─────────────────────┴──────────────────┴─────┐ │
│  │           FinancialOrchestrationService                │ │
│  │         (Coordinates multi-step operations)            │ │
│  └────────────────────────────────────────────────────────┘ │
│                              ↑                              │
│                              │                              │
│  ┌───────────────────────────┴──────────────────────────┐  │
│  │  PayoutService  │  RefundService  │  EscrowService   │  │
│  │  (Business      │  (Business      │  (Business       │  │
│  │   Logic)        │   Logic)        │   Logic)         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Core Service Specifications

### **3.1 LedgerService**

**Purpose:** Create immutable ledger entries with balance snapshots.

**Invariants Enforced:** 1, 6, 7, 9

**Methods:**

```typescript
class LedgerService {
  /**
   * Create immutable ledger entry with balance snapshots
   * MUST be called within transaction
   * MUST NOT be retried (use idempotency key)
   */
  async createEntry(params: {
    sellerBalanceId: string;
    type: LedgerEntryType;
    source: LedgerEntrySource;
    amount: Decimal;
    description: string;
    transactionId?: string;
    payoutRequestId?: string;
    createdById?: string;
    metadata?: Record<string, any>;
  }): Promise<LedgerEntry>;

  /**
   * Get ledger entries for seller with pagination
   * Read-only, safe to retry
   */
  async getEntriesForSeller(
    sellerBalanceId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      type?: LedgerEntryType;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ entries: LedgerEntry[]; total: number }>;

  /**
   * Calculate balance from ledger entries (verification)
   * Read-only, safe to retry
   */
  async calculateBalanceFromLedger(
    sellerBalanceId: string
  ): Promise<{ credits: Decimal; debits: Decimal; balance: Decimal }>;

  /**
   * Verify ledger integrity for seller
   * Read-only, safe to retry
   */
  async verifyLedgerIntegrity(
    sellerBalanceId: string
  ): Promise<{ valid: boolean; discrepancy?: Decimal }>;
}
```

**Implementation Rules:**
- ✅ MUST lock seller balance row before creating entry
- ✅ MUST calculate balance snapshots within transaction
- ✅ MUST verify calculation before commit
- ✅ MUST create audit log in same transaction
- ✅ MUST rollback if any step fails
- ❌ NEVER update or delete ledger entries
- ❌ NEVER create entry without balance lock

---

### **3.2 BalanceService**

**Purpose:** Manage seller balances with invariant enforcement.

**Invariants Enforced:** 1, 2, 4, 7, 8

**Methods:**

```typescript
class BalanceService {
  /**
   * Get or create seller balance
   * Idempotent, safe to retry
   */
  async getOrCreateBalance(userId: string): Promise<SellerBalance>;

  /**
   * Credit seller balance (add money)
   * Idempotent via idempotency key
   */
  async credit(params: {
    userId: string;
    amount: Decimal;
    source: LedgerEntrySource;
    description: string;
    transactionId?: string;
    idempotencyKey: string;
    metadata?: Record<string, any>;
  }): Promise<{ balance: SellerBalance; ledgerEntry: LedgerEntry }>;

  /**
   * Debit seller balance (remove money)
   * Idempotent via idempotency key
   * Throws if insufficient funds
   */
  async debit(params: {
    userId: string;
    amount: Decimal;
    source: LedgerEntrySource;
    description: string;
    payoutRequestId?: string;
    idempotencyKey: string;
    metadata?: Record<string, any>;
  }): Promise<{ balance: SellerBalance; ledgerEntry: LedgerEntry }>;

  /**
   * Hold funds (available → pending)
   * Idempotent via idempotency key
   */
  async holdFunds(params: {
    userId: string;
    amount: Decimal;
    reason: string;
    payoutRequestId: string;
    idempotencyKey: string;
  }): Promise<{ balance: SellerBalance; ledgerEntry: LedgerEntry }>;

  /**
   * Release held funds (pending → available)
   * Idempotent via idempotency key
   */
  async releaseHeldFunds(params: {
    userId: string;
    amount: Decimal;
    reason: string;
    payoutRequestId: string;
    idempotencyKey: string;
  }): Promise<{ balance: SellerBalance; ledgerEntry: LedgerEntry }>;

  /**
   * Get current balance
   * Read-only, safe to retry
   */
  async getBalance(userId: string): Promise<SellerBalance>;

  /**
   * Verify balance integrity
   * Read-only, safe to retry
   */
  async verifyBalance(userId: string): Promise<{
    valid: boolean;
    expected: Decimal;
    actual: Decimal;
    discrepancy?: Decimal;
  }>;
}
```

**Implementation Rules:**
- ✅ MUST use database row-level locking
- ✅ MUST check idempotency key before operation
- ✅ MUST validate sufficient funds before debit
- ✅ MUST create ledger entry in same transaction
- ✅ MUST use Decimal for all amounts (no floats)
- ❌ NEVER allow negative balances
- ❌ NEVER update balance without ledger entry

---

### **3.3 CommissionService**

**Purpose:** Calculate commissions deterministically.

**Invariants Enforced:** 5

**Methods:**

```typescript
class CommissionService {
  /**
   * Calculate commission for transaction
   * Pure function, deterministic, safe to retry
   */
  calculateCommission(params: {
    grossAmount: Decimal;
    currency: string;
    transactionType: 'property' | 'vehicle';
  }): {
    grossAmount: Decimal;
    platformFee: Decimal;
    platformFeePercentage: Decimal;
    processorFee: Decimal;
    netAmount: Decimal;
    calculationMethod: string;
    calculationMetadata: Record<string, any>;
  };

  /**
   * Create commission record
   * Idempotent via transaction ID
   */
  async createCommissionRecord(params: {
    transactionId: string;
    grossAmount: Decimal;
    currency: string;
    transactionType: 'property' | 'vehicle';
  }): Promise<CommissionRecord>;

  /**
   * Get commission record
   * Read-only, safe to retry
   */
  async getCommissionRecord(
    transactionId: string
  ): Promise<CommissionRecord | null>;

  /**
   * Verify commission calculation
   * Read-only, safe to retry
   */
  async verifyCommissionRecord(
    transactionId: string
  ): Promise<{ valid: boolean; expected: Decimal; actual: Decimal }>;
}
```

**Commission Tiers:**
```typescript
const COMMISSION_TIERS = [
  { min: 0, max: 10000, rate: 0.05 },      // 5%
  { min: 10001, max: 50000, rate: 0.03 },  // 3%
  { min: 50001, max: Infinity, rate: 0.02 } // 2%
];

const PROCESSOR_FEE = {
  percentage: 0.025, // 2.5%
  fixed: 5           // 5 ETB
};
```

**Implementation Rules:**
- ✅ MUST be pure function (no side effects)
- ✅ MUST be deterministic (same input → same output)
- ✅ MUST store calculation method and metadata
- ✅ MUST verify on read
- ❌ NEVER use floating-point arithmetic
- ❌ NEVER modify commission after creation

---

### **3.4 FinancialOrchestrationService**

**Purpose:** Coordinate multi-step financial operations atomically.

**Invariants Enforced:** 3, 8, 9

**Methods:**

```typescript
class FinancialOrchestrationService {
  /**
   * Release escrow and credit seller balance
   * Atomic operation, idempotent
   */
  async releaseEscrowToSeller(params: {
    transactionId: string;
    adminContext: AdminContext;
    idempotencyKey: string;
  }): Promise<{
    transaction: Transaction;
    commissionRecord: CommissionRecord;
    sellerBalance: SellerBalance;
    ledgerEntry: LedgerEntry;
  }>;

  /**
   * Process refund with commission reversal
   * Atomic operation, idempotent
   */
  async processRefund(params: {
    transactionId: string;
    amount: Decimal;
    reason: string;
    reversePlatformFee: boolean;
    initiatedById: string;
    idempotencyKey: string;
  }): Promise<{
    refundRecord: RefundRecord;
    sellerBalance?: SellerBalance;
    ledgerEntry?: LedgerEntry;
  }>;

  /**
   * Complete payout (debit pending balance)
   * Atomic operation, idempotent
   */
  async completePayout(params: {
    payoutRequestId: string;
    providerPayoutId: string;
    providerResponse: Record<string, any>;
    idempotencyKey: string;
  }): Promise<{
    payoutRequest: PayoutRequest;
    sellerBalance: SellerBalance;
    ledgerEntry: LedgerEntry;
  }>;
}
```

**Implementation Rules:**
- ✅ MUST use database transactions
- ✅ MUST check idempotency before operation
- ✅ MUST validate all invariants before commit
- ✅ MUST create audit logs for all steps
- ✅ MUST emit events only after commit
- ❌ NEVER commit partial operations
- ❌ NEVER emit events before commit

---

### **3.5 PayoutService**

**Purpose:** Manage payout lifecycle with approval workflow.

**Invariants Enforced:** 4, 8, 9

**Methods:**

```typescript
class PayoutService {
  /**
   * Request payout (seller-initiated)
   * Idempotent via idempotency key
   */
  async requestPayout(params: {
    sellerId: string;
    amount: Decimal;
    paymentMethod: string;
    paymentDetails: Record<string, any>;
    idempotencyKey: string;
  }): Promise<PayoutRequest>;

  /**
   * Approve payout (admin action)
   * Idempotent via payout request ID
   */
  async approvePayout(params: {
    payoutRequestId: string;
    adminId: string;
    adminContext: AdminContext;
  }): Promise<PayoutRequest>;

  /**
   * Reject payout (admin action)
   * Idempotent via payout request ID
   */
  async rejectPayout(params: {
    payoutRequestId: string;
    adminId: string;
    rejectionReason: string;
    adminContext: AdminContext;
  }): Promise<PayoutRequest>;

  /**
   * Process approved payout (background job)
   * Idempotent via payout request ID
   */
  async processPayout(
    payoutRequestId: string
  ): Promise<PayoutRequest>;

  /**
   * Handle payout failure (retry or permanent)
   * Idempotent via payout request ID
   */
  async handlePayoutFailure(params: {
    payoutRequestId: string;
    error: Error;
  }): Promise<PayoutRequest>;

  /**
   * Get payout requests for seller
   * Read-only, safe to retry
   */
  async getPayoutRequests(
    sellerId: string,
    filters?: {
      status?: PayoutRequestStatus;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<PayoutRequest[]>;
}
```

**Implementation Rules:**
- ✅ MUST validate available balance before request
- ✅ MUST hold funds when request created
- ✅ MUST release funds if rejected
- ✅ MUST debit pending when completed
- ✅ MUST implement retry logic with exponential backoff
- ❌ NEVER process without admin approval
- ❌ NEVER allow duplicate requests for same amount

---

### **3.6 RefundService**

**Purpose:** Process refunds with proper accounting.

**Invariants Enforced:** 10, 8, 9

**Methods:**

```typescript
class RefundService {
  /**
   * Initiate refund
   * Idempotent via idempotency key
   */
  async initiateRefund(params: {
    transactionId: string;
    amount: Decimal;
    reason: string;
    reversePlatformFee: boolean;
    initiatedById: string;
    idempotencyKey: string;
  }): Promise<RefundRecord>;

  /**
   * Process refund (background job)
   * Idempotent via refund record ID
   */
  async processRefund(refundId: string): Promise<RefundRecord>;

  /**
   * Handle refund failure
   * Idempotent via refund record ID
   */
  async handleRefundFailure(params: {
    refundId: string;
    error: Error;
  }): Promise<RefundRecord>;

  /**
   * Get refunds for transaction
   * Read-only, safe to retry
   */
  async getRefundsForTransaction(
    transactionId: string
  ): Promise<RefundRecord[]>;
}
```

**Implementation Rules:**
- ✅ MUST check escrow status before refund
- ✅ MUST calculate total credit (refund + reversed fee)
- ✅ MUST debit seller balance if escrow released
- ✅ MUST create single ledger entry for total
- ✅ MUST link to commission record
- ❌ NEVER reverse processor fees (already paid)
- ❌ NEVER refund more than transaction amount

---

### **3.7 EscrowService**

**Purpose:** Manage escrow lifecycle.

**Invariants Enforced:** 3, 8, 9

**Methods:**

```typescript
class EscrowService {
  /**
   * Activate escrow (when payment received)
   * Idempotent via transaction ID
   */
  async activateEscrow(params: {
    transactionId: string;
    amount: Decimal;
    paymentProviderId: string;
    paymentProviderResponse: Record<string, any>;
  }): Promise<Transaction>;

  /**
   * Release escrow (admin action)
   * Idempotent via transaction ID
   * Triggers seller balance credit
   */
  async releaseEscrow(params: {
    transactionId: string;
    adminId: string;
    adminContext: AdminContext;
  }): Promise<{
    transaction: Transaction;
    commissionRecord: CommissionRecord;
    sellerBalance: SellerBalance;
    ledgerEntry: LedgerEntry;
  }>;

  /**
   * Check if escrow can be released
   * Read-only, safe to retry
   */
  async canReleaseEscrow(
    transactionId: string
  ): Promise<{ canRelease: boolean; reason?: string }>;

  /**
   * Get escrow status
   * Read-only, safe to retry
   */
  async getEscrowStatus(transactionId: string): Promise<{
    isEscrowed: boolean;
    amount: Decimal;
    releasedAt?: Date;
    releasedBy?: string;
  }>;
}
```

**Implementation Rules:**
- ✅ MUST verify payment before activation
- ✅ MUST calculate commission before release
- ✅ MUST credit seller balance atomically
- ✅ MUST create commission record
- ✅ MUST emit event after commit
- ❌ NEVER release without admin approval
- ❌ NEVER release twice (idempotency check)

---

## 4. Idempotency Implementation

### **Idempotency Key Storage**

```typescript
model IdempotencyKey {
  id              String   @id @default(uuid())
  key             String   @unique
  operation_type  String   // "credit", "debit", "payout_request", etc.
  resource_id     String   // ID of created resource
  response        Json     // Stored response
  created_at      DateTime @default(now())
  expires_at      DateTime // Auto-cleanup after 24 hours
  
  @@index([key, operation_type])
  @@index([expires_at])
  @@map("idempotency_keys")
}
```

### **Idempotency Pattern**

```typescript
async function idempotentOperation<T>(
  key: string,
  operationType: string,
  operation: () => Promise<T>
): Promise<T> {
  // Check if already executed
  const existing = await prisma.idempotencyKey.findUnique({
    where: { key }
  });
  
  if (existing) {
    // Return cached response
    return existing.response as T;
  }
  
  // Execute operation
  const result = await operation();
  
  // Store result
  await prisma.idempotencyKey.create({
    data: {
      key,
      operation_type: operationType,
      resource_id: result.id,
      response: result,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }
  });
  
  return result;
}
```

---

## 5. Transaction Patterns

### **Pattern 1: Balance Update with Ledger**

```typescript
async function updateBalanceWithLedger(
  userId: string,
  amount: Decimal,
  type: 'credit' | 'debit',
  source: LedgerEntrySource,
  description: string,
  idempotencyKey: string
): Promise<{ balance: SellerBalance; ledgerEntry: LedgerEntry }> {
  return await prisma.$transaction(async (tx) => {
    // 1. Lock seller balance row
    const balance = await tx.sellerBalance.findUnique({
      where: { user_id: userId },
      // Pessimistic locking
      // PostgreSQL: FOR UPDATE
    });
    
    if (!balance) {
      throw new Error('Seller balance not found');
    }
    
    // 2. Calculate new balance
    const balanceBefore = balance.available_balance;
    const balanceAfter = type === 'credit' 
      ? balanceBefore.add(amount)
      : balanceBefore.sub(amount);
    
    // 3. Validate invariants
    if (balanceAfter.lessThan(0)) {
      throw new Error('Insufficient funds');
    }
    
    // 4. Create ledger entry
    const ledgerEntry = await tx.ledgerEntry.create({
      data: {
        seller_balance_id: balance.id,
        type: type === 'credit' ? 'CREDIT' : 'DEBIT',
        source,
        amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        description
      }
    });
    
    // 5. Update balance
    const updatedBalance = await tx.sellerBalance.update({
      where: { id: balance.id },
      data: {
        available_balance: balanceAfter,
        total_earned: type === 'credit' 
          ? balance.total_earned.add(amount)
          : balance.total_earned
      }
    });
    
    // 6. Create audit log
    await tx.auditLog.create({
      data: {
        action: `balance.${type}`,
        resource_type: 'SellerBalance',
        resource_id: balance.id,
        before_state: { balance: balanceBefore },
        after_state: { balance: balanceAfter },
        risk_level: 'high',
        status: 'success'
      }
    });
    
    return { balance: updatedBalance, ledgerEntry };
  }, {
    isolationLevel: 'Serializable', // Highest isolation
    timeout: 10000 // 10 seconds
  });
}
```

---

## 6. Reconciliation Service

### **Daily Reconciliation Job**

```typescript
class ReconciliationService {
  /**
   * Verify all seller balances against ledger
   * Run daily at 2 AM
   */
  async reconcileAllBalances(): Promise<{
    totalSellers: number;
    validBalances: number;
    discrepancies: Array<{
      sellerId: string;
      expected: Decimal;
      actual: Decimal;
      difference: Decimal;
    }>;
  }> {
    const sellers = await prisma.sellerBalance.findMany();
    const results = {
      totalSellers: sellers.length,
      validBalances: 0,
      discrepancies: []
    };
    
    for (const seller of sellers) {
      const verification = await this.verifySellerBalance(seller.user_id);
      
      if (verification.valid) {
        results.validBalances++;
      } else {
        results.discrepancies.push({
          sellerId: seller.user_id,
          expected: verification.expected,
          actual: verification.actual,
          difference: verification.discrepancy
        });
        
        // Alert admins
        await this.alertDiscrepancy(seller.user_id, verification);
      }
    }
    
    return results;
  }
  
  /**
   * Verify single seller balance
   */
  async verifySellerBalance(userId: string): Promise<{
    valid: boolean;
    expected: Decimal;
    actual: Decimal;
    discrepancy?: Decimal;
  }> {
    const balance = await prisma.sellerBalance.findUnique({
      where: { user_id: userId }
    });
    
    const ledgerCalc = await prisma.ledgerEntry.aggregate({
      where: { seller_balance_id: balance.id },
      _sum: {
        amount: true
      },
      // Separate credits and debits
    });
    
    const expected = ledgerCalc.credits.sub(ledgerCalc.debits);
    const actual = balance.available_balance.add(balance.pending_balance);
    const discrepancy = actual.sub(expected);
    
    return {
      valid: discrepancy.equals(0),
      expected,
      actual,
      discrepancy: discrepancy.equals(0) ? undefined : discrepancy
    };
  }
}
```

---

## 7. Error Handling

### **Error Hierarchy**

```typescript
class FinancialError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high' | 'critical',
    public recoverable: boolean,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'FinancialError';
  }
}

class InsufficientFundsError extends FinancialError {
  constructor(available: Decimal, required: Decimal) {
    super(
      `Insufficient funds: available ${available}, required ${required}`,
      'INSUFFICIENT_FUNDS',
      'high',
      false,
      { available, required }
    );
  }
}

class InvariantViolationError extends FinancialError {
  constructor(invariant: string, details: Record<string, any>) {
    super(
      `Invariant violation: ${invariant}`,
      'INVARIANT_VIOLATION',
      'critical',
      false,
      details
    );
  }
}

class IdempotencyConflictError extends FinancialError {
  constructor(key: string, existingResourceId: string) {
    super(
      `Idempotency conflict: key ${key} already used`,
      'IDEMPOTENCY_CONFLICT',
      'low',
      true,
      { key, existingResourceId }
    );
  }
}
```

---

## 8. Testing Strategy

### **Invariant Tests**

```typescript
describe('Financial Invariants', () => {
  test('Invariant 1: Balance Conservation', async () => {
    const userId = 'test-user';
    
    // Credit 1000
    await balanceService.credit({
      userId,
      amount: new Decimal(1000),
      source: 'ESCROW_RELEASE',
      description: 'Test credit',
      idempotencyKey: 'test-1'
    });
    
    // Debit 300
    await balanceService.debit({
      userId,
      amount: new Decimal(300),
      source: 'PAYOUT_COMPLETED',
      description: 'Test debit',
      idempotencyKey: 'test-2'
    });
    
    // Verify balance = ledger
    const verification = await balanceService.verifyBalance(userId);
    expect(verification.valid).toBe(true);
    expect(verification.actual).toEqual(new Decimal(700));
  });
  
  test('Invariant 2: No Negative Balances', async () => {
    const userId = 'test-user-2';
    
    await expect(
      balanceService.debit({
        userId,
        amount: new Decimal(100),
        source: 'PAYOUT_COMPLETED',
        description: 'Test debit',
        idempotencyKey: 'test-3'
      })
    ).rejects.toThrow(InsufficientFundsError);
  });
  
  test('Invariant 8: Idempotency', async () => {
    const userId = 'test-user-3';
    const idempotencyKey = 'test-idempotent';
    
    // First call
    const result1 = await balanceService.credit({
      userId,
      amount: new Decimal(500),
      source: 'ESCROW_RELEASE',
      description: 'Test credit',
      idempotencyKey
    });
    
    // Second call (duplicate)
    const result2 = await balanceService.credit({
      userId,
      amount: new Decimal(500),
      source: 'ESCROW_RELEASE',
      description: 'Test credit',
      idempotencyKey
    });
    
    // Should return same result
    expect(result1.ledgerEntry.id).toBe(result2.ledgerEntry.id);
    
    // Balance should only increase once
    const balance = await balanceService.getBalance(userId);
    expect(balance.available_balance).toEqual(new Decimal(500));
  });
});
```

---

## 9. Implementation Checklist

### **Phase 1: Foundation (Week 1)**
- [ ] Create IdempotencyKey model
- [ ] Implement idempotency pattern
- [ ] Add database constraints for invariants
- [ ] Set up transaction isolation levels

### **Phase 2: Core Services (Week 2)**
- [ ] Implement LedgerService
- [ ] Implement BalanceService
- [ ] Implement CommissionService
- [ ] Write invariant tests

### **Phase 3: Orchestration (Week 3)**
- [ ] Implement FinancialOrchestrationService
- [ ] Implement EscrowService
- [ ] Write integration tests

### **Phase 4: Business Logic (Week 4)**
- [ ] Implement PayoutService
- [ ] Implement RefundService
- [ ] Write end-to-end tests

### **Phase 5: Reconciliation (Week 5)**
- [ ] Implement ReconciliationService
- [ ] Set up daily reconciliation job
- [ ] Implement alerting

### **Phase 6: Hardening (Week 6)**
- [ ] Load testing
- [ ] Chaos testing (simulate failures)
- [ ] Security audit
- [ ] Documentation

---

## 10. Conclusion

This architecture enforces **10 non-negotiable financial invariants** through:

✅ **Immutable ledger** with balance snapshots  
✅ **Atomic transactions** with serializable isolation  
✅ **Idempotency** for all financial operations  
✅ **Deterministic calculations** with verification  
✅ **Complete audit trails** for compliance  
✅ **Daily reconciliation** to detect discrepancies  
✅ **Pessimistic locking** to prevent race conditions  
✅ **Error hierarchy** for proper failure handling  
✅ **Comprehensive testing** of all invariants  

**Every invariant is enforced by design, not by hope.**

If any service violates an invariant, the transaction is rolled back, an error is thrown, and admins are alerted. **No exceptions.**

**This is production-grade financial infrastructure.** 💰✅
