import type { AccountRepository } from './account.repository';
import { AccountService } from './account.service';

describe('AccountService', () => {
  const repository = {
    listAddresses: jest.fn(),
    createAddress: jest.fn(),
    updateAddress: jest.fn(),
    deleteAddress: jest.fn(),
    listWishlist: jest.fn(),
    addWishlist: jest.fn(),
    removeWishlist: jest.fn(),
    getNotificationPreferences: jest.fn(),
    updateNotificationPreferences: jest.fn(),
    listNotifications: jest.fn(),
    markNotificationRead: jest.fn(),
    createNotification: jest.fn(),
  } as unknown as jest.Mocked<AccountRepository>;

  beforeEach(() => jest.clearAllMocks());

  it('keeps addresses scoped to the authenticated user', async () => {
    repository.listAddresses.mockResolvedValue([{ id: 1 }]);
    const service = new AccountService(repository);

    await expect(service.listAddresses(7)).resolves.toEqual([{ id: 1 }]);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.listAddresses).toHaveBeenCalledWith(7);
  });

  it('returns a stable error when removing another user wishlist item', async () => {
    repository.removeWishlist.mockResolvedValue(false);
    const service = new AccountService(repository);

    await expect(service.removeWishlist(7, 99)).rejects.toMatchObject({
      code: 'WISHLIST_ITEM_NOT_FOUND',
      status: 404,
    });
  });
});
