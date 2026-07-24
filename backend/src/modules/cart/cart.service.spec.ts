import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from '../products/products.service';
import { CartService } from './cart.service';
import { CART_REPOSITORY } from './constants/cart.tokens';
import type { Cart } from './interfaces/cart.interface';

describe('CartService', () => {
  let service: CartService;
  let cart: Cart | null;

  const product = {
    id: 1,
    slug: 'test-phone',
    sku: 'MOB-1',
    title: 'Test phone',
    shortDescription: null,
    description: 'Test phone',
    brand: 'Test',
    category: 'MOBILE' as const,
    price: 100,
    compareAtPrice: null,
    quantity: 3,
    isFeatured: false,
    specifications: null,
    images: [],
  };

  beforeEach(async () => {
    cart = null;
    const repository = {
      findByUserId: jest.fn(() => Promise.resolve(cart)),
      setItemQuantity: jest.fn(
        (userId: number, productId: number, quantity: number) => {
          cart = {
            id: 1,
            userId,
            items: [
              {
                id: 1,
                cartId: 1,
                productId,
                quantity,
                product,
              },
            ],
          };
          return Promise.resolve(cart);
        },
      ),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: CART_REPOSITORY, useValue: repository },
        {
          provide: ProductsService,
          useValue: { getProductById: jest.fn().mockResolvedValue(product) },
        },
      ],
    }).compile();

    service = module.get(CartService);
  });

  it('adds an available product and calculates totals', async () => {
    const result = await service.addItem(7, product.id, 2);

    expect(result.itemCount).toBe(2);
    expect(result.subtotal).toBe(200);
  });

  it('rejects a quantity above available stock', async () => {
    await expect(service.addItem(7, product.id, 4)).rejects.toMatchObject({
      code: 'INSUFFICIENT_STOCK',
    });
  });
});
