# Phase 1: Dispute Management System Architecture

## 1. Overview
The Dispute Management System is the "Supreme Court" of the FreeLync platform. It provides a structured, transparent, and defensible mechanism for resolving conflicts between buyers and sellers in escrow-based transactions. 

The system acts as the single source of truth for dispute lifecycles, evidence collection, and administrative decisions, directly influencing the flow of funds and user trust scores.

## 2. Core Objectives
- **Fairness:** Ensure both parties have equal opportunity to present evidence.
- **Traceability:** Every action, message, and decision is logged and immutable.
- **Speed:** Automate notifications and deadlines to prevent stalling.
- **Compliance:** rigorous documentation of reasons for financial decisions.

## 3. Data Architecture

### 3.1 New Models

#### `Dispute`
The central entity tracking the conflict.
- **Relations:** 
  - `Transaction` (1:1 relation, a transaction has one active dispute)
  - `Initiator` (User who started it)
  - `Respondent` (The other party)
  - `AssignedAdmin` (User with 'dispute_manager' permission)
- **Fields:**
  - `status`: OPEN, EVIDENCE_PENDING, UNDER_REVIEW, RESOLVED, CLOSED
  - `reason`: ITEM_NOT_RECEIVED, NOT_AS_DESCRIBED, etc.
  - `amount_claimed`: Float (usually transaction amount)
  - `admin_notes`: Internal notes
  - `resolution`: REFUND_BUYER, RELEASE_SELLER, PARTIAL_REFUND
  - `resolution_notes`: Public explanation of decision
  - `deadlines`: JSON (evidence_deadline, refund_deadline)

#### `DisputeEvidence`
Secure storage for proof.
- **Fields:**
  - `dispute_id`
  - `uploader_id`
  - `file_url`
  - `file_type`: IMAGE, DOCUMENT, VIDEO
  - `description`: Context for the file
  - `uploaded_at`

#### `DisputeMessage`
Communication channel strictly for the dispute.
- **Fields:**
  - `dispute_id`
  - `sender_id`
  - `content`
  - `is_internal`: Boolean (for admin-only notes, though usually those go in metadata or separate logs)
  - `sent_at`

### 3.2 Integration with Existing Models
- **Transaction:**
  - Add `dispute_id` foreign key (optional, or reverse relation).
  - Update `status` to `DISPUTED` when dispute opens.
  - New properties in `TransactionStatus` enum.

- **User:**
  - Track `dispute_count` or `trust_score` impact.

## 4. Dispute Lifecycle Workflow

1.  **Creation (Buyer/Seller)**
    - Trigger: "Report a Problem" on active transaction.
    - Action: Creates `Dispute` record.
    - Side Effect: **Freezes Escrow** (Transaction status -> ON_HOLD).
    - Notification: Email/Push to Respondent & Admin Team.

2.  **Evidence Collection (System/Users)**
    - State: `EVIDENCE_PENDING`
    - Logic: System sets a deadline (e.g., 48 hours).
    - Action: Users upload images/docs via `DisputeEvidence`.
    - Automation: If deadline passes without respondent evidence, admin can rule by default.

3.  **Review (Admin)**
    - State: `UNDER_REVIEW`
    - Action: Admin (with `dispute_resolution` permission) claims the ticket.
    - Capability: Admin can request more info or post messages.
    - Constraint: Admin *cannot* resolve without reviewing evidence.

4.  **Resolution (Admin)**
    - State: `RESOLVED`
    - Action: Admin selects outcome (Refund/Release/Split).
    - Requirement: **Mandatory Reason** (captured in Audit Log and Dispute record).
    - Side Effect: 
      - Funds moved (Escrow released or refunded).
      - Transaction status updated (COMPLETED or REFUNDED).
      - Dispute status -> CLOSED.

5.  **Post-Resolution**
    - Audit Trail sealed.
    - Users notified of final decision.
    - Appeal window (optional for Phase 2).

## 5. Security & Compliance

### 5.1 Permissions (RBAC)
New permissions added to Control Layer:
- `disputes.view`: View any dispute.
- `disputes.create`: Open a dispute (User level).
- `disputes.manage`: Assign/Claim disputes.
- `disputes.resolve`: Make final financial decision (Critical Risk).
- `disputes.evidence.upload`: Upload files.

### 5.2 Audit Logging
Integrated with Phase 0 AuditService:
- All status changes logged.
- All evidence uploads logged.
- Final decision logged with **Before/After** financial state.

### 5.3 Evidence Security
- Evidence files stored in secure bucket (e.g., S3/local-secure).
- URLs signed or checked via backend proxy (prevent public access).

## 6. Implementation Plan

1.  **Database:** Update schema with new models.
2.  **Service Layer:** Implement `DisputeService`.
3.  **Controller:** Create `DisputesController` (User) and `AdminDisputesController`.
4.  **Frontend:** Build Dispute Dashboard and Evidence Uploader.
