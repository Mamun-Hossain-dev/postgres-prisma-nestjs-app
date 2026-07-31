import { Module } from '@nestjs/common';
import { ORDER_REPOSITORY } from './constants/order.tokens';
import { InvoiceService } from './invoices/invoice.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaOrderRepository } from './repositories/prisma-order.repository';

@Module({
  controllers: [OrdersController],
  providers: [
    OrdersService,
    InvoiceService,
    PrismaOrderRepository,
    {
      provide: ORDER_REPOSITORY,
      useExisting: PrismaOrderRepository,
    },
  ],
  exports: [InvoiceService],
})
export class OrdersModule {}
