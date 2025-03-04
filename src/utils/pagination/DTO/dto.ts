export interface PaginationMeta {
  itemsPerPage: number;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  sortBy: Record<string, string>;
  searchBy: string[];
  search: string;
  filter: Record<string, string | string[]>;
}

export interface PaginatedResponseDto<T> {
  data: T[];
  meta: PaginationMeta;
}

