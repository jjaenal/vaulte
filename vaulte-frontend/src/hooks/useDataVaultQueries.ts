import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { CONTRACT_ADDRESSES, DATA_VAULT_ABI } from '@/constants/contracts';
import { useToast } from '@/components/ui/use-toast';
import { useCallback, useEffect, useRef } from 'react';
import { readContract } from 'wagmi/actions';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polygon, polygonMumbai, hardhat } from 'wagmi/chains';
import { http } from 'viem';

// Types untuk data kategori
export interface DataCategory {
  id: bigint;
  name: string;
  pricePerDay: bigint;
  dataHash: string;
  active: boolean;
  owner: string;
}

export interface CategoryDetails {
  id: number;
  name: string;
  description?: string;
  pricePerDay: number;
  active: boolean;
  // tambahan field dari API
}

/**
 * Query keys untuk TanStack Query
 * Komentar: Gunakan array untuk key yang hierarkis dan mudah invalidate
 */
export const dataVaultKeys = {
  all: ['dataVault'] as const,
  userCategories: (address?: string) => ['dataVault', 'userCategories', address] as const,
  category: (categoryId: number) => ['dataVault', 'category', categoryId] as const,
};

// Wagmi config untuk query functions
// Komentar: Extract config agar bisa dipakai ulang di berbagai query
// Flag env untuk menentukan apakah kita memakai node lokal Hardhat
const useLocalHardhat =
  typeof process !== 'undefined' &&
  process.env.NEXT_PUBLIC_USE_LOCAL_HARDHAT === 'true';

// Komentar (ID): Hindari menyertakan Hardhat dan transport 127.0.0.1
// jika tidak diperlukan, agar tidak ada request berulang ke 127.0.0.1
const wagmiConfig = getDefaultConfig({
  appName: "Vaulté",
  projectId: "3b2e592aaef7497d1a7c1b19629a2d21",
  chains: useLocalHardhat ? [hardhat, polygonMumbai, polygon] : [polygonMumbai, polygon],
  transports: useLocalHardhat
    ? {
        [hardhat.id]: http("http://127.0.0.1:8545"),
        [polygonMumbai.id]: http(),
        [polygon.id]: http(),
      }
    : {
        [polygonMumbai.id]: http(),
        [polygon.id]: http(),
      },
  ssr: true,
});

/**
 * Hook untuk fetch user categories dengan TanStack Query
 * 
 * Keunggulan vs custom hook:
 * - Background refresh otomatis tanpa blocking UI
 * - Deduplication dan caching terpusat
 * - Stale-while-revalidate pattern
 * - Loading states dan error handling built-in
 */
export function useUserCategories(userAddress?: string) {
  const { address } = useAccount();
  const { toast } = useToast();

  return useQuery({
    // Query key yang stabil berdasarkan address
    queryKey: dataVaultKeys.userCategories(userAddress),
    
    // Query function: fetch data dari contract
    queryFn: async (): Promise<DataCategory[]> => {
      if (!address) {
        throw new Error('Wallet not connected');
      }

      try {
        const result = await readContract(wagmiConfig, {
          address: CONTRACT_ADDRESSES.dataVault as `0x${string}`,
          abi: DATA_VAULT_ABI,
          functionName: 'getUserCategories',
          args: [address],
        });

        return result as DataCategory[];
      } catch (error: unknown) {
        console.error('Failed to fetch user categories:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch your data categories',
          variant: 'destructive',
        });
        throw error;
      }
    },
    
    // Hanya jalankan query kalau address tersedia
    enabled: !!address,
    
    // Override default config: no auto refetch, manual only
    staleTime: Infinity, // data dianggap selalu segar sampai di-invalidate
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    
    // Retry logic khusus untuk blockchain
    retry: (failureCount, error) => {
      // Jangan retry untuk wallet connection errors
      if (error instanceof Error && error.message.includes('not connected')) {
        return false;
      }
      // Retry maksimal 2x untuk network errors
      return failureCount < 2;
    },
  });
}

/**
 * Hook untuk fetch single category detail
 */
export function useDataCategory(categoryId: number) {
  const { toast } = useToast();

  return useQuery({
    queryKey: dataVaultKeys.category(categoryId),
    
    queryFn: async () => {
      if (!Number.isFinite(categoryId) || categoryId <= 0) {
        throw new Error('Invalid category ID');
      }

      try {
        const response = await fetch(`/api/data-category/${categoryId}`);
        
        if (response.status === 404) {
          return null; // Category tidak ditemukan
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response.json();
      } catch (error) {
        console.error(`Failed to fetch category ${categoryId}:`, error);
        toast({
          title: 'Error',
          description: `Failed to fetch category details`,
          variant: 'destructive',
        });
        throw error;
      }
    },
    
    enabled: Number.isFinite(categoryId) && categoryId > 0,
    
    // Category details lebih stabil, cache lebih lama
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    
    // Tidak perlu background refresh untuk detail category
    refetchInterval: false,
  });
}

/**
 * Hook untuk manual refresh dan cache management
 */
export function useDataVaultActions() {
  const queryClient = useQueryClient();
  const { address } = useAccount();

  // Manual refresh user categories
  const refreshUserCategories = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: dataVaultKeys.userCategories(address),
    });
  }, [queryClient, address]);

  // Refresh semua data vault queries
  const refreshAll = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: dataVaultKeys.all,
    });
  }, [queryClient]);

  // Update cache setelah write operations (optimistic updates)
  const updateCategoryInCache = useCallback((categoryId: number, updater: (old: CategoryDetails | null) => CategoryDetails | null) => {
    queryClient.setQueryData(
      dataVaultKeys.category(categoryId),
      updater
    );
    
    // Juga update user categories list jika perlu
    queryClient.invalidateQueries({
      queryKey: dataVaultKeys.userCategories(address),
    });
  }, [queryClient, address]);

  return {
    refreshUserCategories,
    refreshAll,
    updateCategoryInCache,
  };
}

/**
 * Hook SSE: subscribe ke backend untuk update kategori per address
 * Saat ada event push, kita invalidate cache kategori agar fetch sekali.
 */
// Hook SSE dengan opsi callback: jika onUpdate disediakan,
// panggil callback tersebut; jika tidak, invalidate cache TanStack Query.
export function useCategoriesSSE(addr?: string, onUpdate?: () => void) {
  const { address } = useAccount();
  const target = addr || address;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const errorNotifiedRef = useRef(false); // Hindari spam toast saat koneksi SSE bermasalah

  useEffect(() => {
    if (!target) return;

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const url = `${backendUrl}/sse/categories/${target}`;
    // Buat koneksi SSE tanpa kredensial; cukup gunakan default
    const es = new EventSource(url);

    // Handler SSE bertipe jelas agar tidak implicit any
    const onUpdateEvent = (ev: MessageEvent<string>) => {
      try {
        // Parse payload JSON untuk digunakan dalam setQueryData
        const categoriesData = JSON.parse(ev.data);
        
        // Jika ada callback khusus, gunakan itu
        if (typeof onUpdate === 'function') {
          onUpdate();
        } else if (Array.isArray(categoriesData)) {
          // Gunakan setQueryData untuk update cache langsung tanpa fetch baru
          // Ini lebih efisien daripada invalidateQueries
          queryClient.setQueryData(
            dataVaultKeys.userCategories(target),
            categoriesData
          );
          console.log('SSE: Update kategori via setQueryData', categoriesData.length);
        } else {
          // Fallback ke invalidate jika format data tidak sesuai ekspektasi
          queryClient.invalidateQueries({ queryKey: dataVaultKeys.userCategories(target) });
        }
        
        // Reset flag error saat koneksi kembali normal
        errorNotifiedRef.current = false;
      } catch (err) {
        console.error('SSE parse error:', err as unknown);
        // Fallback ke invalidate jika parsing gagal
        if (typeof onUpdate === 'function') {
          onUpdate();
        } else {
          queryClient.invalidateQueries({ queryKey: dataVaultKeys.userCategories(target) });
        }
      }
    };

    const onError = (err: Event) => {
      // Abaikan error saat reconnect transient (CONNECTING) agar tidak spam
      if (es.readyState === EventSource.CONNECTING) return;
      console.warn('SSE error (non-transient):', err);
      if (!errorNotifiedRef.current) {
        toast({ title: 'Live update terputus', description: 'SSE error, mencoba tetap jalan tanpa push.' });
        errorNotifiedRef.current = true;
      }
    };

    // Reset indikator error saat koneksi terbuka kembali
    const onOpen = () => {
      errorNotifiedRef.current = false;
    };

    es.addEventListener('update', onUpdateEvent);
    es.addEventListener('error', onError);
    es.addEventListener('open', onOpen);

    return () => {
      try {
        es.removeEventListener('update', onUpdateEvent);
        es.removeEventListener('error', onError);
        es.removeEventListener('open', onOpen);
        es.close();
      } catch {}
    };
  }, [target, queryClient, toast, onUpdate]);
}