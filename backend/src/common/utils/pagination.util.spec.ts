import { toPaginatedResult, toRepositoryPagination } from './pagination.util';

describe('pagination utilities', () => {
  it('converts a page to database offset pagination', () => {
    expect(toRepositoryPagination({ page: 3, limit: 20 })).toEqual({
      skip: 40,
      take: 20,
    });
  });

  it('builds pagination metadata', () => {
    expect(
      toPaginatedResult(
        { data: ['item'], totalItems: 21 },
        { page: 3, limit: 10 },
      ),
    ).toEqual({
      data: ['item'],
      meta: {
        page: 3,
        limit: 10,
        totalItems: 21,
        totalPages: 3,
        hasNextPage: false,
        hasPreviousPage: true,
      },
    });
  });
});
