import type { OrderStatus } from '../../payments/interfaces/payment.interface';

export interface AnalyticsOverview {
  revenue: {
    total: number;
    today: number;
    last30Days: number;
    averageOrderValue: number;
  };
  orders: {
    total: number;
    last30Days: number;
    pendingFulfilment: number;
    byStatus: Record<OrderStatus, number>;
  };
  customers: {
    total: number;
    newLast30Days: number;
  };
  salesTrend: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  topProducts: Array<{
    productId: number | null;
    title: string;
    sku: string;
    unitsSold: number;
    revenue: number;
  }>;
  paymentSplit: {
    CARD: { count: number; amount: number };
    CASH_ON_DELIVERY: { count: number; amount: number };
  };
}
