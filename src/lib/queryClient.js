import { QueryClient } from "@tanstack/react-query";
import { STALE_TIME_MS } from "@/lib/queryOptions";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: STALE_TIME_MS || 300000,
    },
  },
});
