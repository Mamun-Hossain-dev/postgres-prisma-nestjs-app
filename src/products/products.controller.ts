import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { createApiResponse } from '../common/utils/api-response.util';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll() {
    return createApiResponse(
      'Products fetched successfully',
      this.productsService.getAllProducts(),
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return createApiResponse(
      'Product fetched successfully',
      this.productsService.getProductById(id),
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateProductDto) {
    return createApiResponse(
      'Product created successfully',
      this.productsService.createProduct(dto),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return createApiResponse(
      'Product updated successfully',
      this.productsService.updateProduct(id, dto),
    );
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.productsService.deleteProduct(id);

    return createApiResponse('Product deleted successfully', null);
  }
}
