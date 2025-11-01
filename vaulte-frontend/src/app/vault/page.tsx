'use client';

import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/ToastProvider';
import { useDataVault } from '@/hooks/useDataVault';

type Buyer = {
  name: string;
  lastPurchase: string;
  status: 'active' | 'paused' | 'pending';
};

type Source = {
  name: string;
  description: string;
  connected: boolean;
  lastSynced?: string;
  oauth?: boolean;
};

type Category = {
  id: number;
  name: string;
  pricePerDay: number; // ETH/day
  enabled: boolean;
  activeBuyers: number;
  estimatedMonthly: number; // ETH
  icon?: string;
  buyers?: Buyer[];
  sampleFields?: string[];
};

export default function VaultPage() {
  const { address, isConnected } = useAccount();
  const { showToast } = useToast();
  const {
    updateCategory,
    toggleCategory: toggleCategoryWeb3,
    isLoading,
    userCategories,
    getDataCategory,
    isLoadingCategories,
  } = useDataVault();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');

  const [sources, setSources] = useState<Source[]>([
    { name: 'Google Fit', description: 'Health & activity data', connected: false, oauth: true },
    { name: 'Apple Health', description: 'Vitals & health records', connected: false, oauth: false },
    { name: 'Strava', description: 'Workout performance', connected: false, oauth: true },
    { name: 'Fitbit', description: 'Fitness tracking', connected: false, oauth: true },
  ]);

  const toggleCategory = async (id: number) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;

    const success = await toggleCategoryWeb3(id, cat.enabled);
    if (success) {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
      );
    }
  };

  const openModal = (cat: Category) => {
    setSelectedCategory(cat);
    setEditPrice(String(cat.pricePerDay));
    setIsModalOpen(true);
  };

  const saveCategory = async () => {
    if (!selectedCategory) return;
    const price = Number(editPrice);
    if (Number.isNaN(price) || price <= 0) {
      showToast('Invalid price', 'error');
      return;
    }

    // Dummy dataHash for now - in real app, this would come from IPFS
    const dataHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
    
    const success = await updateCategory(
      selectedCategory.id,
      selectedCategory.name,
      price,
      dataHash
    );

    if (success) {
      setCategories((prev) => prev.map((c) => (c.id === selectedCategory.id ? { ...c, pricePerDay: price } : c)));
      setIsModalOpen(false);
    }
  };

  // Ambil kategori on-chain milik user dan render ke grid
  useEffect(() => {
    const fetchCategories = async () => {
      // Komentar (early return): Jika belum connect atau belum ada kategori, kosongkan list
      if (!isConnected || !userCategories || userCategories.length === 0) {
        setCategories([]);
        return;
      }

      try {
        const promises = userCategories.map(async (id) => {
          const cat = await getDataCategory(Number(id));
          // Komentar: Map hasil API ke struktur Category untuk UI
          return {
            id: Number(id),
            name: cat?.name ?? `Category #${id}`,
            pricePerDay: Number(cat?.pricePerDay ?? 0),
            enabled: Boolean(cat?.active ?? true),
            activeBuyers: 0,
            estimatedMonthly: 0,
            icon: '📁',
            buyers: [],
            sampleFields: [],
          } as Category;
        });
        const list = await Promise.all(promises);
        setCategories(list);
      } catch (err) {
        console.error('Gagal fetch kategori Vault:', err);
        showToast('Gagal mengambil kategori on-chain', 'error');
      }
    };

    fetchCategories();
  }, [isConnected, userCategories, getDataCategory, showToast]);

  const connectSource = (name: string) => {
    setSources((prev) =>
      prev.map((s) => (s.name === name ? { ...s, connected: true, lastSynced: new Date().toISOString().slice(0, 10) } : s))
    );
    showToast(`${name} connected`, 'success');
  };

  const disconnectSource = (name: string) => {
    setSources((prev) => prev.map((s) => (s.name === name ? { ...s, connected: false } : s)));
    showToast(`${name} disconnected`, 'success');
  };

  const syncSource = (name: string) => {
    setSources((prev) => prev.map((s) => (s.name === name ? { ...s, lastSynced: new Date().toISOString().slice(0, 10) } : s)));
    showToast(`${name} synced`, 'success');
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
          {isLoadingCategories && (
            <div className="text-sm text-gray-500 mb-4">Loading your on-chain categories...</div>
          )}
          {!isLoadingCategories && categories.length === 0 && (
            <div className="text-sm text-gray-500 mb-4">Belum ada kategori on-chain. Tambah kategori dari Dashboard.</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white shadow rounded-lg p-6 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openModal(cat)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl" aria-hidden="true">{cat.icon ?? '📁'}</span>
                    <h3 className="text-sm font-semibold text-gray-900">{cat.name}</h3>
                  </div>
                  <button
                    onClick={async (e) => { e.stopPropagation(); await toggleCategory(cat.id); }}
                    disabled={isLoading}
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      cat.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? 'Processing...' : cat.enabled ? 'Enabled' : 'Disabled'}
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
                    onClick={(e) => { e.stopPropagation(); openModal(cat); }}
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
            <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Category Details</h3>
                  <p className="mt-1 text-xs text-gray-500">{selectedCategory.name}</p>
                </div>
                <span className="text-2xl" aria-hidden="true">{selectedCategory.icon ?? '📁'}</span>
              </div>

              {/* Summary */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-md border bg-white p-3">
                  <p className="text-xs text-gray-500">Current price</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedCategory.pricePerDay} ETH/day</p>
                </div>
                <div className="rounded-md border bg-white p-3">
                  <p className="text-xs text-gray-500">Status</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${selectedCategory.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {selectedCategory.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="rounded-md border bg-white p-3">
                  <p className="text-xs text-gray-500">Active buyers</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedCategory.activeBuyers}</p>
                </div>
              </div>

              {/* Edit price */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Set new price (ETH/day)</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6"
                />
              </div>

              {/* Data preview */}
              <div className="mt-6">
                <p className="text-sm font-semibold text-gray-900">Data Preview</p>
                <ul className="mt-2 grid grid-cols-2 gap-2">
                  {(selectedCategory.sampleFields ?? []).map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-700">
                      <span className="h-4 w-4 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Connected sources */}
              <div className="mt-6">
                <p className="text-sm font-semibold text-gray-900">Connected Sources</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(() => {
                    const sourcesMap: Record<string, string[]> = {
                      'Fitness Data': ['Google Fit', 'Strava'],
                      'Location History': ['Android Location'],
                      'Browsing Activity': ['Browser Extension'],
                      'Shopping Habits': ['Email Receipts'],
                    };
                    const list = sourcesMap[selectedCategory.name] ?? [];
                    return list.length === 0 ? (
                      <span className="text-xs text-gray-500">No sources connected</span>
                    ) : (
                      list.map((s) => (
                        <span key={s} className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-1 text-[11px] font-medium text-indigo-700">
                          {s}
                        </span>
                      ))
                    );
                  })()}
                </div>
              </div>

              {/* Buyers list */}
              <div className="mt-6">
                <p className="text-sm font-semibold text-gray-900">Recent Buyers</p>
                <div className="mt-2 divide-y rounded-md border">
                  {(selectedCategory.buyers ?? []).length === 0 ? (
                    <p className="p-3 text-xs text-gray-500">No buyers yet</p>
                  ) : (
                    (selectedCategory.buyers ?? []).map((b) => (
                      <div key={`${b.name}-${b.lastPurchase}`} className="flex items-center justify-between p-3">
                        <div>
                          <p className="text-xs font-medium text-gray-900">{b.name}</p>
                          <p className="text-[11px] text-gray-500">Last purchase: {b.lastPurchase}</p>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium ${
                          b.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : b.status === 'paused'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      const success = await toggleCategoryWeb3(selectedCategory.id, selectedCategory.enabled);
                      if (success) {
                        setCategories((prev) => prev.map((c) => (c.id === selectedCategory.id ? { ...c, enabled: !c.enabled } : c)));
                        setSelectedCategory((prev) => (prev ? { ...prev, enabled: !prev.enabled } : prev));
                      }
                    }}
                    disabled={isLoading}
                    className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                      selectedCategory.enabled ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : 'bg-green-600 text-white hover:bg-green-700'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? 'Processing...' : selectedCategory.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <Link
                    href="/marketplace"
                    className="inline-flex items-center rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
                  >
                    View Requests
                  </Link>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    Close
                  </button>
                  <button
                    onClick={saveCategory}
                    disabled={isLoading || editPrice === String(selectedCategory.pricePerDay)}
                    className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                      isLoading || editPrice === String(selectedCategory.pricePerDay)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Connect Data Source Section */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Connect Data Sources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sources.map((src) => (
              <div key={src.name} className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-purple-600 text-sm">{src.oauth ? '🔐' : '🔗'}</span>
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{src.name}</p>
                    <p className="text-xs text-gray-500">{src.description}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium ${
                    src.connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {src.connected ? 'Connected' : 'Not connected'}
                  </span>
                  <span className="text-[11px] text-gray-500">{src.lastSynced ? `Last synced ${src.lastSynced}` : 'Not synced'}</span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  {src.connected ? (
                    <>
                      <button
                        onClick={() => syncSource(src.name)}
                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        Sync
                      </button>
                      <button
                        onClick={() => disconnectSource(src.name)}
                        className="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => connectSource(src.name)}
                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        {src.oauth ? 'Connect (OAuth)' : 'Connect'}
                      </button>
                      <Link
                        href="/integrations"
                        className="inline-flex items-center rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
                      >
                        Manage
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}