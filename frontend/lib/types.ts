export type Category =
  "MOBILE" | "LAPTOP" | "TABLET" | "AUDIO" | "WATCH" | "ACCESSORY";

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
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isFeatured: boolean;
  isTrending: boolean;
  isBestSeller: boolean;
  offerStartsAt: string | null;
  offerEndsAt: string | null;
  publishedAt: string;
  specifications: Record<string, string> | null;
  images: ProductImage[];
  stockMovements?: StockMovement[];
}

export interface StockMovement {
  id: number;
  previousStock: number;
  newStock: number;
  change: number;
  reason: string;
  createdAt: string;
  adjustedBy?: { name: string };
}

export interface CatalogOperationsSummary {
  categories: Array<{
    category: Category;
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

export interface InventoryPage extends PaginatedProducts {
  data: Array<Product & { stockMovements: StockMovement[] }>;
}

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";
export interface Review {
  id: number;
  rating: number;
  title: string;
  comment: string;
  status: ReviewStatus;
  isVerified: boolean;
  createdAt: string;
  user: { name: string; email?: string };
  product: { id: number; title: string; sku: string };
}
export interface PaginatedReviews {
  data: Review[];
  meta: PaginatedProducts["meta"];
}

export interface Coupon {
  id: number;
  code: string;
  description: string | null;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minimumAmount: number;
  usageLimit: number | null;
  remainingUses: number | null;
  usedCount: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
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

export type Role = "USER" | "SELLER" | "ADMIN";

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
  meta: PaginatedProducts["meta"];
}

export interface AuthResult {
  accessToken: string;
  tokenType: "Bearer";
  user: User;
}

export interface CartItem {
  productId: number;
  quantity: number;
  product: Product;
}

export interface Address {
  id: number;
  label: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  area: string;
  city: string;
  postalCode: string | null;
  deliveryZone: "DHAKA" | "OUTSIDE_DHAKA";
  isDefault: boolean;
}

export interface WishlistItem {
  id: number;
  productId: number;
  createdAt: string;
  product: Product;
}

export interface NotificationPreference {
  orderUpdates: boolean;
  productUpdates: boolean;
  emailUpdates: boolean;
}

export interface AccountNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}

export interface AuthSession {
  id: string;
  device: string;
  ip: string;
  userAgent: string;
  expiresAt: string;
  current: boolean;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export type ContactStatus = "NEW" | "IN_PROGRESS" | "RESOLVED";

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
  status: "ACTIVE" | "UNSUBSCRIBED";
  subscribedAt: string;
}

export interface NewsletterBroadcast {
  id: number;
  subject: string;
  previewText: string | null;
  content: string;
  status: "SENDING" | "SENT" | "PARTIAL" | "FAILED";
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  sentAt: string | null;
  createdAt: string;
}

export interface PaginatedContactMessages {
  data: ContactMessage[];
  meta: PaginatedProducts["meta"];
}

export interface PaginatedNewsletterSubscribers {
  data: NewsletterSubscriber[];
  meta: PaginatedProducts["meta"];
}

export interface PaginatedNewsletterBroadcasts {
  data: NewsletterBroadcast[];
  meta: PaginatedProducts["meta"];
}

export type PaymentStatus =
  "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "REFUNDED";

export type OrderStatus =
  | "PAYMENT_PENDING"
  | "PAYMENT_PROCESSING"
  | "PAID"
  | "COD_CONFIRMED"
  | "PAYMENT_FAILED"
  | "CANCELLED";

export interface OrderItem {
  id: number;
  productId: number | null;
  productTitle: string;
  productSku: string;
  unitAmount: number;
  quantity: number;
  totalAmount: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  customerName: string;
  customerEmail: string;
  couponCode: string | null;
  paymentMethod: "CARD" | "CASH_ON_DELIVERY";
  deliveryZone: "DHAKA" | "OUTSIDE_DHAKA";
  subtotalAmount: number;
  discountAmount: number;
  deliveryCharge: number;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface Payment {
  id: number;
  orderId: number;
  status: PaymentStatus;
  amount: number;
  currency: string;
  failureCode: string | null;
  failureMessage: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  order: Order;
}

export interface CheckoutSession {
  paymentId: number;
  paymentIntentId: string;
  orderId: number;
  orderNumber: string;
  clientSecret: string;
  amount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentMethod: "CARD" | "CASH_ON_DELIVERY";
  deliveryZone: "DHAKA" | "OUTSIDE_DHAKA";
  subtotalAmount: number;
  discountAmount: number;
  deliveryCharge: number;
  orderTotal: number;
  dueOnDelivery: number;
  items: OrderItem[];
}

export interface PaginatedOrders {
  data: Order[];
  meta: PaginatedProducts["meta"];
}
