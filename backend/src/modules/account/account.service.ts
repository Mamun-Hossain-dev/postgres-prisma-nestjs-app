import { Inject, Injectable } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception';
import {
  ACCOUNT_REPOSITORY,
  type AccountRepository,
} from './account.repository';
import type {
  SaveAddressDto,
  UpdateNotificationPreferencesDto,
} from './dto/account.dto';

@Injectable()
export class AccountService {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly repository: AccountRepository,
  ) {}

  listAddresses(userId: number) {
    return this.repository.listAddresses(userId);
  }
  createAddress(userId: number, input: SaveAddressDto) {
    return this.repository.createAddress(userId, input);
  }
  async updateAddress(userId: number, id: number, input: SaveAddressDto) {
    const address = await this.repository.updateAddress(userId, id, input);
    if (!address) throw this.notFound('ADDRESS_NOT_FOUND', 'Address not found');
    return address;
  }
  async deleteAddress(userId: number, id: number) {
    if (!(await this.repository.deleteAddress(userId, id))) {
      throw this.notFound('ADDRESS_NOT_FOUND', 'Address not found');
    }
  }
  listWishlist(userId: number) {
    return this.repository.listWishlist(userId);
  }
  async addWishlist(userId: number, productId: number) {
    try {
      return await this.repository.addWishlist(userId, productId);
    } catch {
      throw this.notFound('PRODUCT_NOT_FOUND', 'Product not found');
    }
  }
  async removeWishlist(userId: number, productId: number) {
    if (!(await this.repository.removeWishlist(userId, productId))) {
      throw this.notFound('WISHLIST_ITEM_NOT_FOUND', 'Wishlist item not found');
    }
  }
  getNotificationPreferences(userId: number) {
    return this.repository.getNotificationPreferences(userId);
  }
  updateNotificationPreferences(
    userId: number,
    input: UpdateNotificationPreferencesDto,
  ) {
    return this.repository.updateNotificationPreferences(userId, input);
  }
  listNotifications(userId: number) {
    return this.repository.listNotifications(userId);
  }
  async markNotificationRead(userId: number, id: number) {
    if (!(await this.repository.markNotificationRead(userId, id))) {
      throw this.notFound('NOTIFICATION_NOT_FOUND', 'Notification not found');
    }
  }
  createNotification(
    userId: number,
    input: { type: string; title: string; message: string },
  ) {
    return this.repository.createNotification(userId, input);
  }
  private notFound(code: string, message: string) {
    return new AppException(message, { code, status: 404 });
  }
}
