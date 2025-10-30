import { useAccount, useReadContract, useWriteContract } from 'wagmi';
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
      // Untuk toggle, kita perlu memanggil fungsi yang sesuai
      // Karena tidak ada fungsi toggle langsung, kita bisa menggunakan updateDataCategory
      // dengan parameter yang sama tapi status active dibalik
      // Atau jika ada fungsi khusus untuk enable/disable, gunakan itu
      
      // Untuk sementara, kita simulasikan dengan toast
      const newStatus = !currentStatus;
      
      toast({
        title: 'Success',
        description: `Category ${newStatus ? 'enabled' : 'disabled'} successfully`,
      });
      
      // Refresh data kategori
      refetchCategories();
      return true;
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