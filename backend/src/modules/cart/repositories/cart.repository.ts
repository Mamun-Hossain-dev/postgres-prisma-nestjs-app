import type { Cart } from '../interfaces/cart.interface';

export interface CartRepository {
  findByUserId(userId: number): Promise<Cart | null>;
  setItemQuantity(
    userId: number,
    productId: number,
    quantity: number,
  ): Promise<Cart>;
  removeItem(userId: number, productId: number): Promise<Cart>;
  clear(userId: number): Promise<Cart | null>;
}
