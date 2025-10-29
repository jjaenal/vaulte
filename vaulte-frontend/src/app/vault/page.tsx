'use client';

import { useAccount } from 'wagmi';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/ToastProvider';

type Category = {
  id: number;
  name: string;
  pricePerDay: number; // ETH/day
  enabled: boolean;
  activeBuyers: number;
  estimatedMonthly: number; // ETH
  icon?: string;
};

export default function VaultPage() {
  const { address, isConnected } = useAccount();
  const { showToast } = useToast();

  const initialCategories = useMemo<Category[]>(
    () => [
      { id: 1, name: 'Fitness Data', pricePerDay: 0.05, enabled: true, activeBuyers: 3, estimatedMonthly: 1.5, icon: '🏋️' },
      { id: 2, name: 'Location History', pricePerDay: 0.08, enabled: false, activeBuyers: 1, estimatedMonthly: 0.8, icon: '📍' },
      { id: 3, name: 'Browsing Activity', pricePerDay: 0.03, enabled: true, activeBuyers: 5, estimatedMonthly: 1.2, icon: '🧭' },
      { id: 4, name: 'Shopping Habits', pricePerDay: 0.04, enabled: false, activeBuyers: 0, estimatedMonthly: 0.0, icon: '🛍️' },
    ], []
  );

  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');

  const toggleCategory = (id: number) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
    const cat = categories.find((c) => c.id === id);
    if (cat) {
      showToast(`${cat.name} ${cat.enabled ? 'disabled' : 'enabled'}`, 'success');
    }
  };

  const openModal = (cat: Category) => {
    setSelectedCategory(cat);
    setEditPrice(String(cat.pricePerDay));
    setIsModalOpen(true);
  };

  const saveCategory = () => {
    if (!selectedCategory) return;
    const price = Number(editPrice);
    if (Number.isNaN(price) || price <= 0) {
      showToast('Invalid price', 'error');
      return;
    }
    setCategories((prev) => prev.map((c) => (c.id === selectedCategory.id ? { ...c, pricePerDay: price } : c)));
    setIsModalOpen(false);
    showToast('Category updated', 'success');
  };

  if (!isConnected) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Connect your wallet to view your Data Vault</h2>
        <p className="mt-4 text-gray-500">You need to connect your wallet to manage data categories.</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Data Vault</h1>
            <p className="mt-2 text-sm text-gray-500">Manage your personal data categories and pricing</p>
            <p className="mt-1 text-xs text-gray-400">Connected as {address}</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link
              href="/integrations"
              className="rounded-md bg-purple-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-500"
            >
              Connect Data Source
            </Link>
          </div>
        </div>

        {/* Data Categories Grid */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Data Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl" aria-hidden="true">{cat.icon ?? '📁'}</span>
                    <h3 className="text-sm font-semibold text-gray-900">{cat.name}</h3>
                  </div>
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      cat.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {cat.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Price per day</p>
                  <p className="text-lg font-medium text-gray-900">{cat.pricePerDay} ETH</p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Active buyers</p>
                    <p className="text-sm font-medium text-gray-900">{cat.activeBuyers}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Est. monthly</p>
                    <p className="text-sm font-medium text-gray-900">{cat.estimatedMonthly} ETH</p>
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-3">
                  <button
                    onClick={() => openModal(cat)}
                    className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-black"
                  >
                    Edit
                  </button>
                  <Link
                    href="/marketplace"
                    className="inline-flex items-center rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
                  >
                    View Requests
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Detail Modal */}
        {isModalOpen && selectedCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900">Edit Category</h3>
              <p className="mt-1 text-xs text-gray-500">{selectedCategory.name}</p>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Price (ETH/day)</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6"
                />
              </div>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCategory}
                  className="inline-flex items-center rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Connect Data Source Section */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Connect Data Sources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Google Fit', logo: '/globe.svg', description: 'Health & activity data' },
              { name: 'Apple Health', logo: '/globe.svg', description: 'Vitals & health records' },
              { name: 'Strava', logo: '/globe.svg', description: 'Workout performance' },
              { name: 'Fitbit', logo: '/globe.svg', description: 'Fitness tracking' },
            ].map((src) => (
              <div key={src.name} className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-purple-600 text-sm">🔗</span>
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{src.name}</p>
                    <p className="text-xs text-gray-500">{src.description}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Link
                    href="/integrations"
                    className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    Connect
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}