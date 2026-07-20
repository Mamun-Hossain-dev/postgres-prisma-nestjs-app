import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ProductRepository } from './repositories/product.repository';
import {
  CreateProductInput,
  Product,
  UpdateProductInput,
} from './interfaces/product.interface';
import { AppException } from '../../common/exceptions/app.exception';
import { UploadsService } from '../../infrastructure/uploads/uploads.service';
import type { FileToStore } from '../../infrastructure/uploads/interfaces/file-storage.interface';
import { PRODUCT_REPOSITORY } from './constants/product.tokens';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productsRepository: ProductRepository,
    private readonly uploadsService: UploadsService,
  ) {}

  async getAllProducts(): Promise<Product[]> {
    return await this.productsRepository.findAll();
  }

  async getProductById(id: number): Promise<Product> {
    const product = await this.productsRepository.findById(id);

    if (!product) {
      throw new AppException('Product not found', {
        code: 'PRODUCT_NOT_FOUND',
        status: 404,
      });
    }

    return product;
  }

  async createProduct(
    input: CreateProductInput,
    files: FileToStore[] = [],
  ): Promise<Product> {
    const uploadedImages = await this.uploadsService.uploadImages(files);

    try {
      return await this.productsRepository.create(
        input,
        uploadedImages.map(({ url, publicId }) => ({ url, publicId })),
      );
    } catch (error) {
      await this.deleteFilesSafely(
        uploadedImages.map(({ publicId }) => publicId),
      );
      throw error;
    }
  }

  async updateProduct(
    id: number,
    input: UpdateProductInput,
    files: FileToStore[] = [],
  ): Promise<Product> {
    await this.getProductById(id);
    const uploadedImages = await this.uploadsService.uploadImages(files);
    let updatedProduct: Product | null;

    try {
      updatedProduct = await this.productsRepository.update(
        id,
        input,
        uploadedImages.map(({ url, publicId }) => ({ url, publicId })),
      );
    } catch (error) {
      await this.deleteFilesSafely(
        uploadedImages.map(({ publicId }) => publicId),
      );
      throw error;
    }

    if (!updatedProduct) {
      await this.deleteFilesSafely(
        uploadedImages.map(({ publicId }) => publicId),
      );
      throw new AppException('Product not found', {
        code: 'PRODUCT_NOT_FOUND',
        status: 404,
      });
    }

    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    const product = await this.productsRepository.findById(id);
    if (!product) {
      throw new AppException('Product not found', {
        code: 'PRODUCT_NOT_FOUND',
        status: 404,
      });
    }

    await this.productsRepository.delete(id);
    await this.deleteFilesSafely(product.images.map((image) => image.publicId));
  }

  async removeImage(productId: number, imageId: number): Promise<Product> {
    await this.getProductById(productId);
    const image = await this.productsRepository.findImage(productId, imageId);

    if (!image) {
      throw new AppException('Product image not found', {
        code: 'PRODUCT_IMAGE_NOT_FOUND',
        status: 404,
      });
    }

    await this.productsRepository.deleteImage(productId, imageId);
    await this.deleteFilesSafely([image.publicId]);
    return this.getProductById(productId);
  }

  private productNotFoundException() {
    return new AppException('Product not found', {
      code: 'PRODUCT_NOT_FOUND',
      status: 404,
    });
  }

  private async deleteFilesSafely(publicIds: string[]): Promise<void> {
    const results = await Promise.allSettled(
      publicIds.map((publicId) => this.uploadsService.deleteFile(publicId)),
    );

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        this.logger.warn(
          `Cloudinary cleanup failed for ${publicIds[index]}`,
          result.reason,
        );
      }
    });
  }
}
