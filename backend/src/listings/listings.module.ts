import { Module } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadModule } from '../upload/upload.module';
import { AdminListingsController } from './admin-listings.controller';

@Module({
  imports: [PrismaModule, UploadModule],
  controllers: [ListingsController, AdminListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule { }
