import { useAccount, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESSES, DATA_MARKETPLACE_ABI } from '@/constants/contracts';
import { useToast } from '@/components/ui/ToastProvider';
import { useState } from 'react';

export function useDataMarketplace() {
  const { address } = useAccount();
  const { showToast } = useToast();
  const { writeContractAsync } = useWriteContract();
  const [isLoading, setIsLoading] = useState(false);

  // Mendapatkan quote untuk akses data
  const getQuote = async (categoryId: number, duration: number) => {
    try {
      const result = await fetch(`/api/quote?categoryId=${categoryId}&duration=${duration}`);
      if (!result.ok) throw new Error('Failed to get quote');
      return await result.json();
    } catch (error) {
      console.error('Error getting quote:', error);
      return null;
    }
  };

  const requestAccess = async (categoryId: number, duration: number) => {
    if (!address) {
      showToast('Please connect your wallet first', 'error');
      return;
    }

    setIsLoading(true);
    try {
      // Dapatkan quote terlebih dahulu
      const quote = await getQuote(categoryId, duration);
      if (!quote) throw new Error('Failed to get quote');

      await writeContractAsync({
        address: CONTRACT_ADDRESSES.dataMarketplace as `0x${string}`,
        abi: DATA_MARKETPLACE_ABI,
        functionName: 'requestAccess',
        args: [BigInt(categoryId), BigInt(duration)],
        value: BigInt(quote.totalPrice),
      });

      showToast('Access request submitted successfully', 'success');
      
      return true;
    } catch (error) {
      console.error('Error requesting access:', error);
      showToast('Failed to request access', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const approveRequest = async (requestId: number) => {
    if (!address) {
      showToast('Please connect your wallet first', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESSES.dataMarketplace as `0x${string}`,
        abi: DATA_MARKETPLACE_ABI,
        functionName: 'approveRequest',
        args: [BigInt(requestId)],
      });

      showToast('Request approved successfully', 'success');
      
      return true;
    } catch (error) {
      console.error('Error approving request:', error);
      showToast('Failed to approve request', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const rejectRequest = async (requestId: number) => {
    if (!address) {
      showToast('Please connect your wallet first', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESSES.dataMarketplace as `0x${string}`,
        abi: DATA_MARKETPLACE_ABI,
        functionName: 'rejectRequest',
        args: [BigInt(requestId)],
      });

      showToast('Request rejected successfully', 'success');
      
      return true;
    } catch (error) {
      console.error('Error rejecting request:', error);
      showToast('Failed to reject request', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getQuote,
    requestAccess,
    approveRequest,
    rejectRequest,
    isLoading,
  };
}