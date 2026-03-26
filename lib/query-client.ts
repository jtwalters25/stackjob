import { QueryClient } from "@tanstack/react-query";

export const queryClientConfig = {
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests once
      retry: 1,
      // Refetch on window focus in production only
      refetchOnWindowFocus: process.env.NODE_ENV === "production",
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
};

export function makeQueryClient() {
  return new QueryClient(queryClientConfig);
}
