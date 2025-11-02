import { useState } from 'react';
import { useDataVault } from '@/hooks/useDataVault';
import { useToast } from '@/components/ui/ToastProvider';

export default function RegisterDataForm() {
  const [name, setName] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [dataHash, setDataHash] = useState('');
  const { registerCategory, isLoading } = useDataVault();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !pricePerDay || !dataHash) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    try {
      // Gunakan hash dummy jika user tidak memasukkan hash yang valid
      const hash = dataHash.startsWith('0x')
        ? dataHash
        : '0x0000000000000000000000000000000000000000000000000000000000000000';

      await registerCategory(name, parseFloat(pricePerDay), hash);
      showToast('Data category registered successfully', 'success');

      // Reset form
      setName('');
      setPricePerDay('');
      setDataHash('');
    } catch (error) {
      console.error('Register category error:', error);
      showToast('Failed to register data category', 'error');
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Register New Data Category</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Fitness Data"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price Per Day (ETH)
          </label>
          <input
            type="number"
            value={pricePerDay}
            onChange={e => setPricePerDay(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.01"
            step="0.001"
            min="0"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data Hash (IPFS CID or other hash)
          </label>
          <input
            type="text"
            value={dataHash}
            onChange={e => setDataHash(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0x..."
          />
          <p className="text-xs text-gray-500 mt-1">
            This is where your encrypted data is stored
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? 'Registering...' : 'Register Data Category'}
        </button>
      </form>
    </div>
  );
}
