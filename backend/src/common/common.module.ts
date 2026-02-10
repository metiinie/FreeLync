import { Module, Global } from '@nestjs/common';
import { AuditService } from './services/audit.service';
import { PermissionService } from './services/permission.service';
import { AdminSessionService } from './services/admin-session.service';
import { EventDispatcherService } from './services/event-dispatcher.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Global()
@Module({
    imports: [NotificationsModule],
    providers: [
        AuditService,
        PermissionService,
        AdminSessionService,
        EventDispatcherService,
        PrismaService,
    ],
    exports: [
        AuditService,
        PermissionService,
        AdminSessionService,
        EventDispatcherService,
    ],
})
export class CommonModule { }
