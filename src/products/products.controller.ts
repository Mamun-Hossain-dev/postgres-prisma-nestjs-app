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
import { ResponseMessage } from '../common/utils/api-response.util';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ResponseMessage('Products fetched successfully')
  findAll() {
    return this.productsService.getAllProducts();
  }

  @Get(':id')
  @ResponseMessage('Product fetched successfully')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getProductById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Product created successfully')
  create(@Body() dto: CreateProductDto) {
    return this.productsService.createProduct(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ResponseMessage('Product updated successfully')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.productsService.updateProduct(id, dto);
  }

  @Delete(':id')
  @ResponseMessage('Product deleted successfully')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.productsService.deleteProduct(id);

    return null;
  }
}
