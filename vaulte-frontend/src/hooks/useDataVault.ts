import { useAccount, useReadContract, useWriteContract, useWatchContractEvent } from 'wagmi';
import type { Log } from 'viem';
import { CONTRACT_ADDRESSES, DATA_VAULT_ABI } from '@/constants/contracts';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';

export function useDataVault() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { writeContractAsync } = useWriteContract();

  // Mendapatkan kategori data milik user
  const { data: userCategories, isLoading: isLoadingCategories, refetch: refetchCategories } = useReadContract({
    address: CONTRACT_ADDRESSES.dataVault as `0x${string}`,
    abi: DATA_VAULT_ABI,
    functionName: 'getUserCategories',
    args: [address],
    query: {
      enabled: !!address,
    },
  });

  // Watcher: DataCategoryUpdated (refetch UI saat harga/nama berubah)
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.dataVault as `0x${string}`,
    abi: DATA_VAULT_ABI,
    eventName: 'DataCategoryUpdated',
    onLogs: (logs: Log[]) => {
      // Filter hanya event milik user yang sedang login (owner indexed)
      const related = logs.filter((log) => {
        const args = (log as unknown as { args?: { owner?: string } }).args;
        return args?.owner?.toLowerCase?.() === address?.toLowerCase?.();
      });
      if (related.length > 0) {
        toast({ title: 'Category updated', description: 'On-chain update detected. Refreshing...', });
        refetchCategories();
      }
    },
  });

  // Watcher: DataCategoryRegistered (refetch UI saat kategori baru)
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.dataVault as `0x${string}`,
    abi: DATA_VAULT_ABI,
    eventName: 'DataCategoryRegistered',
    onLogs: (logs: Log[]) => {
      const related = logs.filter((log) => {
        const args = (log as unknown as { args?: { owner?: string } }).args;
        return args?.owner?.toLowerCase?.() === address?.toLowerCase?.();
      });
      if (related.length > 0) {
        toast({ title: 'Category registered', description: 'New category detected. Refreshing...', });
        refetchCategories();
      }
    },
  });

  // Watcher: DataCategoryDeactivated (refetch UI saat kategori dinonaktifkan)
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.dataVault as `0x${string}`,
    abi: DATA_VAULT_ABI,
    eventName: 'DataCategoryDeactivated',
    onLogs: (logs: Log[]) => {
      const related = logs.filter((log) => {
        const args = (log as unknown as { args?: { owner?: string } }).args;
        return args?.owner?.toLowerCase?.() === address?.toLowerCase?.();
      });
      if (related.length > 0) {
        toast({ title: 'Category deactivated', description: 'Status changed on-chain. Refreshing...', });
        refetchCategories();
      }
    },
  });

  // Mendapatkan detail kategori data
  const getDataCategory = async (categoryId: number) => {
    try {
      const result = await fetch(`/api/data-category/${categoryId}`);
      if (!result.ok) throw new Error('Failed to fetch data category');
      return await result.json();
    } catch (error) {
      console.error('Error fetching data category:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch data category details',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Fungsi untuk mendaftarkan kategori data baru
  const registerCategory = async (name: string, pricePerDay: number, dataHash: string) => {
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
      // Konversi harga ke wei (asumsi input dalam ETH)
      const priceInWei = BigInt(pricePerDay * 1e18);
      
      // Konversi dataHash ke bytes32
      const dataHashBytes = `0x${dataHash.replace(/^0x/, '')}` as `0x${string}`;
      
      await writeContractAsync({
        address: CONTRACT_ADDRESSES.dataVault as `0x${string}`,
        abi: DATA_VAULT_ABI,
        functionName: 'registerDataCategory',
        args: [name, priceInWei, dataHashBytes],
      });
      
      toast({
        title: 'Success',
        description: 'Data category registered successfully',
      });
      
      // Refresh data kategori
      refetchCategories();
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
  const updateCategory = async (categoryId: number, name: string, pricePerDay: number, dataHash: string) => {
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
      
      // Refresh data kategori
      refetchCategories();
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

        toast({ title: 'Success', description: 'Category disabled successfully' });
        refetchCategories();
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
      const result = await fetch(`/api/check-permission?categoryId=${categoryId}&address=${address}`);
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
  };
}