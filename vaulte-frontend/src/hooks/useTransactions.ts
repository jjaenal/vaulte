import { useState } from 'react';
import { useConfig } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import type { Hex } from 'viem';

type TxStatus = 'idle' | 'pending' | 'success' | 'error';

export function useTransactions() {
  const config = useConfig();
  const [status, setStatus] = useState<TxStatus>('idle');
  const [hash, setHash] = useState<Hex | undefined>();
  const [error, setError] = useState<string | undefined>();

  const waitForReceipt = async (txHash: Hex) => {
    return await waitForTransactionReceipt(config, { hash: txHash });
  };

  const handleTx = async (send: () => Promise<Hex>) => {
    setStatus('pending');
    setError(undefined);
    try {
      const txHash = await send();
      setHash(txHash);
      const receipt = await waitForReceipt(txHash);
      if (receipt.status === 'success') {
        setStatus('success');
      } else {
        setStatus('error');
        setError('Transaction failed');
      }
      return receipt;
    } catch (e) {
      const errObj = e as unknown as {
        shortMessage?: string;
        message?: string;
      };
      const errMsg = errObj?.shortMessage || errObj?.message || 'Unknown error';
      setStatus('error');
      setError(String(errMsg));
      throw e;
    }
  };

  const reset = () => {
    setStatus('idle');
    setHash(undefined);
    setError(undefined);
  };

  return {
    status,
    hash,
    error,
    waitForReceipt,
    handleTx,
    reset,
  };
}
