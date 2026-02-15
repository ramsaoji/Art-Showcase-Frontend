/**
 * Shared React Query / tRPC options to avoid refetch on window focus (minimize/restore)
 * and to keep data fresh without unnecessary network requests.
 * Use these for all tRPC useQuery calls so behaviour is consistent and efficient.
 */

/** 5 minutes — data considered fresh; no refetch on tab switch or minimize/restore */
export const STALE_TIME_MS = 5 * 60 * 1000;

/** Options to pass to useQuery so we don't refetch when user returns to the tab */
export const NO_REFETCH_ON_FOCUS = {
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  staleTime: STALE_TIME_MS,
};

/** Shorter stale time for admin lists (2 min) so admins see relatively fresh data after mutations */
export const ADMIN_LIST_STALE_MS = 2 * 60 * 1000;

export const ADMIN_LIST_QUERY_OPTIONS = {
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  staleTime: ADMIN_LIST_STALE_MS,
};
