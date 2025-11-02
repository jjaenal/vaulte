/**
 * Utility untuk retry API calls dengan exponential backoff
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

export async function retryApiCall<T>(
  apiCall: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error as Error;

      // Jika ini adalah attempt terakhir, throw error
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Hitung delay untuk retry berikutnya (exponential backoff)
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      );

      // Tambahkan jitter untuk menghindari thundering herd
      const jitter = Math.random() * 0.1 * delay;
      const finalDelay = delay + jitter;

      console.log(
        `API call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(finalDelay)}ms...`
      );

      await new Promise(resolve => setTimeout(resolve, finalDelay));
    }
  }

  throw lastError!;
}

/**
 * Utility untuk handle API errors dengan user-friendly messages
 */
export function getApiErrorMessage(error: unknown): string {
  const err = error as
    | { response?: { status?: number }; message?: string }
    | undefined;
  if (err?.response?.status === 429) {
    return 'Terlalu banyak permintaan. Silakan coba lagi dalam beberapa saat.';
  }

  if (err?.response?.status === 404) {
    return 'Data tidak ditemukan.';
  }

  if ((err?.response?.status ?? 0) >= 500) {
    return 'Terjadi kesalahan server. Silakan coba lagi nanti.';
  }

  if (err?.message?.includes('Failed to fetch')) {
    return 'Koneksi bermasalah. Periksa koneksi internet Anda.';
  }

  return err?.message || 'Terjadi kesalahan yang tidak diketahui.';
}
