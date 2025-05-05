export interface PaginationMeta {
  totalItems: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
} 