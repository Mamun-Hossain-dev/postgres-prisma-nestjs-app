import {
  CreateProductInput,
  NewProductImage,
  Product,
  ProductImage,
  UpdateProductInput,
} from '../interfaces/product.interface';
import type {
  RepositoryPaginatedResult,
  RepositoryPaginationOptions,
} from '../../../common/interfaces/pagination.interface';

export interface ProductRepository {
  findAll(
    options: RepositoryPaginationOptions,
  ): Promise<RepositoryPaginatedResult<Product>>;
  findById(id: number): Promise<Product | null>;
  create(
    input: CreateProductInput,
    images?: NewProductImage[],
  ): Promise<Product>;
  update(
    id: number,
    input: UpdateProductInput,
    images?: NewProductImage[],
  ): Promise<Product | null>;
  addImages(id: number, images: NewProductImage[]): Promise<Product | null>;
  findImage(productId: number, imageId: number): Promise<ProductImage | null>;
  deleteImage(productId: number, imageId: number): Promise<void>;
  delete(id: number): Promise<void>;
}
