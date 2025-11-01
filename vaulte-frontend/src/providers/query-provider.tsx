"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

// Helper: ekstrak HTTP status dari berbagai bentuk error (Fetch/Axios)
function getHttpStatus(error: unknown): number | undefined {
  if (typeof error === "object" && error !== null) {
    const withStatus = error as { status?: unknown };
    if (typeof withStatus.status === "number") {
      return withStatus.status;
    }
    const withResponse = error as { response?: { status?: unknown } };
    const respStatus = withResponse.response?.status;
    if (typeof respStatus === "number") {
      return respStatus;
    }
  }
  return undefined;
}

/**
 * QueryProvider dengan konfigurasi optimal untuk Vaulté
 *
 * Fitur utama:
 * - Stale-while-revalidate pattern untuk performa optimal
 * - Background refresh otomatis tanpa blocking UI
 * - Deduplication dan caching terpusat
 * - Retry logic dan error handling built-in
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Buat QueryClient instance yang stabil (tidak re-create setiap render)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Nonaktifkan refetch otomatis; kita gunakan refresh manual
            // Data dianggap selalu segar sampai di-invalidate
            staleTime: Infinity,

            // Cache data lebih lama untuk menghindari request berulang
            gcTime: 30 * 60 * 1000, // 30 minutes

            // Matikan polling interval global
            refetchInterval: false,

            // Hindari refetch saat fokus atau reconnect
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,

            // Retry 2x dengan exponential backoff untuk network errors
            retry: (failureCount: number, error: unknown) => {
              // Jangan retry untuk 4xx errors (client errors)
              const status = getHttpStatus(error);
              if (typeof status === "number" && status >= 400 && status < 500) {
                return false;
              }
              // Retry maksimal 2x untuk network/server errors
              return failureCount < 2;
            },

            // Exponential backoff: 1s, 2s, 4s
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // Retry mutations 1x saja (write operations lebih sensitif)
            retry: 1,
            retryDelay: 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools hanya muncul di development */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={true} position="bottom" />
      )}
    </QueryClientProvider>
  );
}
