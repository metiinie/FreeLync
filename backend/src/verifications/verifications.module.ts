import { Module } from '@nestjs/common';
import { VerificationsService } from './verifications.service';
import { VerificationsController } from './verifications.controller';
import { AdminVerificationsController } from './admin-verifications.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [PrismaModule, CommonModule, NotificationsModule],
    controllers: [VerificationsController, AdminVerificationsController],
    providers: [VerificationsService],
    exports: [VerificationsService],
})
export class VerificationsModule { }
