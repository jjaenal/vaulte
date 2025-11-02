import { useAccount, useWriteContract, useWatchContractEvent } from 'wagmi';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  CONTRACT_ADDRESSES,
  DATA_MARKETPLACE_ABI,
} from '@/constants/contracts';
import { useToast } from '@/components/ui/ToastProvider';
import { useState } from 'react';
import type { Log, Hex } from 'viem';

export function useDataMarketplace() {
  const { address } = useAccount();
  const { showToast } = useToast();
  const { writeContractAsync } = useWriteContract();
  const [isLoading, setIsLoading] = useState(false);
  // QueryClient untuk invalidasi cache saat ada event on-chain
  const queryClient = useQueryClient();

  // Komentar: TanStack Query sudah melakukan dedup dan caching.
  // Tidak perlu cacheRef dan inFlightRef manual lagi.

  // Event watchers untuk auto-refresh/feedback
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.dataMarketplace as `0x${string}`,
    abi: DATA_MARKETPLACE_ABI,
    eventName: 'AccessRequestCreated',
    onLogs: (logs: Log[]) => {
      const related = logs.filter(log => {
        const args = (
          log as unknown as { args?: { buyer?: string; dataOwner?: string } }
        ).args;
        return (
          args?.buyer?.toLowerCase?.() === address?.toLowerCase?.() ||
          args?.dataOwner?.toLowerCase?.() === address?.toLowerCase?.()
        );
      });
      if (related.length > 0) {
        showToast('New access request created', 'info');
        // Komentar (ID): Invalidasi daftar request buyer & owner agar UI menyegarkan
        if (address) {
          queryClient.invalidateQueries({
            queryKey: ['marketplace', 'requests', 'buyer', address],
          });
          queryClient.invalidateQueries({
            queryKey: ['marketplace', 'requests', 'owner', address],
          });
        }
      }
    },
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.dataMarketplace as `0x${string}`,
    abi: DATA_MARKETPLACE_ABI,
    eventName: 'AccessRequestApproved',
    onLogs: (logs: Log[]) => {
      const related = logs.filter(log => {
        const args = (
          log as unknown as { args?: { buyer?: string; dataOwner?: string } }
        ).args;
        return (
          args?.buyer?.toLowerCase?.() === address?.toLowerCase?.() ||
          args?.dataOwner?.toLowerCase?.() === address?.toLowerCase?.()
        );
      });
      if (related.length > 0) {
        showToast('Access request approved', 'success');
        if (address) {
          queryClient.invalidateQueries({
            queryKey: ['marketplace', 'requests', 'buyer', address],
          });
          queryClient.invalidateQueries({
            queryKey: ['marketplace', 'requests', 'owner', address],
          });
        }
      }
    },
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.dataMarketplace as `0x${string}`,
    abi: DATA_MARKETPLACE_ABI,
    eventName: 'AccessRequestRejected',
    onLogs: (logs: Log[]) => {
      const related = logs.filter(log => {
        const args = (
          log as unknown as { args?: { buyer?: string; dataOwner?: string } }
        ).args;
        return (
          args?.buyer?.toLowerCase?.() === address?.toLowerCase?.() ||
          args?.dataOwner?.toLowerCase?.() === address?.toLowerCase?.()
        );
      });
      if (related.length > 0) {
        showToast('Access request rejected', 'error');
        if (address) {
          queryClient.invalidateQueries({
            queryKey: ['marketplace', 'requests', 'buyer', address],
          });
          queryClient.invalidateQueries({
            queryKey: ['marketplace', 'requests', 'owner', address],
          });
        }
      }
    },
  });

  // Mendapatkan quote untuk akses data
  const getQuote = async (categoryId: number, duration: number) => {
    try {
      // Panggil backend langsung (POST) sesuai kontrak API
      // const baseUrl = 'http://localhost:3005';
      const result = await fetch(`/api/marketplace/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, durationDays: duration }),
      });
      if (!result.ok) throw new Error('Failed to get quote');
      const json = await result.json();
      return json?.data ?? null;
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
  const requestAccessTx = async (
    categoryId: number,
    duration: number
  ): Promise<Hex> => {
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

  // Util: patch status request secara optimistik di cache TanStack
  // Komentar (ID): Menghindari loop refetch dan memberi UX cepat
  const patchRequestStatus = (requestId: number, newStatus: string) => {
    if (!address) return;
    const ownerKey = ['marketplace', 'requests', 'owner', address];
    const buyerKey = ['marketplace', 'requests', 'buyer', address];

    const patch = (data?: MarketplaceRequest[]) =>
      (data || []).map(req =>
        req.id === requestId ? { ...req, status: newStatus } : req
      );

    queryClient.setQueryData<MarketplaceRequest[]>(ownerKey, old => patch(old));
    queryClient.setQueryData<MarketplaceRequest[]>(buyerKey, old => patch(old));
  };

  // Mutation: approve dengan optimistic update
  const approveRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      // Jalankan tx on-chain
      const txHash = await approveRequestTx(requestId);
      return txHash;
    },
    onMutate: async (requestId: number) => {
      // Komentar (ID): Patch optimistik agar UI terasa instan
      patchRequestStatus(requestId, 'Approved');
    },
    onError: (_err, requestId) => {
      // Komentar (ID): Kembalikan status ke Requested saat error
      patchRequestStatus(requestId, 'Requested');
    },
    onSettled: () => {
      // Komentar (ID): Tetap invalidasi untuk sinkronisasi final dari backend
      if (address) {
        queryClient.invalidateQueries({
          queryKey: ['marketplace', 'requests', 'buyer', address],
        });
        queryClient.invalidateQueries({
          queryKey: ['marketplace', 'requests', 'owner', address],
        });
      }
    },
  });

  // Mutation: reject dengan optimistic update
  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const txHash = await rejectRequestTx(requestId);
      return txHash;
    },
    onMutate: async (requestId: number) => {
      patchRequestStatus(requestId, 'Rejected');
    },
    onError: (_err, requestId) => {
      patchRequestStatus(requestId, 'Requested');
    },
    onSettled: () => {
      if (address) {
        queryClient.invalidateQueries({
          queryKey: ['marketplace', 'requests', 'buyer', address],
        });
        queryClient.invalidateQueries({
          queryKey: ['marketplace', 'requests', 'owner', address],
        });
      }
    },
  });

  // Mutation: cancel dengan optimistic update
  const cancelRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const txHash = await cancelRequestTx(requestId);
      return txHash;
    },
    onMutate: async (requestId: number) => {
      patchRequestStatus(requestId, 'Cancelled');
    },
    onError: (_err, requestId) => {
      patchRequestStatus(requestId, 'Requested');
    },
    onSettled: () => {
      if (address) {
        queryClient.invalidateQueries({
          queryKey: ['marketplace', 'requests', 'buyer', address],
        });
        queryClient.invalidateQueries({
          queryKey: ['marketplace', 'requests', 'owner', address],
        });
      }
    },
  });

  // Hook query untuk daftar request owner
  const useOwnerRequestsQuery = () => {
    return useQuery<MarketplaceRequest[]>({
      queryKey: ['marketplace', 'requests', 'owner', address ?? '-'],
      enabled: !!address,
      // Komentar: gunakan fetch sederhana; retry ditangani oleh QueryClient
      queryFn: async () => {
        const res = await fetch(`/api/marketplace/requests/owner/${address}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        return (json?.data || []) as MarketplaceRequest[];
      },
      // Data dianggap segar sampai ada invalidasi dari SSE/kontrak
      staleTime: Infinity,
    });
  };

  // Hook query untuk daftar request buyer
  const useBuyerRequestsQuery = () => {
    return useQuery<MarketplaceRequest[]>({
      queryKey: ['marketplace', 'requests', 'buyer', address ?? '-'],
      enabled: !!address,
      queryFn: async () => {
        const res = await fetch(`/api/marketplace/requests/buyer/${address}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        return (json?.data || []) as MarketplaceRequest[];
      },
      staleTime: Infinity,
    });
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
    // Query hooks
    useOwnerRequestsQuery,
    useBuyerRequestsQuery,
    // Mutation hooks
    approveRequestMutation,
    rejectRequestMutation,
    cancelRequestMutation,
    isLoading,
  };
}
