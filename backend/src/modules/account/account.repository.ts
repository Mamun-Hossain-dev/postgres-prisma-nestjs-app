import type { SaveAddressDto } from './dto/account.dto';

export const ACCOUNT_REPOSITORY = Symbol('ACCOUNT_REPOSITORY');

export interface AccountRepository {
  listAddresses(userId: number): Promise<unknown[]>;
  createAddress(userId: number, input: SaveAddressDto): Promise<unknown>;
  updateAddress(
    userId: number,
    id: number,
    input: SaveAddressDto,
  ): Promise<unknown>;
  deleteAddress(userId: number, id: number): Promise<boolean>;
  listWishlist(userId: number): Promise<unknown[]>;
  addWishlist(userId: number, productId: number): Promise<unknown>;
  removeWishlist(userId: number, productId: number): Promise<boolean>;
  getNotificationPreferences(userId: number): Promise<unknown>;
  updateNotificationPreferences(
    userId: number,
    input: {
      orderUpdates?: boolean;
      productUpdates?: boolean;
      emailUpdates?: boolean;
    },
  ): Promise<unknown>;
  listNotifications(userId: number): Promise<unknown[]>;
  markNotificationRead(userId: number, id: number): Promise<boolean>;
  createNotification(
    userId: number,
    input: { type: string; title: string; message: string },
  ): Promise<void>;
}
