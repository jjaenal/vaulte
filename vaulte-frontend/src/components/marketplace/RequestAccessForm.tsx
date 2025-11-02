import { useState } from 'react';
import { useDataMarketplace } from '@/hooks/useDataMarketplace';
import { useToast } from '@/components/ui/ToastProvider';
import { useTransactions } from '@/hooks/useTransactions';
import { TransactionModal } from '@/components/tx/TransactionModal';

interface RequestAccessFormProps {
  categoryId: number;
  categoryName: string;
  pricePerDay: number;
  onRequestComplete: () => void;
}

export default function RequestAccessForm({
  categoryId,
  categoryName,
  pricePerDay,
  onRequestComplete,
}: RequestAccessFormProps) {
  const [duration, setDuration] = useState(7);
  const [isOpen, setIsOpen] = useState(false);
  const { getQuote, requestAccessTx, isLoading } = useDataMarketplace();
  const [totalPrice, setTotalPrice] = useState<number | null>(null);
  const { showToast } = useToast();
  const { status, hash, handleTx, reset } = useTransactions();

  const handleOpen = async () => {
    setIsOpen(true);
    // Get quote when opening the modal
    try {
      const quote = await getQuote(categoryId, duration);
      if (quote) {
        setTotalPrice(Number(quote.totalPrice) / 1e18);
      }
    } catch (error) {
      console.error('Error getting quote:', error);
      showToast('Failed to fetch quote', 'error');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleDurationChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newDuration = parseInt(e.target.value);
    setDuration(newDuration);

    // Update quote when duration changes
    try {
      const quote = await getQuote(categoryId, newDuration);
      if (quote) {
        setTotalPrice(Number(quote.totalPrice) / 1e18);
      }
    } catch (error) {
      console.error('Error getting quote:', error);
      showToast('Failed to fetch quote', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await handleTx(() => requestAccessTx(categoryId, duration));
      showToast('Access request submitted', 'success');
      handleClose();
      onRequestComplete();
    } catch (error) {
      console.error('Request access error:', error);
      showToast('Access request failed', 'error');
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1 px-3 rounded"
      >
        Request Access
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              Request Access to {categoryName}
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Duration (days)
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={duration}
                  onChange={handleDurationChange}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1 day</span>
                  <span>{duration} days</span>
                  <span>30 days</span>
                </div>
              </div>

              <div className="mb-6 bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Price per day:</span>
                  <span className="text-sm font-medium">
                    {pricePerDay.toFixed(6)} ETH
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Duration:</span>
                  <span className="text-sm font-medium">{duration} days</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm font-medium">Total price:</span>
                  <span className="text-sm font-bold">
                    {totalPrice !== null
                      ? totalPrice.toFixed(6)
                      : 'Calculating...'}{' '}
                    ETH
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || totalPrice === null}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : 'Confirm Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <TransactionModal
        open={status !== 'idle'}
        status={status}
        hash={hash}
        onClose={reset}
      />
    </>
  );
}
