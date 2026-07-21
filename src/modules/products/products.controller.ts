import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../users/interfaces/user.interface';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ResponseMessage } from '../../common/utils/api-response.util';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ImageFilesValidationPipe } from '../../infrastructure/uploads/pipes/image-files-validation.pipe';
import { toFileToStore } from '../../infrastructure/uploads/utils/multer-file.util';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  @ResponseMessage('Products fetched successfully')
  findAll(@Query() query: PaginationQueryDto) {
    return this.productsService.getAllProducts(query);
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
  @UseInterceptors(FilesInterceptor('images'))
  @ResponseMessage('Product created successfully')
  create(
    @Body() dto: CreateProductDto,
    @UploadedFiles(ImageFilesValidationPipe) images: Express.Multer.File[],
  ) {
    return this.productsService.createProduct(dto, images.map(toFileToStore));
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
  @UseInterceptors(FilesInterceptor('images'))
  @ResponseMessage('Product updated successfully')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @UploadedFiles(ImageFilesValidationPipe) images: Express.Multer.File[],
  ) {
    return this.productsService.updateProduct(
      id,
      dto,
      images.map(toFileToStore),
    );
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
