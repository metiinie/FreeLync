# Phase 2: Document Verification System Architecture

**Version:** 1.0  
**Date:** 2026-02-09  
**Status:** Implementation Complete

---

## 1. Executive Summary

The Document Verification System (DVS) transforms FreeLync from a simple marketplace into a **trust-verified transaction platform**. It ensures that every high-value transaction is backed by validated legal ownership, genuine identity documents, and verifiable registration papers.

### 1.1 Core Principle
**"Documents are not just files—they are trust signals."**

Every document submitted generates an internal confidence score that influences:
- Listing approval decisions
- Escrow release timing
- Dispute resolution outcomes
- User trust badges and visibility

---

## 2. System Architecture

### 2.1 Data Model

#### **VerificationRequest**
The central orchestration entity that links users, listings, and transactions to required documents.

**Fields:**
- `id`: UUID
- `status`: PENDING | IN_REVIEW | APPROVED | REJECTED | RE_REQUESTED | CANCELLED
- `scope`: USER_IDENTITY | USER_KYB | LISTING_OWNERSHIP | LISTING_REGISTRATION | TRANSACTION_OBLIGATION
- `user_id`: Requester
- `listing_id`: Optional (for listing-specific verification)
- `transaction_id`: Optional (for transaction-specific verification)
- `assigned_admin_id`: Admin reviewer
- `rejection_reason`: Mandatory when REJECTED
- `admin_notes`: Internal notes (never exposed to users)
- `confidence_score`: Float (1-10, internal metric)
- `expires_at`: Document validity deadline
- `last_review_at`: Timestamp of last admin action

#### **VerificationDocument**
Individual document submissions within a request.

**Fields:**
- `id`: UUID
- `request_id`: Parent verification request
- `type_id`: Reference to VerificationDocumentType
- `uploader_id`: User who uploaded
- `file_url`: Secure storage URL
- `file_name`, `file_size`, `file_type`: Metadata
- `status`: PENDING | VERIFIED | REJECTED | EXPIRED
- `rejection_reason`: Why document was rejected
- `confidence_signal`: Float (1-10, internal)
- `issue_date`, `expiry_date`: Validity period
- `metadata`: JSON for extensibility

#### **VerificationDocumentType**
Template defining required document types per scope.

**Fields:**
- `id`: UUID
- `name`: Human-readable (e.g., "National ID")
- `code`: Machine-readable (e.g., "PASSPORT", "TITLE_DEED")
- `description`: Instructions for users
- `scope`: Which verification scope requires this
- `required`: Boolean (mandatory vs optional)

---

### 2.2 Document Lifecycle

```
┌─────────────┐
│  REQUESTED  │ ← System identifies missing docs based on template
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  SUBMITTED  │ ← User uploads file → Status: PENDING
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  IN_REVIEW  │ ← Admin opens document for checking
└──────┬──────┘
       │
       ├────→ VERIFIED (Confidence Score: 1-10)
       │      └─→ Trust signal emitted to platform
       │
       ├────→ REJECTED (Mandatory reason)
       │      └─→ Back to PENDING (User can resubmit)
       │
       └────→ EXPIRED (System flag when expiry_date < now())
```

---

## 3. Verification Scopes

### 3.1 USER_IDENTITY
**Purpose:** Verify user is a real person with valid government ID.

**Required Documents:**
- National ID / Passport
- Selfie with ID (liveness check)

**Impact:**
- User gets "Verified" badge
- Can create listings
- Higher visibility in search results

### 3.2 USER_KYB (Know Your Business)
**Purpose:** Verify business entities for commercial sellers.

**Required Documents:**
- Business registration certificate
- Tax ID
- Director ID

**Impact:**
- "Business Verified" badge
- Can list commercial properties
- Lower escrow holding periods

### 3.3 LISTING_OWNERSHIP
**Purpose:** Prove legal ownership of property/vehicle.

**Required Documents:**
- **Property:** Title deed, ownership certificate
- **Vehicle:** Vehicle registration card, ownership transfer document

**Impact:**
- Listing can be approved
- Higher confidence = faster approval

### 3.4 LISTING_REGISTRATION
**Purpose:** Verify property/vehicle is legally registered.

**Required Documents:**
- **Property:** Land registry extract, municipal approval
- **Vehicle:** Road-worthiness certificate, insurance

**Impact:**
- Listing marked as "Registered"
- Reduces dispute risk

### 3.5 TRANSACTION_OBLIGATION
**Purpose:** Verify transaction-specific requirements (e.g., mortgage clearance, lien release).

**Required Documents:**
- Bank clearance letter
- Lien release certificate

**Impact:**
- Escrow can be released
- Transaction can complete

---

## 4. Confidence Scoring System

### 4.1 Scoring Criteria
Admins assign a **Confidence Score (1-10)** for each verified document:

| Score | Meaning | Example |
|-------|---------|---------|
| 9-10  | **Genuine, Registry-Verified** | Document verified via external government registry API |
| 7-8   | **Clear, Unverified** | High-quality scan, all details visible, but not cross-checked |
| 4-6   | **Acceptable, Secondary Evidence Needed** | Slightly blurry, requires additional supporting docs |
| 1-3   | **Suspicious, Requires Investigation** | Poor quality, inconsistencies detected |

### 4.2 Aggregate Trust Score
Each user and listing has an **aggregate trust score** calculated from all verified documents:

```
Trust Score = Average(confidence_signals) × (verified_docs / required_docs)
```

**Platform Decisions Based on Trust Score:**
- **Score 8-10:** Instant listing approval, 24h escrow hold
- **Score 5-7:** Manual review, 72h escrow hold
- **Score 1-4:** Listing rejected, account flagged

---

## 5. Workflows

### 5.1 User Workflow: Listing Verification

1. **User creates listing** → System detects category (Property/Vehicle)
2. **System creates VerificationRequest** with scope `LISTING_OWNERSHIP`
3. **User uploads documents** (Title deed, Registration)
4. **Status: PENDING** → Notification sent to admin queue
5. **Admin reviews** → Assigns confidence score
6. **Status: APPROVED** → Listing status changes to `APPROVED`
7. **Listing goes live** on platform

### 5.2 Admin Workflow: Document Review

1. **Admin opens verification queue** → Sorted by creation date
2. **Admin selects request** → Views all submitted documents
3. **Admin reviews each document:**
   - Checks clarity, authenticity
   - Cross-references with external registries (if available)
   - Assigns confidence score (1-10)
4. **Admin makes decision:**
   - **APPROVED:** Listing/User verified
   - **REJECTED:** Mandatory reason provided → User notified
5. **Audit log created** → All actions recorded

### 5.3 Re-Request and Resubmission Flow

**Scenario:** Admin rejects a blurry title deed.

1. **Admin sets status: REJECTED** with reason: "Document unclear, please upload higher resolution scan"
2. **User receives notification** with rejection reason
3. **User uploads new document** → Status changes to `PENDING`
4. **Admin re-reviews** → Approves or rejects again
5. **Max 3 resubmissions** before account review

---

## 6. Security & Privacy

### 6.1 Document Storage
- **Encryption:** All documents stored in private S3-compatible buckets with AES-256 encryption
- **Access Control:** Signed URLs with 1-hour expiry for viewing
- **PII Handling:** User IDs and sensitive documents auto-deleted after verification + 90-day retention period

### 6.2 Audit Trail
Every document view, download, and decision is logged:
- **Who:** Admin ID
- **What:** Action (view, approve, reject)
- **When:** Timestamp
- **Why:** Reason (for rejections)

### 6.3 Compliance
- **GDPR:** Right to deletion after transaction completion
- **Data Minimization:** Only required documents collected
- **Transparency:** Users can view verification status and rejection reasons

---

## 7. Integration Points

### 7.1 Listing Service
**Before Approval:**
```typescript
if (listing.category === 'PROPERTY' || listing.category === 'VEHICLE') {
  const verification = await verificationsService.getRequestByListing(listing.id);
  if (verification.status !== 'APPROVED') {
    throw new Error('Listing requires document verification');
  }
}
```

### 7.2 Escrow Service
**Confidence-Based Holding Periods:**
```typescript
const trustScore = await verificationsService.getUserTrustScore(seller.id);
const holdingPeriod = trustScore > 8 ? 24 : trustScore > 5 ? 72 : 168; // hours
```

### 7.3 User Service
**Trust Badges:**
```typescript
if (user.verified && userTrustScore > 8) {
  user.badges.push('VERIFIED_SELLER');
}
```

### 7.4 Dispute Resolution
**Evidence Weight:**
```typescript
const sellerTrust = await verificationsService.getUserTrustScore(seller.id);
const buyerTrust = await verificationsService.getUserTrustScore(buyer.id);
// Higher trust score = more credible in disputes
```

---

## 8. API Endpoints

### 8.1 User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/verifications/requests` | Create verification request |
| GET | `/verifications/requests` | Get my verification requests |
| POST | `/verifications/requests/:id/documents` | Submit document |
| GET | `/verifications/document-types` | Get required document types |

### 8.2 Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/verifications/requests` | Get all requests (filterable) |
| PATCH | `/admin/verifications/requests/:id/review` | Review and approve/reject |
| PATCH | `/admin/verifications/documents/:id/status` | Review individual document |

---

## 9. Permissions

**Required Permissions:**
- `verifications.view` - View verification requests
- `verifications.review` - Approve/reject requests
- `verifications.manage` - Create document types, manage templates

---

## 10. Future Enhancements

### 10.1 Automated Verification
- **OCR Integration:** Extract data from ID cards automatically
- **Registry APIs:** Auto-verify title deeds via government APIs
- **Liveness Detection:** AI-powered selfie verification

### 10.2 Document Expiry Monitoring
- **Cron Job:** Daily check for expired documents
- **Auto-Notification:** Alert users 30 days before expiry
- **Auto-Suspension:** Suspend listings with expired ownership docs

### 10.3 Risk-Based Verification
- **Low-Value Listings (<$5000):** Simplified verification
- **High-Value Listings (>$50,000):** Enhanced due diligence
- **Repeat Sellers:** Reduced verification for trusted users

---

## 11. Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Avg. Verification Time | < 24 hours | TBD |
| User Trust Score | > 7.5 | TBD |
| Dispute Rate (Verified Listings) | < 2% | TBD |
| Document Rejection Rate | < 15% | TBD |

---

## 12. Implementation Checklist

- [x] Database schema designed and migrated
- [x] VerificationsService implemented
- [x] User and Admin controllers created
- [x] DTOs for request/review/submit defined
- [x] Integration with Audit and Notification services
- [x] Module registered in AppModule
- [ ] Seed document types (PASSPORT, TITLE_DEED, etc.)
- [ ] Frontend verification dashboard
- [ ] Admin verification queue UI
- [ ] File upload integration
- [ ] Automated expiry monitoring
- [ ] External registry API integration

---

## 13. Conclusion

The Document Verification System is the **trust backbone** of FreeLync. By treating documents as actionable risk signals rather than static files, the platform can:

1. **Reduce fraud** through verified ownership
2. **Accelerate transactions** for trusted users
3. **Resolve disputes** with confidence-weighted evidence
4. **Build long-term trust** through transparent verification

This system is designed for **correctness and defensibility** over speed, ensuring every decision is traceable, justified, and compliant with regulatory standards.
