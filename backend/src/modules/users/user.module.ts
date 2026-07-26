import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { CachedUserRepository } from './repositories/cached-user.repository';
import { LoggingUserRepository } from './repositories/logging-user.repository';
import { RedisModule } from '../../infrastructure/redis/redis.module';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { UploadsModule } from '../../infrastructure/uploads/uploads.module';
import { USER_REPOSITORY } from './constants/user.tokens';
import { RabbitMqModule } from '../../infrastructure/rabbitmq/rabbitmq.module';
import { UserEventsPublisher } from './events/user-events.publisher';

@Module({
  imports: [RedisModule, UploadsModule, RabbitMqModule],
  providers: [
    UserService,
    UserEventsPublisher,
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
  exports: [UserService, USER_REPOSITORY, UserEventsPublisher],
})
export class UserModule {}
