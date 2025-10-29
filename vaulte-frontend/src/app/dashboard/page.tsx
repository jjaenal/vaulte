'use client';

import { useAccount, useBalance, useDisconnect } from 'wagmi';
import { useState, useEffect } from 'react';
import RegisterDataForm from '@/components/dashboard/RegisterDataForm';
import { useDataVault } from '@/hooks/useDataVault';
import { useToast } from '@/components/ui/ToastProvider';

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('myData');
  const { userCategories, isLoadingCategories, getDataCategory } = useDataVault();
  const [categories, setCategories] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  const { disconnect } = useDisconnect();

  const { data: balanceData, isLoading: isLoadingBalance, isError: isBalanceError, error: balanceError } = useBalance({
    address,
  });
  
  // Dummy data untuk tampilan
  const myData = [
    { id: 1, name: 'Fitness Data', pricePerDay: 0.05, active: true, requests: 3 },
    { id: 2, name: 'Health Records', pricePerDay: 0.1, active: true, requests: 1 },
    { id: 3, name: 'Shopping Habits', pricePerDay: 0.03, active: false, requests: 0 },
  ];
  
  const accessRequests = [
    { id: 101, buyer: '0x1234...5678', categoryName: 'Fitness Data', duration: 30, totalPrice: 1.5, status: 'pending' },
    { id: 102, buyer: '0x8765...4321', categoryName: 'Health Records', duration: 7, totalPrice: 0.7, status: 'approved' },
  ];
  
  const earnings = [
    { id: 201, buyer: '0x8765...4321', categoryName: 'Health Records', amount: 0.7, date: '2025-01-15' },
    { id: 202, buyer: '0x5432...9876', categoryName: 'Fitness Data', amount: 1.2, date: '2025-01-10' },
  ];
  
  // Fetch data categories when user is connected
  useEffect(() => {
    const fetchCategories = async () => {
      if (!userCategories || userCategories.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        const categoryPromises = userCategories.map(async (id) => {
          const category = await getDataCategory(Number(id));
          return { ...category, id: Number(id) };
        });

        const fetchedCategories = await Promise.all(categoryPromises);
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isConnected && userCategories) {
      fetchCategories();
    }
  }, [isConnected, userCategories, getDataCategory]);

  // Toast error jika gagal mengambil balance
  useEffect(() => {
    if (isBalanceError && balanceError) {
      console.error('Failed to fetch balance:', balanceError);
      showToast('Gagal mengambil balance', 'error');
    }
  }, [isBalanceError, balanceError, showToast]);

  if (!isConnected) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Connect your wallet to view your dashboard</h2>
        <p className="mt-4 text-gray-500">You need to connect your wallet to access your data dashboard.</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Data Owner Dashboard</h1>
            <p className="mt-2 text-sm text-gray-500">
              Manage your data categories, access requests, and earnings
            </p>
            <p className="mt-1 text-xs text-gray-400">Connected as {address}</p>
          </div>
          <div className="mt-4 md:mt-0">
            <button
              type="button"
              className="rounded-md bg-purple-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
            >
              Register New Data Category
            </button>
          </div>
        </div>

        {/* Wallet Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-semibold text-gray-900">Wallet Info</h3>
            <p className="mt-2 text-sm text-gray-500 break-all">{address}</p>
            <p className="mt-2 text-lg font-medium text-gray-900">
              {isLoadingBalance ? 'Loading balance…' : `${balanceData?.formatted ?? '0'} ${balanceData?.symbol ?? ''}`}
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => disconnect()}
                className="rounded-md bg-gray-100 px-3.5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-300"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>

        {(isLoading || isLoadingCategories) && (
          <div className="mb-6 text-sm text-gray-500">Loading your on-chain categories...</div>
        )}
        {!isLoading && categories.length > 0 && (
          <div className="mb-6 text-sm text-gray-600">You have {categories.length} on-chain categories.</div>
        )}

        <RegisterDataForm />

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('myData')}
              className={`${
                activeTab === 'myData'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
            >
              My Data Categories
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`${
                activeTab === 'requests'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
            >
              Access Requests
            </button>
            <button
              onClick={() => setActiveTab('earnings')}
              className={`${
                activeTab === 'earnings'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
            >
              Earnings
            </button>
          </nav>
        </div>

        {/* Tab content */}
        <div className="mt-8">
          {activeTab === 'myData' && (
            <div>
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Name
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Price (ETH/day)
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Pending Requests
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {myData.map((category) => (
                      <tr key={category.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {category.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{category.pricePerDay} ETH</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              category.active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {category.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{category.requests}</td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button className="text-purple-600 hover:text-purple-900">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'requests' && (
            <div>
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Buyer
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Data Category
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Duration (days)
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Total Price (ETH)
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {accessRequests.map((request) => (
                      <tr key={request.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {request.buyer}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{request.categoryName}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{request.duration}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{request.totalPrice} ETH</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              request.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : request.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {request.status}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          {request.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button className="text-green-600 hover:text-green-900">Approve</button>
                              <button className="text-red-600 hover:text-red-900">Reject</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'earnings' && (
            <div>
              <div className="mb-6">
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900">Total Earnings</h3>
                  <p className="mt-2 text-3xl font-bold text-purple-600">1.9 ETH</p>
                </div>
              </div>
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Date
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Buyer
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Data Category
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Amount (ETH)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {earnings.map((earning) => (
                      <tr key={earning.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {earning.date}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{earning.buyer}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{earning.categoryName}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{earning.amount} ETH</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}