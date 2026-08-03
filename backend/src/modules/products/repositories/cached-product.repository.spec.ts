import { Logger } from '@nestjs/common';
import type { RedisService } from '../../../infrastructure/redis/redis.service';
import type {
  Product,
  ProductListOptions,
} from '../interfaces/product.interface';
import { CachedProductRepository } from './cached-product.repository';

describe('CachedProductRepository', () => {
  const product = {
    id: 1,
    title: 'Test tablet',
    images: [],
  } as Product;
  const result = { data: [product], totalItems: 1 };

  function createRedis() {
    const values = new Map<string, string>();
    return {
      values,
      get: jest.fn((key: string) => Promise.resolve(values.get(key) ?? null)),
      set: jest.fn((key: string, value: string) => {
        values.set(key, value);
        return Promise.resolve();
      }),
      setMany: jest.fn((entries: Array<{ key: string; value: string }>) => {
        entries.forEach(({ key, value }) => values.set(key, value));
        return Promise.resolve();
      }),
      del: jest.fn((key: string) => {
        values.delete(key);
        return Promise.resolve();
      }),
      deleteByPattern: jest.fn((pattern: string) => {
        const prefix = pattern.replace(/\*$/, '');
        for (const key of values.keys()) {
          if (key.startsWith(prefix)) values.delete(key);
        }
        return Promise.resolve();
      }),
    };
  }

  function createRepository() {
    return {
      findAll: jest.fn().mockResolvedValue(result),
      findById: jest.fn(),
      findCollections: jest.fn(),
      getOperationsSummary: jest.fn(),
      adjustStock: jest.fn(),
      create: jest.fn().mockResolvedValue(product),
      update: jest.fn(),
      delete: jest.fn(),
      addImages: jest.fn(),
      findImage: jest.fn(),
      deleteImage: jest.fn(),
    };
  }

  const options = (publishedBefore: Date): ProductListOptions => ({
    skip: 0,
    take: 12,
    category: 'TABLET',
    status: 'ACTIVE',
    publishedBefore,
    sort: 'newest',
  });

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('reuses a cached product list for the same normalized request', async () => {
    const redis = createRedis();
    const repository = createRepository();
    const cached = new CachedProductRepository(
      redis as unknown as RedisService,
      repository,
    );

    await cached.findAll(options(new Date('2026-08-03T10:30:00.000Z')));
    await expect(
      cached.findAll(options(new Date('2026-08-03T10:30:00.000Z'))),
    ).resolves.toEqual(result);

    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(redis.set).toHaveBeenCalledWith(
      expect.stringMatching(/^product:list:v1:/),
      JSON.stringify(result),
      60,
    );
  });

  it('coalesces concurrent cache misses for the same list', async () => {
    const redis = createRedis();
    const repository = createRepository();
    let resolveLoad!: (value: typeof result) => void;
    repository.findAll.mockReturnValue(
      new Promise((resolve) => {
        resolveLoad = resolve;
      }),
    );
    const cached = new CachedProductRepository(
      redis as unknown as RedisService,
      repository,
    );
    const request = options(new Date('2026-08-03T10:30:01.000Z'));

    const first = cached.findAll(request);
    const second = cached.findAll(request);
    await Promise.resolve();
    resolveLoad(result);

    await expect(Promise.all([first, second])).resolves.toEqual([
      result,
      result,
    ]);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });

  it('invalidates list and collection caches after a product write', async () => {
    const redis = createRedis();
    const repository = createRepository();
    const cached = new CachedProductRepository(
      redis as unknown as RedisService,
      repository,
    );

    await cached.create({} as never);

    expect(redis.deleteByPattern).toHaveBeenCalledWith('product:list:v1:*');
    expect(redis.deleteByPattern).toHaveBeenCalledWith('product:collections:*');
  });

  it('falls back to PostgreSQL when Redis commands fail', async () => {
    const redis = createRedis();
    redis.get.mockRejectedValue(new Error('Redis disconnected'));
    redis.set.mockRejectedValue(new Error('Redis disconnected'));
    const repository = createRepository();
    const cached = new CachedProductRepository(
      redis as unknown as RedisService,
      repository,
    );

    await expect(
      cached.findAll(options(new Date('2026-08-03T10:30:01.000Z'))),
    ).resolves.toEqual(result);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });

  it('discards malformed cache data instead of failing the request', async () => {
    const redis = createRedis();
    redis.get.mockResolvedValueOnce('{broken');
    const repository = createRepository();
    const cached = new CachedProductRepository(
      redis as unknown as RedisService,
      repository,
    );

    await expect(
      cached.findAll(options(new Date('2026-08-03T10:30:00.000Z'))),
    ).resolves.toEqual(result);

    expect(redis.del).toHaveBeenCalled();
    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });
});
