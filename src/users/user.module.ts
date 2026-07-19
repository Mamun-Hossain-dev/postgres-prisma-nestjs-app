import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { CachedUserRepository } from './repositories/cached-user.repository';
import { LoggingUserRepository } from './repositories/logging-user.repository';
import { RedisModule } from '../redis/redis.module';
import { RedisService } from '../redis/redis.service';
import { UploadsModule } from '../uploads/uploads.module';
import { USER_REPOSITORY } from './constants/user.tokens';

@Module({
  imports: [RedisModule, UploadsModule],
  providers: [
    UserService,
    PrismaUserRepository,
    {
      provide: USER_REPOSITORY,
      useFactory: (
        prismaRepository: PrismaUserRepository,
        redisService: RedisService,
      ) => {
        const cachedRepository = new CachedUserRepository(
          redisService,
          prismaRepository,
        );

        return new LoggingUserRepository(cachedRepository);
      },
      inject: [PrismaUserRepository, RedisService],
    },
  ],
  controllers: [UserController],
  exports: [UserService, USER_REPOSITORY],
})
export class UserModule {}
