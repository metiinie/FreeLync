import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ListingsModule } from './listings/listings.module';
import { TransactionsModule } from './transactions/transactions.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FavoritesModule } from './favorites/favorites.module';
import { InquiriesModule } from './inquiries/inquiries.module';
import { PaymentModule } from './payment/payment.module';
import { UploadModule } from './upload/upload.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { DisputeModule } from './disputes/disputes.module';
import { VerificationsModule } from './verifications/verifications.module';
import { FinancialModule } from './financial/financial.module';
import { CommonModule } from './common/common.module';
import { AdminIdentityMiddleware } from './common/middleware/admin-identity.middleware';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ListingsModule,
    TransactionsModule,
    NotificationsModule,
    FavoritesModule,
    InquiriesModule,
    PaymentModule,
    UploadModule,
    CommonModule,
    DisputeModule,
    VerificationsModule,
    FinancialModule,
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AdminIdentityMiddleware)
      .forRoutes('admin/*');
  }
}
