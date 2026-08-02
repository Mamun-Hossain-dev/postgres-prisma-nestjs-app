import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { OPERATIONS_REPOSITORY } from './constants/operations.tokens';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';
import { PrismaOperationsRepository } from './repositories/prisma-operations.repository';

@Module({
  imports: [ProductsModule],
  controllers: [OperationsController],
  providers: [
    OperationsService,
    PrismaOperationsRepository,
    {
      provide: OPERATIONS_REPOSITORY,
      useExisting: PrismaOperationsRepository,
    },
  ],
})
export class OperationsModule {}
