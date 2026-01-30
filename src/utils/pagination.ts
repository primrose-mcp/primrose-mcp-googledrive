/**
 * Pagination Utilities
 *
 * Helpers for handling pagination in Google Drive API.
 */

import type { PaginatedResponse, PaginationParams } from '../types/entities.js';

/**
 * Default pagination settings
 */
export const PAGINATION_DEFAULTS = {
  pageSize: 100,
  maxPageSize: 1000,
} as const;

/**
 * Normalize pagination parameters
 */
export function normalizePaginationParams(
  params?: PaginationParams,
  maxPageSize = PAGINATION_DEFAULTS.maxPageSize
): Required<Pick<PaginationParams, 'pageSize'>> & Omit<PaginationParams, 'pageSize'> {
  return {
    pageSize: Math.min(params?.pageSize || PAGINATION_DEFAULTS.pageSize, maxPageSize),
    pageToken: params?.pageToken,
  };
}

/**
 * Create an empty paginated response
 */
export function emptyPaginatedResponse<T>(): PaginatedResponse<T> {
  return {
    items: [],
    hasMore: false,
  };
}

/**
 * Create a paginated response from an array
 */
export function createPaginatedResponse<T>(
  items: T[],
  options: {
    hasMore?: boolean;
    nextPageToken?: string;
  } = {}
): PaginatedResponse<T> {
  return {
    items,
    hasMore: options.hasMore ?? false,
    nextPageToken: options.nextPageToken,
  };
}
