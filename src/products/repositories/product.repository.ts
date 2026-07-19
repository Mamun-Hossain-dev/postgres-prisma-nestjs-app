import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import {
  NewProductImage,
  Product,
  ProductImage,
} from '../interfaces/product.interface';

export abstract class ProductRepository {
  abstract findAll(): Promise<Product[]>;
  abstract findById(id: number): Promise<Product | null>;
  abstract create(dto: CreateProductDto): Promise<Product>;
  abstract update(id: number, dto: UpdateProductDto): Promise<Product | null>;
  abstract addImages(
    id: number,
    images: NewProductImage[],
  ): Promise<Product | null>;
  abstract findImage(
    productId: number,
    imageId: number,
  ): Promise<ProductImage | null>;
  abstract deleteImage(productId: number, imageId: number): Promise<void>;
  abstract delete(id: number): Promise<void>;
}
