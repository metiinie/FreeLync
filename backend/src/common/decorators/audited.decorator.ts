import { SetMetadata } from '@nestjs/common';
import { RiskLevel } from '@prisma/client';

export interface AuditMetadata {
    action: string;
    resourceType: string;
    riskLevel?: RiskLevel;
    captureBeforeState?: boolean;
    captureAfterState?: boolean;
    resourceIdExtractor?: (req: any, res: any) => string;
}

/**
 * Decorator to mark an endpoint for automatic audit logging
 * 
 * @example
 * @Audited({
 *   action: 'listing.approve',
 *   resourceType: 'Listing',
 *   riskLevel: 'medium',
 *   captureBeforeState: true,
 *   captureAfterState: true,
 * })
 * async approveListing() { ... }
 */
export const Audited = (metadata: AuditMetadata) =>
    SetMetadata('audit', metadata);
