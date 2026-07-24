export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface RepositoryPaginationOptions {
  skip: number;
  take: number;
}

export interface RepositoryPaginatedResult<T> {
  data: T[];
  totalItems: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}
