import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserRepository } from './repositories/user.repository';
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { CachedUserRepository } from './repositories/cached-user.repository';
import { LoggingUserRepository } from './repositories/logging-user.repository';
import { RedisModule } from '../redis/redis.module';
// import { RedisService } from '../redis/redis.service';

@Module({
  imports: [RedisModule],
  providers: [
    UserService,
    PrismaUserRepository,
    CachedUserRepository,
    LoggingUserRepository,
    {
      provide: UserRepository,
      useFactory: (logging: LoggingUserRepository) => logging,
      inject: [LoggingUserRepository],
    },
  ],
  controllers: [UserController],
  exports: [UserService, UserRepository],
})
export class UserModule {}
