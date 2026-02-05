import { Module } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';

@Module({
  providers: [ListingsService],
  controllers: [ListingsController]
})
export class ListingsModule {}
