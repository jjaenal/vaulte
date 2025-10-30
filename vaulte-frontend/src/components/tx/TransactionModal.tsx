"use client";

import React from 'react';

type TxStatus = 'idle' | 'pending' | 'success' | 'error';

export function TransactionModal({
  open,
  status,
  hash,
  onClose,
}: {
  open: boolean;
  status: TxStatus;
  hash?: string;
  onClose?: () => void;
}) {
  if (!open) return null;

  const title =
    status === 'pending' ? 'Transaction Pending' :
    status === 'success' ? 'Transaction Success' :
    status === 'error' ? 'Transaction Error' : 'Transaction';

  const description =
    status === 'pending' ? 'Please confirm and wait for on-chain confirmation.' :
    status === 'success' ? 'Your transaction was confirmed successfully.' :
    status === 'error' ? 'There was an error processing the transaction.' : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            className="rounded-md p-1 text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
        {hash && (
          <div className="mt-4">
            <p className="text-xs text-gray-500">Tx Hash:</p>
            <code className="break-all text-xs text-gray-700">{hash}</code>
          </div>
        )}
        <div className="mt-6 flex justify-end">
          <button
            className="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}