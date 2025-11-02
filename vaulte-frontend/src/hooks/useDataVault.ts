import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWatchContractEvent,
} from 'wagmi';
import { parseEther, parseGwei, type Log } from 'viem';
import { CONTRACT_ADDRESSES, DATA_VAULT_ABI } from '@/constants/contracts';
import { useToast } from '@/components/ui/use-toast';
import { useState, useCallback, useRef, useEffect } from 'react';

export function useDataVault() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { writeContractAsync } = useWriteContract();
  // Indikator update tersedia dari event on-chain
  // Komentar: Kita gunakan manual refresh, bukan auto-refetch, agar tidak memicu loop tak terbatas
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Mendapatkan kategori data milik user
  const {
    data: userCategories,
    isLoading: isLoadingCategories,
    refetch: refetchCategories,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.dataVault as `0x${string}`,
    abi: DATA_VAULT_ABI,
    functionName: 'getUserCategories',
    args: [address],
    query: {
      enabled: !!address,
    },
  });

  // Ekspos fungsi manual refresh agar UI bisa memutuskan kapan re-fetch dilakukan
  // Komentar: Setelah refresh, tandai updateAvailable=false supaya badge/indikator hilang
  const refreshCategories = useCallback(async () => {
    await refetchCategories();
    setUpdateAvailable(false);
  }, [refetchCategories]);

  // Watcher: DataCategoryUpdated (refetch UI saat harga/nama berubah)
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.dataVault as `0x${string}`,
    abi: DATA_VAULT_ABI,
    eventName: 'DataCategoryUpdated',
    onLogs: (logs: Log[]) => {
      // Filter hanya event milik user yang sedang login (owner indexed)
      const related = logs.filter(log => {
        const args = (log as unknown as { args?: { owner?: string } }).args;
        return args?.owner?.toLowerCase?.() === address?.toLowerCase?.();
      });
      if (related.length > 0) {
        // Komentar: Jangan auto-refetch untuk menghindari loop render; tandai update tersedia saja
        toast({
          title: 'Category updated',
          description: 'On-chain update detected. Click refresh to update.',
        });
        setUpdateAvailable(true);
      }
    },
  });

  // Watcher: DataCategoryRegistered (refetch UI saat kategori baru)
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.dataVault as `0x${string}`,
    abi: DATA_VAULT_ABI,
    eventName: 'DataCategoryRegistered',
    onLogs: (logs: Log[]) => {
      const related = logs.filter(log => {
        const args = (log as unknown as { args?: { owner?: string } }).args;
        return args?.owner?.toLowerCase?.() === address?.toLowerCase?.();
      });
      if (related.length > 0) {
        toast({
          title: 'Category registered',
          description: 'New category detected. Click refresh to update.',
        });
        setUpdateAvailable(true);
      }
    },
  });

  // Watcher: DataCategoryDeactivated (refetch UI saat kategori dinonaktifkan)
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.dataVault as `0x${string}`,
    abi: DATA_VAULT_ABI,
    eventName: 'DataCategoryDeactivated',
    onLogs: (logs: Log[]) => {
      const related = logs.filter(log => {
        const args = (log as unknown as { args?: { owner?: string } }).args;
        return args?.owner?.toLowerCase?.() === address?.toLowerCase?.();
      });
      if (related.length > 0) {
        toast({
          title: 'Category deactivated',
          description: 'Status changed on-chain. Click refresh to update.',
        });
        setUpdateAvailable(true);
      }
    },
  });

  // Mendapatkan detail kategori data
  // Gunakan useCallback agar referensi fungsi stabil dan tidak memicu useEffect berulang
  // Komentar: Cache ringan dengan TTL untuk mencegah fetch berulang dan loop
  const cacheRef = useRef<Map<number, { data: unknown; expiresAt: number }>>(
    new Map()
  );
  const inflightRef = useRef<Map<number, Promise<unknown>>>(new Map());
  // Komentar: Simpan toast dalam ref agar fungsi getDataCategory dapat stabil tanpa bergantung pada identitas toast
  const toastRef = useRef(toast);
  useEffect(() => {
    // Update ref saat toast berubah, tanpa memengaruhi identitas fungsi
    toastRef.current = toast;
  }, [toast]);
  const CACHE_TTL_MS = 15_000; // 15 detik cukup untuk dev agar responsif terhadap perubahan

  const getDataCategory = useCallback(async (categoryId: number) => {
    // Komentar (early return): ID tidak valid
    if (!Number.isFinite(categoryId) || categoryId <= 0) return null;

    // 1) Cek cache masih valid
    const cached = cacheRef.current.get(categoryId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    // 2) Dedup in-flight request untuk ID yang sama
    const inflight = inflightRef.current.get(categoryId);
    if (inflight) {
      return inflight;
    }

    // 3) Lakukan fetch dan simpan sebagai in-flight
    const p = (async () => {
      try {
        const result = await fetch(`/api/data-category/${categoryId}`);
        if (result.status === 404) {
          // Komentar: Kategori tidak ada, jangan cache lama — kembalikan null
          return null;
        }
        if (!result.ok) throw new Error('Failed to fetch data category');
        const json = await result.json();
        // Simpan ke cache dengan TTL
        cacheRef.current.set(categoryId, {
          data: json,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
        return json;
      } catch (error) {
        console.error('Error fetching data category:', error);
        // Gunakan toastRef agar tidak membuat fungsi ini berubah identitas tiap render
        toastRef.current({
          title: 'Error',
          description: 'Failed to fetch data category details',
          variant: 'destructive',
        });
        return null;
      } finally {
        // Hapus status in-flight agar request berikutnya dapat berjalan normal
        inflightRef.current.delete(categoryId);
        // Komentar: Pembersihan cache usang ringan (best-effort), untuk mencegah memory bloat
        if (cacheRef.current.size > 100) {
          const now = Date.now();
          for (const [key, val] of cacheRef.current) {
            if (val.expiresAt <= now) cacheRef.current.delete(key);
          }
        }
      }
    })();

    inflightRef.current.set(categoryId, p);
    return p;
  }, []);

  // Fungsi untuk mendaftarkan kategori data baru
  const registerCategory = async (
    name: string,
    pricePerDay: number,
    dataHash: string
  ) => {
    if (!address) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Validasi input agar tidak revert di kontrak
      // - Harga harus > 0
      // - dataHash harus 32 byte (hex 64 chars + prefix 0x)
      if (!name || name.trim().length === 0) {
        // Komentar: Nama kategori wajib diisi untuk kejelasan data
        toast({
          title: 'Error',
          description: 'Nama kategori tidak boleh kosong',
          variant: 'destructive',
        });
        return;
      }
      if (pricePerDay <= 0) {
        // Komentar: Kontrak akan revert jika harga 0, jadi validasi di sini
        toast({
          title: 'Error',
          description: 'Harga per hari harus lebih dari 0',
          variant: 'destructive',
        });
        return;
      }
      const normalizedHash = dataHash.startsWith('0x')
        ? dataHash
        : `0x${dataHash}`;
      if (normalizedHash.length !== 66) {
        // Komentar: bytes32 membutuhkan panjang tepat 32 byte
        toast({
          title: 'Error',
          description: 'Data hash harus bytes32 (64 hex + 0x)',
          variant: 'destructive',
        });
        return;
      }

      // Konversi harga ke wei dengan presisi menggunakan parseEther
      // Komentar: Hindari BigInt(number * 1e18) karena presisi number bisa bermasalah
      const priceInWei = parseEther(String(pricePerDay));

      // Gunakan hash yang sudah dinormalisasi sebagai bytes32
      const dataHashBytes = normalizedHash as `0x${string}`;

      await writeContractAsync({
        address: CONTRACT_ADDRESSES.dataVault as `0x${string}`,
        abi: DATA_VAULT_ABI,
        functionName: 'registerDataCategory',
        args: [name, priceInWei, dataHashBytes],
        // Komentar: Set EIP-1559 gas agar biaya terlihat kecil di MetaMask (dev-net)
        maxFeePerGas: parseGwei('1'),
        maxPriorityFeePerGas: parseGwei('1'),
      });

      toast({
        title: 'Success',
        description: 'Data category registered successfully',
      });

      // Refresh data kategori setelah aksi write — ini eksplisit dan aman
      await refreshCategories();
    } catch (error) {
      console.error('Error registering data category:', error);
      toast({
        title: 'Error',
        description: 'Failed to register data category',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk update kategori data (nama, harga, dataHash)
  const updateCategory = async (
    categoryId: number,
    name: string,
    pricePerDay: number,
    dataHash: string
  ) => {
    if (!address) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return false;
    }

    setIsLoading(true);
    try {
      // Konversi harga ke wei (asumsi input dalam ETH)
      const priceInWei = BigInt(pricePerDay * 1e18);

      // Konversi dataHash ke bytes32
      const dataHashBytes = `0x${dataHash.replace(/^0x/, '')}` as `0x${string}`;

      await writeContractAsync({
        address: CONTRACT_ADDRESSES.dataVault as `0x${string}`,
        abi: DATA_VAULT_ABI,
        functionName: 'updateDataCategory',
        args: [BigInt(categoryId), name, priceInWei, dataHashBytes],
      });

      toast({
        title: 'Success',
        description: 'Data category updated successfully',
      });

      // Refresh data kategori setelah aksi write — ini eksplisit dan aman
      await refreshCategories();
      return true;
    } catch (error) {
      console.error('Error updating data category:', error);
      toast({
        title: 'Error',
        description: 'Failed to update data category',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk toggle active status kategori
  const toggleCategory = async (categoryId: number, currentStatus: boolean) => {
    if (!address) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return false;
    }

    setIsLoading(true);
    try {
      if (currentStatus) {
        // Disable kategori di chain
        await writeContractAsync({
          address: CONTRACT_ADDRESSES.dataVault as `0x${string}`,
          abi: DATA_VAULT_ABI,
          functionName: 'deactivateDataCategory',
          args: [BigInt(categoryId)],
        });

        toast({
          title: 'Success',
          description: 'Category disabled successfully',
        });
        await refreshCategories();
        return true;
      }

      // Jika saat ini nonaktif, belum ada fungsi re-activate di ABI
      toast({
        title: 'Not supported',
        description: 'Re-activate category is not supported by contract yet',
      });
      return false;
    } catch (error) {
      console.error('Error toggling category:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle category status',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk memeriksa apakah user memiliki akses ke kategori data
  const checkPermission = async (categoryId: number) => {
    if (!address) return { hasPermission: false, expiryTime: 0 };

    try {
      const result = await fetch(
        `/api/check-permission?categoryId=${categoryId}&address=${address}`
      );
      if (!result.ok) throw new Error('Failed to check permission');
      return await result.json();
    } catch (error) {
      console.error('Error checking permission:', error);
      return { hasPermission: false, expiryTime: 0 };
    }
  };

  return {
    userCategories: userCategories as number[] | undefined,
    isLoadingCategories,
    getDataCategory,
    registerCategory,
    updateCategory,
    toggleCategory,
    checkPermission,
    isLoading,
    // Ekspos untuk UI manual refresh & indikator update
    refreshCategories,
    updateAvailable,
  };
}
