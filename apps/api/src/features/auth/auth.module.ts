import { TransactionService } from '@/database';
import { MailModule } from '@/features/mail/mail.module';
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, TransactionService],
})
export class AuthModule {}
