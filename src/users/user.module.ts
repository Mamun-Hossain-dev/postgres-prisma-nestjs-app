import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserRepository } from './repositories/user.repository';
import { PrismaUserRepository } from './repositories/prisma-user.repository';

@Module({
  providers: [
    UserService,
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
  ],
  controllers: [UserController],
  exports: [UserService, UserRepository],
})
export class UserModule {}
