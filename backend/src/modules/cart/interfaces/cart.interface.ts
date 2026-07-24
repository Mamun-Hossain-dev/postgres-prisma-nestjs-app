import type { Product } from '../../products/interfaces/product.interface';

export interface CartItem {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  product: Product;
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
}

export interface CartView extends Cart {
  itemCount: number;
  subtotal: number;
}
