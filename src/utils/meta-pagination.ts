export interface PaginationMeta {
  currentPage: number;
  limit: number;
  totalPages: number;
  totalResults: number;
  nextPage: number | null;
  previousPage: number | null;
  firstPage: number;
  lastPage: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export function generatePaginationMeta(
  limit: number,
  page: number,
  totalCount: number,
): PaginationMeta {
  const totalResults = totalCount;
  const currentPage = page;
  const totalPages = Math.ceil(totalResults / limit);
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;
  const previousPage = currentPage > 1 ? currentPage - 1 : null;
  const firstPage = 1;
  const lastPage = totalPages;
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  return {
    currentPage,
    limit,
    totalPages,
    totalResults,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    hasPreviousPage,
    hasNextPage,
  };
}
