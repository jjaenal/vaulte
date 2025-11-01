import { useAccount, useWriteContract, useWatchContractEvent } from "wagmi";
import {
  CONTRACT_ADDRESSES,
  DATA_MARKETPLACE_ABI,
} from "@/constants/contracts";
import { useToast } from "@/components/ui/ToastProvider";
import { useState, useRef } from "react";
import { retryApiCall, getApiErrorMessage } from "@/utils/apiUtils";
import type { Log, Hex } from "viem";

export function useDataMarketplace() {
  const { address } = useAccount();
  const { showToast } = useToast();
  const { writeContractAsync } = useWriteContract();
  const [isLoading, setIsLoading] = useState(false);

  // Cache untuk mengurangi API calls yang tidak perlu
  const cacheRef = useRef<{
    [key: string]: { data: unknown; timestamp: number };
  }>({});
  // Dedup in-flight requests agar panggilan paralel dengan key yang sama tidak duplikat
  const inFlightRef = useRef<Map<string, Promise<unknown>>>(new Map());

  // Event watchers untuk auto-refresh/feedback
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.dataMarketplace as `0x${string}`,
    abi: DATA_MARKETPLACE_ABI,
    eventName: "AccessRequestCreated",
    onLogs: (logs: Log[]) => {
      const related = logs.filter((log) => {
        const args = (
          log as unknown as { args?: { buyer?: string; dataOwner?: string } }
        ).args;
        return (
          args?.buyer?.toLowerCase?.() === address?.toLowerCase?.() ||
          args?.dataOwner?.toLowerCase?.() === address?.toLowerCase?.()
        );
      });
      if (related.length > 0) {
        showToast("New access request created", "info");
      }
    },
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.dataMarketplace as `0x${string}`,
    abi: DATA_MARKETPLACE_ABI,
    eventName: "AccessRequestApproved",
    onLogs: (logs: Log[]) => {
      const related = logs.filter((log) => {
        const args = (
          log as unknown as { args?: { buyer?: string; dataOwner?: string } }
        ).args;
        return (
          args?.buyer?.toLowerCase?.() === address?.toLowerCase?.() ||
          args?.dataOwner?.toLowerCase?.() === address?.toLowerCase?.()
        );
      });
      if (related.length > 0) {
        showToast("Access request approved", "success");
      }
    },
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.dataMarketplace as `0x${string}`,
    abi: DATA_MARKETPLACE_ABI,
    eventName: "AccessRequestRejected",
    onLogs: (logs: Log[]) => {
      const related = logs.filter((log) => {
        const args = (
          log as unknown as { args?: { buyer?: string; dataOwner?: string } }
        ).args;
        return (
          args?.buyer?.toLowerCase?.() === address?.toLowerCase?.() ||
          args?.dataOwner?.toLowerCase?.() === address?.toLowerCase?.()
        );
      });
      if (related.length > 0) {
        showToast("Access request rejected", "error");
      }
    },
  });

  // Mendapatkan quote untuk akses data
  const getQuote = async (categoryId: number, duration: number) => {
    try {
      // Panggil backend langsung (POST) sesuai kontrak API
      // const baseUrl = 'http://localhost:3005';
      const result = await fetch(`/api/marketplace/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, durationDays: duration }),
      });
      if (!result.ok) throw new Error("Failed to get quote");
      const json = await result.json();
      return json?.data ?? null;
    } catch (error) {
      console.error("Error getting quote:", error);
      return null;
    }
  };

  const requestAccess = async (categoryId: number, duration: number) => {
    if (!address) {
      showToast("Please connect your wallet first", "error");
      return;
    }

    setIsLoading(true);
    try {
      // Dapatkan quote terlebih dahulu
      const quote = await getQuote(categoryId, duration);
      if (!quote) throw new Error("Failed to get quote");

      await writeContractAsync({
        address: CONTRACT_ADDRESSES.dataMarketplace as `0x${string}`,
        abi: DATA_MARKETPLACE_ABI,
        functionName: "requestAccess",
        args: [BigInt(categoryId), BigInt(duration)],
        value: BigInt(quote.totalPrice),
      });

      showToast("Access request submitted successfully", "success");

      return true;
    } catch (error) {
      console.error("Error requesting access:", error);
      showToast("Failed to request access", "error");
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
    if (!address) throw new Error("Wallet not connected");
    const quote = await getQuote(categoryId, duration);
    if (!quote) throw new Error("Failed to get quote");
    const txHash = await writeContractAsync({
      address: CONTRACT_ADDRESSES.dataMarketplace as `0x${string}`,
      abi: DATA_MARKETPLACE_ABI,
      functionName: "requestAccess",
      args: [BigInt(categoryId), BigInt(duration)],
      value: BigInt(quote.totalPrice),
    });
    return txHash as Hex;
  };

  const approveRequest = async (requestId: number) => {
    if (!address) {
      showToast("Please connect your wallet first", "error");
      return;
    }

    setIsLoading(true);
    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESSES.dataMarketplace as `0x${string}`,
        abi: DATA_MARKETPLACE_ABI,
        functionName: "approveRequest",
        args: [BigInt(requestId)],
      });

      showToast("Request approved successfully", "success");

      return true;
    } catch (error) {
      console.error("Error approving request:", error);
      showToast("Failed to approve request", "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const approveRequestTx = async (requestId: number): Promise<Hex> => {
    if (!address) throw new Error("Wallet not connected");
    const txHash = await writeContractAsync({
      address: CONTRACT_ADDRESSES.dataMarketplace as `0x${string}`,
      abi: DATA_MARKETPLACE_ABI,
      functionName: "approveRequest",
      args: [BigInt(requestId)],
    });
    return txHash as Hex;
  };

  const rejectRequest = async (requestId: number) => {
    if (!address) {
      showToast("Please connect your wallet first", "error");
      return;
    }

    setIsLoading(true);
    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESSES.dataMarketplace as `0x${string}`,
        abi: DATA_MARKETPLACE_ABI,
        functionName: "rejectRequest",
        args: [BigInt(requestId)],
      });

      showToast("Request rejected successfully", "success");

      return true;
    } catch (error) {
      console.error("Error rejecting request:", error);
      showToast("Failed to reject request", "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const rejectRequestTx = async (requestId: number): Promise<Hex> => {
    if (!address) throw new Error("Wallet not connected");
    const txHash = await writeContractAsync({
      address: CONTRACT_ADDRESSES.dataMarketplace as `0x${string}`,
      abi: DATA_MARKETPLACE_ABI,
      functionName: "rejectRequest",
      args: [BigInt(requestId)],
    });
    return txHash as Hex;
  };

  const cancelRequest = async (requestId: number) => {
    if (!address) {
      showToast("Please connect your wallet first", "error");
      return;
    }

    setIsLoading(true);
    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESSES.dataMarketplace as `0x${string}`,
        abi: DATA_MARKETPLACE_ABI,
        functionName: "cancelRequest",
        args: [BigInt(requestId)],
      });

      showToast("Request cancelled successfully", "success");

      return true;
    } catch (error) {
      console.error("Error cancelling request:", error);
      showToast("Failed to cancel request", "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelRequestTx = async (requestId: number): Promise<Hex> => {
    if (!address) throw new Error("Wallet not connected");
    const txHash = await writeContractAsync({
      address: CONTRACT_ADDRESSES.dataMarketplace as `0x${string}`,
      abi: DATA_MARKETPLACE_ABI,
      functionName: "cancelRequest",
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

  const getRequests = async (
    role: "owner" | "buyer" = "owner"
  ): Promise<MarketplaceRequest[]> => {
    try {
      if (!address) return [];

      // Cache key berdasarkan role dan address
      const cacheKey = `${role}-${address}`;
      const now = Date.now();
      const CACHE_DURATION = 15000; // 15 detik cache untuk menurunkan frekuensi fetch

      // Cek cache terlebih dahulu
      const cached = cacheRef.current[cacheKey];
      if (cached && now - cached.timestamp < CACHE_DURATION) {
        return cached.data as MarketplaceRequest[];
      }

      // Jika ada request in-flight dengan key yang sama, tunggu promise tersebut
      const inFlight = inFlightRef.current.get(cacheKey) as
        | Promise<MarketplaceRequest[]>
        | undefined;
      if (inFlight) {
        // Komentar (ID): Dedup in-flight agar tidak memicu beberapa fetch bersamaan
        return await inFlight;
      }

      // Gunakan retry mechanism untuk API call
      const promise = retryApiCall(
        async () => {
          // Gunakan base URL backend eksplisit untuk menghindari mismatch port
          // const baseUrl = "http://localhost:3005";
          const url =
            role === "owner"
              ? `/api/marketplace/requests/owner/${address}`
              : `/api/marketplace/requests/buyer/${address}`;
          const res = await fetch(url);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          const json = await res.json();
          return (json?.data || []) as MarketplaceRequest[];
        },
        {
          maxRetries: 2, // Kurangi retry untuk menghindari spam
          baseDelay: 1000,
          maxDelay: 3000,
        }
      );

      // Simpan promise ke in-flight map untuk dedup
      inFlightRef.current.set(cacheKey, promise);

      let data: MarketplaceRequest[] = [];
      try {
        data = await promise;
      } finally {
        // Pastikan selalu menghapus entry in-flight meski terjadi error
        inFlightRef.current.delete(cacheKey);
      }

      // Simpan ke cache
      cacheRef.current[cacheKey] = { data, timestamp: now };

      return data;
    } catch (error) {
      console.error("Error fetching requests:", error);
      // Show user-friendly error message
      const errorMessage = getApiErrorMessage(error);
      showToast(errorMessage, "error");
      return [];
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
