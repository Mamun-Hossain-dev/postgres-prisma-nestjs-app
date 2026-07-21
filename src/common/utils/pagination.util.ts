import type {
  PaginatedResult,
  PaginationOptions,
  RepositoryPaginatedResult,
  RepositoryPaginationOptions,
} from '../interfaces/pagination.interface';

export function toRepositoryPagination(
  options: PaginationOptions,
): RepositoryPaginationOptions {
  return {
    skip: (options.page - 1) * options.limit,
    take: options.limit,
  };
}

export function toPaginatedResult<T>(
  result: RepositoryPaginatedResult<T>,
  options: PaginationOptions,
): PaginatedResult<T> {
  const totalPages = Math.ceil(result.totalItems / options.limit);

  return {
    data: result.data,
    meta: {
      page: options.page,
      limit: options.limit,
      totalItems: result.totalItems,
      totalPages,
      hasNextPage: options.page < totalPages,
      hasPreviousPage: options.page > 1,
    },
  };
}
