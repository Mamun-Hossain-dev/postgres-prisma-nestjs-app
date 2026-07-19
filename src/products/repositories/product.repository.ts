import {
  CreateProductInput,
  NewProductImage,
  Product,
  ProductImage,
  UpdateProductInput,
} from '../interfaces/product.interface';

export interface ProductRepository {
  findAll(): Promise<Product[]>;
  findById(id: number): Promise<Product | null>;
  create(input: CreateProductInput): Promise<Product>;
  update(id: number, input: UpdateProductInput): Promise<Product | null>;
  addImages(id: number, images: NewProductImage[]): Promise<Product | null>;
  findImage(productId: number, imageId: number): Promise<ProductImage | null>;
  deleteImage(productId: number, imageId: number): Promise<void>;
  delete(id: number): Promise<void>;
}
