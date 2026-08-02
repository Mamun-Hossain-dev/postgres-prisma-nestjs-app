import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ProductRepository } from './repositories/product.repository';
import {
  CreateProductInput,
  CreateProductRequest,
  Product,
  ProductCollections,
  ProductListOptions,
  ProductStatus,
  UpdateProductInput,
  UpdateProductRequest,
} from './interfaces/product.interface';
import { AppException } from '../../common/exceptions/app.exception';
import { UploadsService } from '../../infrastructure/uploads/uploads.service';
import type { FileToStore } from '../../infrastructure/uploads/interfaces/file-storage.interface';
import { PRODUCT_REPOSITORY } from './constants/product.tokens';
import type {
  PaginatedResult,
  PaginationOptions,
} from '../../common/interfaces/pagination.interface';
import {
  toPaginatedResult,
  toRepositoryPagination,
} from '../../common/utils/pagination.util';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private readonly maxProductImages: number;

  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productsRepository: ProductRepository,
    private readonly uploadsService: UploadsService,
    configService: ConfigService,
  ) {
    this.maxProductImages = configService.getOrThrow<number>(
      'cloudinary.maxProductImages',
    );
  }

  async getAllProducts(
    options: PaginationOptions & Omit<ProductListOptions, 'skip' | 'take'>,
  ): Promise<PaginatedResult<Product>> {
    const result = await this.productsRepository.findAll({
      ...toRepositoryPagination(options),
      search: options.search?.trim(),
      category: options.category,
      brand: options.brand?.trim(),
      minPrice: options.minPrice,
      maxPrice: options.maxPrice,
      featured: options.featured,
      status: ProductStatus.ACTIVE,
      onSale: options.onSale,
      publishedBefore: new Date(),
      sort: options.sort,
    });
    return toPaginatedResult(result, options);
  }

  async getAdminProducts(
    options: PaginationOptions & Omit<ProductListOptions, 'skip' | 'take'>,
  ): Promise<PaginatedResult<Product>> {
    const result = await this.productsRepository.findAll({
      ...toRepositoryPagination(options),
      search: options.search?.trim(),
      category: options.category,
      brand: options.brand?.trim(),
      minPrice: options.minPrice,
      maxPrice: options.maxPrice,
      featured: options.featured,
      status: options.status,
      onSale: options.onSale,
      publishedBefore: options.publishedBefore,
      sort: options.sort,
    });
    return toPaginatedResult(result, options);
  }

  getHomeCollections(limit = 8): Promise<ProductCollections> {
    return this.productsRepository.findCollections(limit);
  }

  getOperationsSummary() {
    return this.productsRepository.getOperationsSummary();
  }

  async adjustStock(
    id: number,
    quantity: number,
    adjustedById: number,
    reason: string,
  ) {
    const result = await this.productsRepository.adjustStock(
      id,
      quantity,
      adjustedById,
      reason.trim(),
    );
    if (!result) {
      throw new AppException('Product not found', {
        code: 'PRODUCT_NOT_FOUND',
        status: 404,
      });
    }
    return result;
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

  async getPublicProductById(id: number): Promise<Product> {
    const product = await this.getProductById(id);
    if (
      product.status !== ProductStatus.ACTIVE ||
      new Date(product.publishedAt) > new Date()
    ) {
      throw new AppException('Product not found', {
        code: 'PRODUCT_NOT_FOUND',
        status: 404,
      });
    }
    return product;
  }

  async createProduct(
    input: CreateProductRequest,
    files: FileToStore[] = [],
  ): Promise<Product> {
    this.assertImageLimit(files.length);
    const uploadedImages = await this.uploadsService.uploadImages(files);

    try {
      const normalizedInput: CreateProductInput = {
        ...input,
        slug: this.toSlug(input.slug ?? input.title),
        sku: input.sku.trim().toUpperCase(),
        brand: input.brand.trim(),
        offerStartsAt: input.offerStartsAt
          ? new Date(input.offerStartsAt)
          : undefined,
        offerEndsAt: input.offerEndsAt
          ? new Date(input.offerEndsAt)
          : undefined,
        publishedAt: input.publishedAt
          ? new Date(input.publishedAt)
          : undefined,
      };
      this.validateOffer(normalizedInput);
      return await this.productsRepository.create(
        normalizedInput,
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
    input: UpdateProductRequest,
    files: FileToStore[] = [],
  ): Promise<Product> {
    const existingProduct = await this.getProductById(id);
    this.assertImageLimit(existingProduct.images.length + files.length);
    const uploadedImages = await this.uploadsService.uploadImages(files);
    let updatedProduct: Product | null;

    try {
      const { offerStartsAt, offerEndsAt, publishedAt, ...productInput } =
        input;
      const normalizedInput: UpdateProductInput = {
        ...productInput,
        ...(input.slug ? { slug: this.toSlug(input.slug) } : {}),
        ...(input.sku ? { sku: input.sku.trim().toUpperCase() } : {}),
        ...(input.brand ? { brand: input.brand.trim() } : {}),
        ...(offerStartsAt ? { offerStartsAt: new Date(offerStartsAt) } : {}),
        ...(offerEndsAt ? { offerEndsAt: new Date(offerEndsAt) } : {}),
        ...(publishedAt ? { publishedAt: new Date(publishedAt) } : {}),
      };
      this.validateOffer(normalizedInput, existingProduct);
      updatedProduct = await this.productsRepository.update(
        id,
        normalizedInput,
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

  private toSlug(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private assertImageLimit(imageCount: number): void {
    if (imageCount <= this.maxProductImages) return;

    throw new AppException(
      `A product can have a maximum of ${this.maxProductImages} images`,
      {
        code: 'TOO_MANY_PRODUCT_IMAGES',
        status: 400,
      },
    );
  }

  private validateOffer(
    input: CreateProductInput | UpdateProductInput,
    existing?: Product,
  ): void {
    const price = input.price ?? existing?.price;
    const compareAtPrice =
      input.compareAtPrice === undefined
        ? existing?.compareAtPrice
        : input.compareAtPrice;
    const startsAt =
      input.offerStartsAt === undefined
        ? existing?.offerStartsAt
        : input.offerStartsAt;
    const endsAt =
      input.offerEndsAt === undefined
        ? existing?.offerEndsAt
        : input.offerEndsAt;

    if (
      compareAtPrice !== null &&
      compareAtPrice !== undefined &&
      price !== undefined &&
      compareAtPrice <= price
    ) {
      throw new AppException('Compare-at price must be greater than price', {
        code: 'INVALID_OFFER_PRICE',
        status: 400,
      });
    }

    if (startsAt && endsAt && startsAt >= endsAt) {
      throw new AppException('Offer end must be after its start', {
        code: 'INVALID_OFFER_WINDOW',
        status: 400,
      });
    }
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
