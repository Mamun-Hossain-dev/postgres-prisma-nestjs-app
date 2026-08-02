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

export const ProductStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;

export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

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
  status: ProductStatus;
  isFeatured: boolean;
  isTrending: boolean;
  isBestSeller: boolean;
  offerStartsAt: Date | null;
  offerEndsAt: Date | null;
  publishedAt: Date;
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
  status?: ProductStatus;
  isFeatured?: boolean;
  isTrending?: boolean;
  isBestSeller?: boolean;
  offerStartsAt?: Date;
  offerEndsAt?: Date;
  publishedAt?: Date;
  specifications?: Record<string, string>;
}

export type CreateProductRequest = Omit<
  CreateProductInput,
  'slug' | 'offerStartsAt' | 'offerEndsAt' | 'publishedAt'
> & {
  slug?: string;
  offerStartsAt?: string;
  offerEndsAt?: string;
  publishedAt?: string;
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
  status?: ProductStatus;
  isFeatured?: boolean;
  isTrending?: boolean;
  isBestSeller?: boolean;
  offerStartsAt?: Date | null;
  offerEndsAt?: Date | null;
  publishedAt?: Date;
  specifications?: Record<string, string>;
}

export type UpdateProductRequest = Omit<
  UpdateProductInput,
  'offerStartsAt' | 'offerEndsAt' | 'publishedAt'
> & {
  offerStartsAt?: string;
  offerEndsAt?: string;
  publishedAt?: string;
};

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
  status?: ProductStatus;
  onSale?: boolean;
  publishedBefore?: Date;
  sort?: ProductSort;
}

export interface ProductCollections {
  featured: Product[];
  newArrivals: Product[];
  offers: Product[];
  bestSellers: Product[];
  trending: Product[];
  brands: string[];
}

export interface CatalogOperationsSummary {
  categories: Array<{
    category: ProductCategory;
    productCount: number;
    stockCount: number;
  }>;
  brands: Array<{ brand: string; productCount: number; stockCount: number }>;
  inventory: {
    totalProducts: number;
    totalUnits: number;
    lowStockProducts: number;
    outOfStockProducts: number;
  };
}

export interface StockAdjustment {
  product: Product;
  movement: {
    id: number;
    previousStock: number;
    newStock: number;
    change: number;
    reason: string;
    createdAt: Date;
  };
}
