import type { ProductsService } from '../products/products.service';
import { OperationsService } from './operations.service';
import type { OperationsRepository } from './repositories/operations.repository';

describe('OperationsService', () => {
  const repository = {
    createCoupon: jest.fn(),
    createReview: jest.fn(),
  } as unknown as jest.Mocked<OperationsRepository>;
  const productsService = {
    adjustStock: jest.fn(),
  } as unknown as jest.Mocked<ProductsService>;
  const service = new OperationsService(repository, productsService);

  beforeEach(() => jest.clearAllMocks());

  it('records inventory adjustments through the product repository chain', async () => {
    productsService.adjustStock.mockResolvedValue({ id: 1 } as never);

    await service.adjustStock(4, 12, 7, 'Counted in warehouse');

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(productsService.adjustStock).toHaveBeenCalledWith(
      4,
      12,
      7,
      'Counted in warehouse',
    );
  });

  it('rejects percentage coupons above 100 percent', () => {
    expect(() =>
      service.createCoupon({
        code: 'TOO-MUCH',
        type: 'PERCENTAGE',
        value: 101,
        minimumAmount: 0,
        isActive: true,
      }),
    ).toThrow('Percentage discount cannot exceed 100');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.createCoupon).not.toHaveBeenCalled();
  });

  it('delegates verified review creation to persistence', async () => {
    const input = { rating: 5, title: 'Excellent', comment: 'Worth buying.' };
    repository.createReview.mockResolvedValue({ id: 9 });

    await service.createReview(3, 8, input);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.createReview).toHaveBeenCalledWith(3, 8, input);
  });
});
