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
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  isFeatured: boolean;
  isTrending: boolean;
  isBestSeller: boolean;
  offerStartsAt: string | null;
  offerEndsAt: string | null;
  publishedAt: string;
  specifications: Record<string, string> | null;
  images: ProductImage[];
}

export interface ProductCollections {
  featured: Product[];
  newArrivals: Product[];
  offers: Product[];
  bestSellers: Product[];
  trending: Product[];
  brands: string[];
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
  phone: string | null;
  age?: number;
  role: Role;
  isBlocked: boolean;
  marketingConsent: boolean;
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

export type ContactStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED';

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterSubscriber {
  id: number;
  email: string;
  name: string | null;
  status: 'ACTIVE' | 'UNSUBSCRIBED';
  subscribedAt: string;
}

export interface NewsletterBroadcast {
  id: number;
  subject: string;
  previewText: string | null;
  content: string;
  status: 'SENDING' | 'SENT' | 'PARTIAL' | 'FAILED';
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  sentAt: string | null;
  createdAt: string;
}

export interface PaginatedContactMessages {
  data: ContactMessage[];
  meta: PaginatedProducts['meta'];
}

export interface PaginatedNewsletterSubscribers {
  data: NewsletterSubscriber[];
  meta: PaginatedProducts['meta'];
}

export interface PaginatedNewsletterBroadcasts {
  data: NewsletterBroadcast[];
  meta: PaginatedProducts['meta'];
}
