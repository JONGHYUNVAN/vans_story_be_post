import { PaginateQuery } from 'nestjs-paginate';

export class PaginationQueryDto implements PaginateQuery {
  page?: number;
  limit?: number;
  path: string;
  sortBy?: [string, string][];
  searchBy?: string[];
  search?: string;
  filter?: { [column: string]: string | string[] };
}

