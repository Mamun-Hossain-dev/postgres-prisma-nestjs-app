export const ProductCategory = {
  MOBILE: 'MOBILE',
  LAPTOP: 'LAPTOP',
  TABLET: 'TABLET',
  AUDIO: 'AUDIO',
  WATCH: 'WATCH',
  ACCESSORY: 'ACCESSORY',
} as const;

export type ProductCategory =
  (typeof ProductCategory)[keyof typeof ProductCategory];

export interface Product {
  id: number;
  slug: string;
  sku: string;
  title: string;
  shortDescription: string | null;
  description: string;
  brand: string;
  category: ProductCategory;
  price: number;
  compareAtPrice: number | null;
  quantity: number;
  isFeatured: boolean;
  specifications: unknown;
  images: ProductImage[];
}

export interface ProductImage {
  id: number;
  url: string;
  publicId: string;
  productId: number;
}

export interface NewProductImage {
  url: string;
  publicId: string;
}

export interface CreateProductInput {
  slug: string;
  sku: string;
  title: string;
  shortDescription?: string;
  description: string;
  brand: string;
  category: ProductCategory;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  isFeatured?: boolean;
  specifications?: Record<string, string>;
}

export type CreateProductRequest = Omit<CreateProductInput, 'slug'> & {
  slug?: string;
};

export interface UpdateProductInput {
  slug?: string;
  sku?: string;
  title?: string;
  shortDescription?: string;
  description?: string;
  brand?: string;
  category?: ProductCategory;
  price?: number;
  compareAtPrice?: number;
  quantity?: number;
  isFeatured?: boolean;
  specifications?: Record<string, string>;
}

export type ProductSort = 'newest' | 'price-asc' | 'price-desc' | 'name-asc';

export interface ProductListOptions {
  skip: number;
  take: number;
  search?: string;
  category?: ProductCategory;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  sort?: ProductSort;
}
