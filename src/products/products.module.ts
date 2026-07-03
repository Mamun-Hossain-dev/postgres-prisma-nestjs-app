import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { InMemoryProductRepository } from './repositories/in-memory-product.repository';
import { ProductRepository } from './repositories/product.repository';

@Module({
  controllers: [ProductsController],
  providers: [
    ProductsService,

    {
      provide: ProductRepository,
      useClass: InMemoryProductRepository,
    },
  ],
})
export class ProductsModule {}
