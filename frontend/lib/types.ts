export type Category =
  'MOBILE' | 'LAPTOP' | 'TABLET' | 'AUDIO' | 'WATCH' | 'ACCESSORY';

export interface ProductImage {
  id: number;
  url: string;
}

export interface Product {
  id: number;
  slug: string;
  sku: string;
  title: string;
  shortDescription: string | null;
  description: string;
  brand: string;
  category: Category;
  price: number;
  compareAtPrice: number | null;
  quantity: number;
  isFeatured: boolean;
  specifications: Record<string, string> | null;
  images: ProductImage[];
}

export interface PaginatedProducts {
  data: Product[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export type Role = 'USER' | 'SELLER' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
  role: Role;
  isBlocked: boolean;
  profileImageUrl: string | null;
}

export interface PaginatedUsers {
  data: User[];
  meta: PaginatedProducts['meta'];
}

export interface AuthResult {
  accessToken: string;
  tokenType: 'Bearer';
  user: User;
}

export interface Cart {
  id: number;
  userId: number;
  itemCount: number;
  subtotal: number;
  items: Array<{
    id: number;
    productId: number;
    quantity: number;
    product: Product;
  }>;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}
