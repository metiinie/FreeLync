import { Module } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { DisputesController } from './disputes.controller';
import { AdminDisputesController } from './admin-disputes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [PrismaModule, CommonModule, NotificationsModule],
    providers: [DisputesService],
    controllers: [DisputesController, AdminDisputesController],
    exports: [DisputesService],
})
export class DisputeModule { }
