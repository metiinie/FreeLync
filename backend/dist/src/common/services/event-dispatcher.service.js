"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventDispatcherService = void 0;
const common_1 = require("@nestjs/common");
const notifications_service_1 = require("../../notifications/notifications.service");
const audit_service_1 = require("./audit.service");
let EventDispatcherService = class EventDispatcherService {
    notificationService;
    auditService;
    constructor(notificationService, auditService) {
        this.notificationService = notificationService;
        this.auditService = auditService;
    }
    async emit(eventType, payload, source = 'system') {
        const event = {
            type: eventType,
            payload,
            timestamp: new Date(),
            source
        };
        await this.logEvent(event);
        await this.triggerNotifications(event);
    }
    async logEvent(event) {
        console.log(`[EVENT] ${event.type}`, {
            timestamp: event.timestamp,
            source: event.source,
            payload: event.payload
        });
    }
    async triggerNotifications(event) {
        const { type, payload } = event;
        try {
            switch (type) {
                case 'escrow.created':
                    await this.handleEscrowCreated(payload);
                    break;
                case 'escrow.funded':
                    await this.handleEscrowFunded(payload);
                    break;
                case 'escrow.released':
                    await this.handleEscrowReleased(payload);
                    break;
                case 'escrow.refunded':
                    await this.handleEscrowRefunded(payload);
                    break;
                case 'dispute.initiated':
                    await this.handleDisputeInitiated(payload);
                    break;
                case 'dispute.evidence_uploaded':
                    await this.handleDisputeEvidenceUploaded(payload);
                    break;
                case 'dispute.assigned':
                    await this.handleDisputeAssigned(payload);
                    break;
                case 'dispute.resolved':
                    await this.handleDisputeResolved(payload);
                    break;
                case 'verification.requested':
                    await this.handleVerificationRequested(payload);
                    break;
                case 'verification.approved':
                    await this.handleVerificationApproved(payload);
                    break;
                case 'verification.rejected':
                    await this.handleVerificationRejected(payload);
                    break;
                case 'verification.expiring_soon':
                    await this.handleVerificationExpiring(payload);
                    break;
                case 'listing.approved':
                    await this.handleListingApproved(payload);
                    break;
                case 'listing.rejected':
                    await this.handleListingRejected(payload);
                    break;
                case 'listing.inquiry':
                    await this.handleListingInquiry(payload);
                    break;
                case 'transaction.created':
                    await this.handleTransactionCreated(payload);
                    break;
                case 'transaction.payment_pending':
                    await this.handlePaymentReminder(payload);
                    break;
                case 'transaction.completed':
                    await this.handleTransactionCompleted(payload);
                    break;
                default:
                    console.warn(`[EVENT] No handler for event type: ${type}`);
            }
        }
        catch (error) {
            console.error(`[EVENT] Error handling event ${type}:`, error);
        }
    }
    async handleEscrowCreated(payload) {
        const { transaction_id, buyer_id, seller_id, amount, currency } = payload;
        await this.notificationService.createFromTemplate('ESCROW_CREATED', buyer_id, {
            transaction_id,
            amount,
            currency,
            role: 'buyer'
        });
        await this.notificationService.createFromTemplate('ESCROW_CREATED', seller_id, {
            transaction_id,
            amount,
            currency,
            role: 'seller'
        });
    }
    async handleEscrowFunded(payload) {
        const { transaction_id, seller_id, amount, currency } = payload;
        await this.notificationService.createFromTemplate('ESCROW_FUNDED', seller_id, {
            transaction_id,
            amount,
            currency
        });
    }
    async handleEscrowReleased(payload) {
        const { transaction_id, seller_id, amount, currency, settlement_days } = payload;
        await this.notificationService.createFromTemplate('ESCROW_RELEASED', seller_id, {
            transaction_id,
            amount,
            currency,
            settlement_days: settlement_days || 3
        });
    }
    async handleEscrowRefunded(payload) {
        const { transaction_id, buyer_id, amount, currency, reason } = payload;
        await this.notificationService.createFromTemplate('ESCROW_REFUNDED', buyer_id, {
            transaction_id,
            amount,
            currency,
            reason
        });
    }
    async handleDisputeInitiated(payload) {
        const { dispute_id, initiator_id, respondent_id, transaction_id, reason } = payload;
        await this.notificationService.createFromTemplate('DISPUTE_INITIATED', respondent_id, {
            dispute_id,
            transaction_id,
            reason
        });
    }
    async handleDisputeEvidenceUploaded(payload) {
        const { dispute_id, uploader_id, other_party_id, evidence_type } = payload;
        await this.notificationService.createFromTemplate('DISPUTE_EVIDENCE_UPLOADED', other_party_id, {
            dispute_id,
            evidence_type
        });
    }
    async handleDisputeAssigned(payload) {
        const { dispute_id, admin_id, transaction_id } = payload;
        await this.notificationService.createFromTemplate('DISPUTE_ASSIGNED', admin_id, {
            dispute_id,
            transaction_id
        });
    }
    async handleDisputeResolved(payload) {
        const { dispute_id, initiator_id, respondent_id, resolution, notes } = payload;
        for (const user_id of [initiator_id, respondent_id]) {
            await this.notificationService.createFromTemplate('DISPUTE_RESOLVED', user_id, {
                dispute_id,
                resolution,
                notes
            });
        }
    }
    async handleVerificationRequested(payload) {
        const { user_id, scope, listing_id } = payload;
        await this.notificationService.createFromTemplate('VERIFICATION_REQUESTED', user_id, {
            scope,
            listing_id
        });
    }
    async handleVerificationApproved(payload) {
        const { user_id, scope, listing_id } = payload;
        await this.notificationService.createFromTemplate('VERIFICATION_APPROVED', user_id, {
            scope,
            listing_id
        });
    }
    async handleVerificationRejected(payload) {
        const { user_id, scope, rejection_reason, listing_id } = payload;
        await this.notificationService.createFromTemplate('VERIFICATION_REJECTED', user_id, {
            scope,
            rejection_reason,
            listing_id
        });
    }
    async handleVerificationExpiring(payload) {
        const { user_id, document_type, expiry_date } = payload;
        await this.notificationService.createFromTemplate('VERIFICATION_EXPIRING', user_id, {
            document_type,
            expiry_date
        });
    }
    async handleListingApproved(payload) {
        const { listing_id, owner_id, title } = payload;
        await this.notificationService.createFromTemplate('LISTING_APPROVED', owner_id, {
            listing_id,
            title
        });
    }
    async handleListingRejected(payload) {
        const { listing_id, owner_id, title, rejection_reason } = payload;
        await this.notificationService.createFromTemplate('LISTING_REJECTED', owner_id, {
            listing_id,
            title,
            rejection_reason
        });
    }
    async handleListingInquiry(payload) {
        const { listing_id, owner_id, inquirer_name, message } = payload;
        await this.notificationService.createFromTemplate('LISTING_INQUIRY', owner_id, {
            listing_id,
            inquirer_name,
            message
        });
    }
    async handleTransactionCreated(payload) {
        const { transaction_id, buyer_id, seller_id, listing_title, amount, currency } = payload;
        await this.notificationService.createFromTemplate('TRANSACTION_CREATED', buyer_id, {
            transaction_id,
            listing_title,
            amount,
            currency,
            role: 'buyer'
        });
        await this.notificationService.createFromTemplate('TRANSACTION_CREATED', seller_id, {
            transaction_id,
            listing_title,
            amount,
            currency,
            role: 'seller'
        });
    }
    async handlePaymentReminder(payload) {
        const { transaction_id, buyer_id, amount, currency, due_date } = payload;
        await this.notificationService.createFromTemplate('PAYMENT_REMINDER', buyer_id, {
            transaction_id,
            amount,
            currency,
            due_date
        });
    }
    async handleTransactionCompleted(payload) {
        const { transaction_id, buyer_id, seller_id, listing_title } = payload;
        for (const user_id of [buyer_id, seller_id]) {
            await this.notificationService.createFromTemplate('TRANSACTION_COMPLETED', user_id, {
                transaction_id,
                listing_title
            });
        }
    }
};
exports.EventDispatcherService = EventDispatcherService;
exports.EventDispatcherService = EventDispatcherService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notifications_service_1.NotificationService,
        audit_service_1.AuditService])
], EventDispatcherService);
//# sourceMappingURL=event-dispatcher.service.js.map