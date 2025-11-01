import { useCallback, useRef } from 'react';

/**
 * Hook untuk debouncing function calls
 * Mencegah function dipanggil terlalu sering dalam waktu singkat
 */
export function useDebounce<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      // Clear timeout sebelumnya jika ada
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set timeout baru
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  return debouncedCallback;
}

/**
 * Hook untuk throttling function calls
 * Membatasi function hanya bisa dipanggil sekali dalam periode tertentu
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      
      // Jika belum melewati delay, skip call
      if (now - lastCallRef.current < delay) {
        return;
      }

      // Update waktu terakhir dipanggil dan eksekusi callback
      lastCallRef.current = now;
      callback(...args);
    },
    [callback, delay]
  ) as T;

  return throttledCallback;
}