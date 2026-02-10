import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';

@Module({
  imports: [ConfigModule],
  providers: [PaymentService],
  controllers: [PaymentController],
  exports: [PaymentService] // Must export for FinancialModule usage
})
export class PaymentModule { }
