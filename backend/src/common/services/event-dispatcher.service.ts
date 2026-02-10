import { Injectable } from '@nestjs/common';
import { NotificationService } from '../../notifications/notifications.service';
import { AuditService } from './audit.service';

export interface PlatformEvent {
    type: string;
    payload: any;
    timestamp: Date;
    source: string;
}

@Injectable()
export class EventDispatcherService {
    constructor(
        private notificationService: NotificationService,
        private auditService: AuditService
    ) { }

    /**
     * Emit a platform event and trigger associated notifications
     */
    async emit(eventType: string, payload: any, source = 'system'): Promise<void> {
        const event: PlatformEvent = {
            type: eventType,
            payload,
            timestamp: new Date(),
            source
        };

        // Log the event for audit trail
        await this.logEvent(event);

        // Trigger notifications based on event type
        await this.triggerNotifications(event);
    }

    /**
     * Log event to audit trail
     */
    private async logEvent(event: PlatformEvent): Promise<void> {
        // This could be enhanced to use a dedicated event log table
        console.log(`[EVENT] ${event.type}`, {
            timestamp: event.timestamp,
            source: event.source,
            payload: event.payload
        });
    }

    /**
     * Trigger notifications based on event type
     */
    private async triggerNotifications(event: PlatformEvent): Promise<void> {
        const { type, payload } = event;

        try {
            switch (type) {
                // Escrow Events
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

                // Dispute Events
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

                // Verification Events
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

                // Listing Events
                case 'listing.approved':
                    await this.handleListingApproved(payload);
                    break;
                case 'listing.rejected':
                    await this.handleListingRejected(payload);
                    break;
                case 'listing.inquiry':
                    await this.handleListingInquiry(payload);
                    break;

                // Transaction Events
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
        } catch (error) {
            console.error(`[EVENT] Error handling event ${type}:`, error);
        }
    }

    // ===== Event Handlers =====

    private async handleEscrowCreated(payload: any) {
        const { transaction_id, buyer_id, seller_id, amount, currency } = payload;

        // Notify buyer
        await this.notificationService.createFromTemplate('ESCROW_CREATED', buyer_id, {
            transaction_id,
            amount,
            currency,
            role: 'buyer'
        });

        // Notify seller
        await this.notificationService.createFromTemplate('ESCROW_CREATED', seller_id, {
            transaction_id,
            amount,
            currency,
            role: 'seller'
        });
    }

    private async handleEscrowFunded(payload: any) {
        const { transaction_id, seller_id, amount, currency } = payload;

        await this.notificationService.createFromTemplate('ESCROW_FUNDED', seller_id, {
            transaction_id,
            amount,
            currency
        });
    }

    private async handleEscrowReleased(payload: any) {
        const { transaction_id, seller_id, amount, currency, settlement_days } = payload;

        await this.notificationService.createFromTemplate('ESCROW_RELEASED', seller_id, {
            transaction_id,
            amount,
            currency,
            settlement_days: settlement_days || 3
        });
    }

    private async handleEscrowRefunded(payload: any) {
        const { transaction_id, buyer_id, amount, currency, reason } = payload;

        await this.notificationService.createFromTemplate('ESCROW_REFUNDED', buyer_id, {
            transaction_id,
            amount,
            currency,
            reason
        });
    }

    private async handleDisputeInitiated(payload: any) {
        const { dispute_id, initiator_id, respondent_id, transaction_id, reason } = payload;

        // Notify respondent
        await this.notificationService.createFromTemplate('DISPUTE_INITIATED', respondent_id, {
            dispute_id,
            transaction_id,
            reason
        });
    }

    private async handleDisputeEvidenceUploaded(payload: any) {
        const { dispute_id, uploader_id, other_party_id, evidence_type } = payload;

        await this.notificationService.createFromTemplate('DISPUTE_EVIDENCE_UPLOADED', other_party_id, {
            dispute_id,
            evidence_type
        });
    }

    private async handleDisputeAssigned(payload: any) {
        const { dispute_id, admin_id, transaction_id } = payload;

        await this.notificationService.createFromTemplate('DISPUTE_ASSIGNED', admin_id, {
            dispute_id,
            transaction_id
        });
    }

    private async handleDisputeResolved(payload: any) {
        const { dispute_id, initiator_id, respondent_id, resolution, notes } = payload;

        // Notify both parties
        for (const user_id of [initiator_id, respondent_id]) {
            await this.notificationService.createFromTemplate('DISPUTE_RESOLVED', user_id, {
                dispute_id,
                resolution,
                notes
            });
        }
    }

    private async handleVerificationRequested(payload: any) {
        const { user_id, scope, listing_id } = payload;

        await this.notificationService.createFromTemplate('VERIFICATION_REQUESTED', user_id, {
            scope,
            listing_id
        });
    }

    private async handleVerificationApproved(payload: any) {
        const { user_id, scope, listing_id } = payload;

        await this.notificationService.createFromTemplate('VERIFICATION_APPROVED', user_id, {
            scope,
            listing_id
        });
    }

    private async handleVerificationRejected(payload: any) {
        const { user_id, scope, rejection_reason, listing_id } = payload;

        await this.notificationService.createFromTemplate('VERIFICATION_REJECTED', user_id, {
            scope,
            rejection_reason,
            listing_id
        });
    }

    private async handleVerificationExpiring(payload: any) {
        const { user_id, document_type, expiry_date } = payload;

        await this.notificationService.createFromTemplate('VERIFICATION_EXPIRING', user_id, {
            document_type,
            expiry_date
        });
    }

    private async handleListingApproved(payload: any) {
        const { listing_id, owner_id, title } = payload;

        await this.notificationService.createFromTemplate('LISTING_APPROVED', owner_id, {
            listing_id,
            title
        });
    }

    private async handleListingRejected(payload: any) {
        const { listing_id, owner_id, title, rejection_reason } = payload;

        await this.notificationService.createFromTemplate('LISTING_REJECTED', owner_id, {
            listing_id,
            title,
            rejection_reason
        });
    }

    private async handleListingInquiry(payload: any) {
        const { listing_id, owner_id, inquirer_name, message } = payload;

        await this.notificationService.createFromTemplate('LISTING_INQUIRY', owner_id, {
            listing_id,
            inquirer_name,
            message
        });
    }

    private async handleTransactionCreated(payload: any) {
        const { transaction_id, buyer_id, seller_id, listing_title, amount, currency } = payload;

        // Notify buyer
        await this.notificationService.createFromTemplate('TRANSACTION_CREATED', buyer_id, {
            transaction_id,
            listing_title,
            amount,
            currency,
            role: 'buyer'
        });

        // Notify seller
        await this.notificationService.createFromTemplate('TRANSACTION_CREATED', seller_id, {
            transaction_id,
            listing_title,
            amount,
            currency,
            role: 'seller'
        });
    }

    private async handlePaymentReminder(payload: any) {
        const { transaction_id, buyer_id, amount, currency, due_date } = payload;

        await this.notificationService.createFromTemplate('PAYMENT_REMINDER', buyer_id, {
            transaction_id,
            amount,
            currency,
            due_date
        });
    }

    private async handleTransactionCompleted(payload: any) {
        const { transaction_id, buyer_id, seller_id, listing_title } = payload;

        // Notify both parties
        for (const user_id of [buyer_id, seller_id]) {
            await this.notificationService.createFromTemplate('TRANSACTION_COMPLETED', user_id, {
                transaction_id,
                listing_title
            });
        }
    }
}
