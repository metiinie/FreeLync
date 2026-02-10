# Admin Control Surface & Payment Integration Architecture

**Objective**: Establish a safe, minimal administrative interface for financial operations and integrate external payment providers as pure execution adapters.

**Core Principle**: The internal ledger is the **ONLY** source of truth. External providers are unreliable execution mechanisms. The Admin UI is a view/approval layer, NEVER a state mutator beyond predefined workflows.

---

## 1. Administrative Control Surface

The Admin API provides visibility and structured intervention capabilities. It does **NOT** allow arbitrary database edits.

### **1.1 Read-Only Visibility (Inspection)**

*   **`GET /admin/financial/balances`**
    *   List all seller balances (available, pending, total earned).
    *   *Purpose*: Audit seller financial standing.
*   **`GET /admin/financial/ledger/:balanceId`**
    *   View immutable ledger history for a specific balance.
    *   *Purpose*: Trace every cent of movement.
*   **`GET /admin/financial/payouts?status=PENDING`**
    *   List payouts requiring approval.
    *   *Purpose*: Operational workflow queue.
*   **`GET /admin/financial/reconciliation`**
    *   View latest reconciliation report discrepancies.
    *   *Purpose*: System health check.

### **1.2 Controlled Intervention (Approvals)**

*   **`POST /admin/financial/payouts/:id/approve`**
    *   **Action**: Transitions PayoutRequest `PENDING` → `APPROVED`.
    *   **Side Effect**: None immediately (or triggers async processing).
    *   **Safety**: Idempotent. Checks admin permissions.
*   **`POST /admin/financial/payouts/:id/reject`**
    *   **Action**: Transitions PayoutRequest `PENDING` → `REJECTED`.
    *   **Side Effect**: `BalanceService.releaseHeldFunds`.
    *   **Safety**: Idempotent. Requires reason.

### **1.3 Emergency Controls (Circuit Breakers)**

*   **`POST /admin/financial/maintenance/enable`**
    *   **Action**: Stops all new financial transactions (Payouts, Deposits).
    *   **Purpose**: Halt system in case of detected anomaly or exploit.

---

## 2. Payment Provider Integration (Adapter Pattern)

External providers (Stripe, Chapa, Telebirr) are treated as **dumb pipes**. They execute instructions but do not define state.

### **2.1 Adapter Interface**

```typescript
interface PaymentAdapter {
  /**
   * Initialize a payment (Deposit/Escrow)
   * Returns: Provider-specific reference and checkout/action URL
   */
  initializePayment(params: {
    transactionId: string;
    amount: number;
    currency: string;
    payerEmail: string;
    metadata: Record<string, any>;
  }): Promise<PaymentInitializationResult>;

  /**
   * Verify status of a payment (Polling/Webhook verification)
   * Returns: Standardized status (SUCCESS, FAILED, PENDING)
   */
  verifyPayment(providerRef: string): Promise<PaymentStatus>;

  /**
   * Execute a payout (withdrawal)
   * Returns: Provider payout ID if accepted
   */
  executePayout(params: {
    payoutRequestId: string;
    amount: number;
    currency: string;
    recipientDetails: any;
  }): Promise<PayoutExecutionResult>;
}
```

### **2.2 Implementation Strategy**

1.  **ChapaAdapter**: Implements `PaymentAdapter` for Chapa.
2.  **MockAdapter**: Implements `PaymentAdapter` for local dev/testing failures.
3.  **PaymentGatewayService**: Factory that selects the correct adapter based on config/request.

### **2.3 Failure Handling Rules**

*   **Inbound (Deposits)**:
    *   Trust **Webhooks** primarily.
    *   Verify signature.
    *   Idempotently call `EscrowService.activateEscrow`.
    *   If webhook fails, allow manual `verifyPayment` trigger from Admin UI.
*   **Outbound (Payouts)**:
    *   `PayoutService` calls `Adapter.executePayout`.
    *   If Adapter throws/fails:
        *   **Transient** (Network): Retry with exponential backoff.
        *   **Permanent** (Invalid Account): Mark Payout `FAILED`, trigger Admin alert.
        *   **Unknown** (Timeout): Check status via `Adapter.verifyPayout` loop before retrying.

---

## 3. Implementation Plan

1.  **Refactor `PaymentModule`**:
    *   Create `src/payment/interfaces/payment-adapter.interface.ts`.
    *   Create adapters in `src/payment/adapters/`.
    *   Update `PaymentService` to use adapters.
2.  **Implement `AdminFinancialController`**:
    *   Create `src/financial/controllers/admin-financial.controller.ts`.
    *   Bind to `FinancialModule` services.
3.  **Connect Payouts**:
    *   Update `PayoutService.processPayout` to use `PaymentService` (which uses Adapter).

---
