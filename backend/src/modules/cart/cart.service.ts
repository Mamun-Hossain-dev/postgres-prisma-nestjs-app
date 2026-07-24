import { Inject, Injectable } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception';
import { ProductsService } from '../products/products.service';
import { CART_REPOSITORY } from './constants/cart.tokens';
import type { Cart, CartView } from './interfaces/cart.interface';
import type { CartRepository } from './repositories/cart.repository';

@Injectable()
export class CartService {
  constructor(
    @Inject(CART_REPOSITORY)
    private readonly cartRepository: CartRepository,
    private readonly productsService: ProductsService,
  ) {}

  async getCart(userId: number): Promise<CartView> {
    const cart = await this.cartRepository.findByUserId(userId);
    return this.toView(cart ?? { id: 0, userId, items: [] });
  }

  async addItem(
    userId: number,
    productId: number,
    quantity: number,
  ): Promise<CartView> {
    const [product, cart] = await Promise.all([
      this.productsService.getProductById(productId),
      this.cartRepository.findByUserId(userId),
    ]);
    const currentQuantity =
      cart?.items.find((item) => item.productId === productId)?.quantity ?? 0;
    const targetQuantity = currentQuantity + quantity;

    this.assertStock(product.quantity, targetQuantity);
    const updated = await this.cartRepository.setItemQuantity(
      userId,
      productId,
      targetQuantity,
    );
    return this.toView(updated);
  }

  async updateItem(
    userId: number,
    productId: number,
    quantity: number,
  ): Promise<CartView> {
    const [product, cart] = await Promise.all([
      this.productsService.getProductById(productId),
      this.cartRepository.findByUserId(userId),
    ]);

    if (!cart?.items.some((item) => item.productId === productId)) {
      throw new AppException('Cart item not found', {
        code: 'CART_ITEM_NOT_FOUND',
        status: 404,
      });
    }

    this.assertStock(product.quantity, quantity);
    return this.toView(
      await this.cartRepository.setItemQuantity(userId, productId, quantity),
    );
  }

  async removeItem(userId: number, productId: number): Promise<CartView> {
    return this.toView(await this.cartRepository.removeItem(userId, productId));
  }

  async clear(userId: number): Promise<CartView> {
    const cart = await this.cartRepository.clear(userId);
    return this.toView(cart ?? { id: 0, userId, items: [] });
  }

  private assertStock(available: number, requested: number): void {
    if (available < requested) {
      throw new AppException('Requested quantity is not available', {
        code: 'INSUFFICIENT_STOCK',
        status: 409,
        details: { available, requested },
      });
    }
  }

  private toView(cart: Cart): CartView {
    return {
      ...cart,
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: cart.items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      ),
    };
  }
}
