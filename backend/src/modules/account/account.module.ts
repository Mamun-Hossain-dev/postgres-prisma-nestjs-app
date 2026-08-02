import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { ACCOUNT_REPOSITORY } from './account.repository';
import { AccountService } from './account.service';
import { PrismaAccountRepository } from './prisma-account.repository';

@Module({
  controllers: [AccountController],
  providers: [
    AccountService,
    PrismaAccountRepository,
    { provide: ACCOUNT_REPOSITORY, useExisting: PrismaAccountRepository },
  ],
  exports: [AccountService],
})
export class AccountModule {}
