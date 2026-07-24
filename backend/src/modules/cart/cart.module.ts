import { Module } from '@nestjs/common';
import { RedisModule } from '../../infrastructure/redis/redis.module';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { ProductsModule } from '../products/products.module';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CART_REPOSITORY } from './constants/cart.tokens';
import { CachedCartRepository } from './repositories/cached-cart.repository';
import { LoggingCartRepository } from './repositories/logging-cart.repository';
import { PrismaCartRepository } from './repositories/prisma-cart.repository';

@Module({
  imports: [ProductsModule, RedisModule],
  controllers: [CartController],
  providers: [
    CartService,
    PrismaCartRepository,
    {
      provide: CART_REPOSITORY,
      useFactory: (
        prismaRepository: PrismaCartRepository,
        redisService: RedisService,
      ) =>
        new LoggingCartRepository(
          new CachedCartRepository(redisService, prismaRepository),
        ),
      inject: [PrismaCartRepository, RedisService],
    },
  ],
})
export class CartModule {}
