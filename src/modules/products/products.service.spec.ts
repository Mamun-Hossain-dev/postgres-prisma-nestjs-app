import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { UploadsService } from '../../infrastructure/uploads/uploads.service';
import { PRODUCT_REPOSITORY } from './constants/product.tokens';

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PRODUCT_REPOSITORY,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            findById: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              id: 1,
              title: 'Test Product',
              price: 10,
              quantity: 1,
            }),
            update: jest.fn().mockResolvedValue(null),
            addImages: jest.fn().mockResolvedValue(null),
            findImage: jest.fn().mockResolvedValue(null),
            deleteImage: jest.fn().mockResolvedValue(undefined),
            delete: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: UploadsService,
          useValue: {
            uploadImages: jest.fn(),
            deleteFile: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
