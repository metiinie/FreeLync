import { NotificationService } from '../../notifications/notifications.service';
import { AuditService } from './audit.service';
export interface PlatformEvent {
    type: string;
    payload: any;
    timestamp: Date;
    source: string;
}
export declare class EventDispatcherService {
    private notificationService;
    private auditService;
    constructor(notificationService: NotificationService, auditService: AuditService);
    emit(eventType: string, payload: any, source?: string): Promise<void>;
    private logEvent;
    private triggerNotifications;
    private handleEscrowCreated;
    private handleEscrowFunded;
    private handleEscrowReleased;
    private handleEscrowRefunded;
    private handleDisputeInitiated;
    private handleDisputeEvidenceUploaded;
    private handleDisputeAssigned;
    private handleDisputeResolved;
    private handleVerificationRequested;
    private handleVerificationApproved;
    private handleVerificationRejected;
    private handleVerificationExpiring;
    private handleListingApproved;
    private handleListingRejected;
    private handleListingInquiry;
    private handleTransactionCreated;
    private handlePaymentReminder;
    private handleTransactionCompleted;
}
