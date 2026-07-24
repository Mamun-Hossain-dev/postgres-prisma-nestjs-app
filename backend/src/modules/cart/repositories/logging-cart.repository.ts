import { Injectable, Logger } from '@nestjs/common';
import type { CartRepository } from './cart.repository';

@Injectable()
export class LoggingCartRepository implements CartRepository {
  private readonly logger = new Logger(LoggingCartRepository.name);

  constructor(private readonly repository: CartRepository) {}

  findByUserId(userId: number) {
    this.logger.log(`Fetching cart for user ${userId}`);
    return this.repository.findByUserId(userId);
  }

  setItemQuantity(userId: number, productId: number, quantity: number) {
    this.logger.log(
      `Setting product ${productId} quantity in user ${userId} cart`,
    );
    return this.repository.setItemQuantity(userId, productId, quantity);
  }

  removeItem(userId: number, productId: number) {
    this.logger.log(`Removing product ${productId} from user ${userId} cart`);
    return this.repository.removeItem(userId, productId);
  }

  clear(userId: number) {
    this.logger.log(`Clearing cart for user ${userId}`);
    return this.repository.clear(userId);
  }
}
