import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../../infrastructure/redis/redis.module';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CachedProductRepository } from './repositories/cached-product.repository';
import { LoggingProductRepository } from './repositories/logging-product.repository';
import { PrismaProductRepository } from './repositories/prisma-product.repository';
import { UploadsModule } from '../../infrastructure/uploads/uploads.module';
import { PRODUCT_REPOSITORY } from './constants/product.tokens';

@Module({
  imports: [AuthModule, RedisModule, UploadsModule],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    PrismaProductRepository,
    {
      provide: PRODUCT_REPOSITORY,
      useFactory: (
        prismaRepository: PrismaProductRepository,
        redisService: RedisService,
      ) => {
        const cachedRepository = new CachedProductRepository(
          redisService,
          prismaRepository,
        );

        return new LoggingProductRepository(cachedRepository);
      },
      inject: [PrismaProductRepository, RedisService],
    },
  ],
})
export class ProductsModule {}
