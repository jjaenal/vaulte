import { useAccount, useWriteContract, useWatchContractEvent } from 'wagmi';
import { CONTRACT_ADDRESSES, DATA_MARKETPLACE_ABI } from '@/constants/contracts';
import { useToast } from '@/components/ui/ToastProvider';
import { useState } from 'react';
import type { Log, Hex } from 'viem';

export function useDataMarketplace() {
  const { address } = useAccount();
  const { showToast } = useToast();
  const { writeContractAsync } = useWriteContract();
  const [isLoading, setIsLoading] = useState(false);
  
  // Event watchers untuk auto-refresh/feedback
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.dataMarketplace as `0x${string}`,
    abi: DATA_MARKETPLACE_ABI,
    eventName: 'AccessRequestCreated',
    onLogs: (logs: Log[]) => {
      const related = logs.filter((log) => {
        const args = (log as unknown as { args?: { buyer?: string; dataOwner?: string } }).args;
        return args?.buyer?.toLowerCase?.() === address?.toLowerCase?.() || args?.dataOwner?.toLowerCase?.() === address?.toLowerCase?.();
      });
      if (related.length > 0) {
        showToast('New access request created', 'info');
      }
    },
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.dataMarketplace as `0x${string}`,
    abi: DATA_MARKETPLACE_ABI,
    eventName: 'AccessRequestApproved',
    onLogs: (logs: Log[]) => {
      const related = logs.filter((log) => {
        const args = (log as unknown as { args?: { buyer?: string; dataOwner?: string } }).args;
        return args?.buyer?.toLowerCase?.() === address?.toLowerCase?.() || args?.dataOwner?.toLowerCase?.() === address?.toLowerCase?.();
      });
      if (related.length > 0) {
        showToast('Access request approved', 'success');
      }
    },
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.dataMarketplace as `0x${string}`,
    abi: DATA_MARKETPLACE_ABI,
    eventName: 'AccessRequestRejected',
    onLogs: (logs: Log[]) => {
      const related = logs.filter((log) => {
        const args = (log as unknown as { args?: { buyer?: string; dataOwner?: string } }).args;
        return args?.buyer?.toLowerCase?.() === address?.toLowerCase?.() || args?.dataOwner?.toLowerCase?.() === address?.toLowerCase?.();
      });
      if (related.length > 0) {
        showToast('Access request rejected', 'error');
      }
    },
  });

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

  // Variant yang mengembalikan tx hash untuk integrasi dengan TransactionModal
  const requestAccessTx = async (categoryId: number, duration: number): Promise<Hex> => {
    if (!address) throw new Error('Wallet not connected');
    const quote = await getQuote(categoryId, duration);
    if (!quote) throw new Error('Failed to get quote');
    const txHash = await writeContractAsync({
      address: CONTRACT_ADDRESSES.dataMarketplace as `0x${string}`,
      abi: DATA_MARKETPLACE_ABI,
      functionName: 'requestAccess',
      args: [BigInt(categoryId), BigInt(duration)],
      value: BigInt(quote.totalPrice),
    });
    return txHash as Hex;
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

  const approveRequestTx = async (requestId: number): Promise<Hex> => {
    if (!address) throw new Error('Wallet not connected');
    const txHash = await writeContractAsync({
      address: CONTRACT_ADDRESSES.dataMarketplace as `0x${string}`,
      abi: DATA_MARKETPLACE_ABI,
      functionName: 'approveRequest',
      args: [BigInt(requestId)],
    });
    return txHash as Hex;
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

  const rejectRequestTx = async (requestId: number): Promise<Hex> => {
    if (!address) throw new Error('Wallet not connected');
    const txHash = await writeContractAsync({
      address: CONTRACT_ADDRESSES.dataMarketplace as `0x${string}`,
      abi: DATA_MARKETPLACE_ABI,
      functionName: 'rejectRequest',
      args: [BigInt(requestId)],
    });
    return txHash as Hex;
  };

  const cancelRequest = async (requestId: number) => {
    if (!address) {
      showToast('Please connect your wallet first', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESSES.dataMarketplace as `0x${string}`,
        abi: DATA_MARKETPLACE_ABI,
        functionName: 'cancelRequest',
        args: [BigInt(requestId)],
      });

      showToast('Request cancelled successfully', 'success');
      
      return true;
    } catch (error) {
      console.error('Error cancelling request:', error);
      showToast('Failed to cancel request', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelRequestTx = async (requestId: number): Promise<Hex> => {
    if (!address) throw new Error('Wallet not connected');
    const txHash = await writeContractAsync({
      address: CONTRACT_ADDRESSES.dataMarketplace as `0x${string}`,
      abi: DATA_MARKETPLACE_ABI,
      functionName: 'cancelRequest',
      args: [BigInt(requestId)],
    });
    return txHash as Hex;
  };

  type MarketplaceRequest = {
    id: number;
    buyer: string;
    seller: string;
    categoryId: string | number;
    durationDays: string | number;
    totalAmount: string | number;
    status: string;
  };

  const getRequests = async (role: 'owner' | 'buyer' = 'owner'): Promise<MarketplaceRequest[] | null> => {
    try {
      if (!address) return [];
      const url = role === 'owner' 
        ? `/api/marketplace/requests/owner/${address}`
        : `/api/marketplace/requests/buyer/${address}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch requests');
      const json = await res.json();
      return (json?.data || []) as MarketplaceRequest[];
    } catch (error) {
      console.error('Error fetching requests:', error);
      showToast('Failed to load requests', 'error');
      return null;
    }
  };

  return {
    getQuote,
    requestAccess,
    requestAccessTx,
    approveRequest,
    approveRequestTx,
    rejectRequest,
    rejectRequestTx,
    cancelRequest,
    cancelRequestTx,
    getRequests,
    isLoading,
  };
}