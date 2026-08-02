import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { UploadsService } from '../../infrastructure/uploads/uploads.service';
import { PRODUCT_REPOSITORY } from './constants/product.tokens';
import { ConfigService } from '@nestjs/config';

describe('ProductsService', () => {
  let service: ProductsService;
  const repository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    addImages: jest.fn(),
    findImage: jest.fn(),
    deleteImage: jest.fn(),
    delete: jest.fn(),
  };
  const uploads = {
    uploadImages: jest.fn(),
    deleteFile: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    repository.findAll.mockResolvedValue([]);
    repository.findById.mockResolvedValue(null);
    repository.create.mockResolvedValue({
      id: 1,
      title: 'Test Product',
      price: 10,
      quantity: 1,
    });
    repository.update.mockResolvedValue(null);
    repository.addImages.mockResolvedValue(null);
    repository.findImage.mockResolvedValue(null);
    repository.deleteImage.mockResolvedValue(undefined);
    repository.delete.mockResolvedValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue(4) },
        },
        {
          provide: PRODUCT_REPOSITORY,
          useValue: repository,
        },
        {
          provide: UploadsService,
          useValue: uploads,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects updates that would exceed four total product images', async () => {
    repository.findById.mockResolvedValue({
      id: 1,
      images: [{ id: 1 }, { id: 2 }, { id: 3 }],
    });

    await expect(
      service.updateProduct(1, {}, [
        {
          buffer: Buffer.from('1'),
          mimetype: 'image/png',
          originalname: '1.png',
          size: 1,
        },
        {
          buffer: Buffer.from('2'),
          mimetype: 'image/png',
          originalname: '2.png',
          size: 1,
        },
      ]),
    ).rejects.toMatchObject({ code: 'TOO_MANY_PRODUCT_IMAGES' });
    expect(uploads.uploadImages).not.toHaveBeenCalled();
  });
});
