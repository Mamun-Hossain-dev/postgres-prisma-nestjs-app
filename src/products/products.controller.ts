import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/interfaces/user.interface';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ResponseMessage } from '../common/utils/api-response.util';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ImageFilesValidationPipe } from '../uploads/pipes/image-files-validation.pipe';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  @ResponseMessage('Products fetched successfully')
  findAll() {
    return this.productsService.getAllProducts();
  }

  @Public()
  @Get(':id')
  @ResponseMessage('Product fetched successfully')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getProductById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  @ResponseMessage('Product created successfully')
  create(@Body() dto: CreateProductDto) {
    return this.productsService.createProduct(dto);
  }

  @Post(':id/images')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  @UseInterceptors(FilesInterceptor('files'))
  @ResponseMessage('Product images uploaded successfully')
  addImages(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles(ImageFilesValidationPipe) files: Express.Multer.File[],
  ) {
    return this.productsService.addImages(id, files);
  }

  @Delete(':id/images/:imageId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  @ResponseMessage('Product image removed successfully')
  removeImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.productsService.removeImage(id, imageId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  @ResponseMessage('Product updated successfully')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.productsService.updateProduct(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  @ResponseMessage('Product deleted successfully')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.productsService.deleteProduct(id);

    return null;
  }
}
