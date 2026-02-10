# Ledger Architecture & Invariants

**Objective:** Establish the Ledger as the **Immutable Single Source of Truth** for all financial state.

---

## 1. Core Invariants (The "Laws of Physics")

### **Invariant 1: The Ledger is the Only Truth**
*   The `SellerBalance` table is merely a **cached snapshot** (optimization).
*   Any discrepancy between `SellerBalance` and the sum of `LedgerEntry` history is a corruption of the snapshot, not the ledger.
*   **Resolution:** Rebuild `SellerBalance` from `LedgerEntry` history.

### **Invariant 2: Append-Only Immutaiblity**
*   Ledger entries are **never updated** and **never deleted**.
*   Corrections are made only via explicit compensating entries (e.g., `ADJUSTMENT` type).
*   **Enforcement:** Database permissions (if possible) or strict service-layer logic + specific audit alerts on ANY mutation attempt.

### **Invariant 3: Cryptographic Continuity (Hash Chain)**
*   Each `LedgerEntry` contains a cryptographic hash of its content AND the hash of the **previous** entry.
*   `Entry(N).hash = SHA256(Entry(N-1).hash + Entry(N).data)`
*   **Result:** Exact reconstruction of history order; impossible to insert, delete, or modify widely without breaking the chain.

### **Invariant 4: Sequence Continuity**
*   Each `LedgerEntry` for a specific account has a strictly increasing integer `sequence`.
*   `Entry(N).sequence = Entry(N-1).sequence + 1`
*   **Result:** Detection of missing (deleted) records.

### **Invariant 5: Zero-Sum Transfers**
*   (For double-entry strictness) System internal transfers must sum to zero.
*   *Note: Current implementation focuses on User Balances. Platform accounts are implicit.*

---

## 2. Data Structure (Schema Requirements)

### **LedgerEntry**
| Field | Type | Purpose |
|-------|------|---------|
| `id` | UUID | Unique Identifier |
| `seller_balance_id` | UUID | Account Scope |
| `sequence` | Int | **Invariant 4**: Ordering & Gap Detection |
| `previous_hash` | String | **Invariant 3**: Backlink |
| `hash` | String | **Invariant 3**: Integrity Check |
| `type` | Enum | Classification |
| `amount` | Decimal | Value |
| `balance_after` | Decimal | Snapshot (Optimization) |
| `created_at` | DateTime | Timestamp |

---

## 3. Operation Lifecycle

### **Creation (createEntry)**
1.  **Lock** `SellerBalance` (Mutex).
2.  **Fetch Last Entry** (by sequence desc).
3.  **Validate Snapshot**: Assert `SellerBalance.current == LastEntry.balance_after`.
    *   *If mismatch:* HALT. Trigger **Emergency Reconciliation**.
4.  **Construct New Entry**:
    *   `sequence = LastEntry.sequence + 1`
    *   `previous_hash = LastEntry.hash`
    *   `balance_after = LastEntry.balance_after +/- amount`
    *   `hash = SHA256(previous_hash + type + amount + balance_after + nonce)`
5.  **Commit** to DB.
6.  **Update Snapshot** (`SellerBalance`).
7.  **Release Lock**.

### **Verification (verifyIntegrity)**
1.  Load all entries order by sequence.
2.  Verify `Sequence(N) == Sequence(N-1) + 1`.
3.  Verify `Hash(N)` matches calculation.
4.  Verify `Balance(N)` math.
5.  Verify `SellerBalance.snapshot == Balance(Last)`.

---
