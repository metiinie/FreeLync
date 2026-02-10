import { RiskLevel } from '@prisma/client';
export interface AuditMetadata {
    action: string;
    resourceType: string;
    riskLevel?: RiskLevel;
    captureBeforeState?: boolean;
    captureAfterState?: boolean;
    resourceIdExtractor?: (req: any, res: any) => string;
}
export declare const Audited: (metadata: AuditMetadata) => import("@nestjs/common").CustomDecorator<string>;
