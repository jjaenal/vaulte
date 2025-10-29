'use client';

import { useAccount } from 'wagmi';
import { useState } from 'react';
import RequestAccessForm from '@/components/marketplace/RequestAccessForm';
import { useToast } from '@/components/ui/ToastProvider';

export default function Marketplace() {
  const { address, isConnected } = useAccount();
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  
  // Dummy data untuk tampilan
  const availableData = [
    { id: 1, owner: '0xabcd...1234', name: 'Fitness Data', description: 'Daily workout and activity tracking data', pricePerDay: 0.05, category: 'Health' },
    { id: 2, owner: '0xefgh...5678', name: 'Health Records', description: 'Anonymized health metrics and vitals', pricePerDay: 0.1, category: 'Health' },
    { id: 3, owner: '0xijkl...9012', name: 'Shopping Habits', description: 'Online shopping preferences and history', pricePerDay: 0.03, category: 'Consumer' },
    { id: 4, owner: '0xmnop...3456', name: 'Travel History', description: 'Location data and travel patterns', pricePerDay: 0.08, category: 'Lifestyle' },
    { id: 5, owner: '0xqrst...7890', name: 'Social Media Usage', description: 'Engagement metrics and content preferences', pricePerDay: 0.04, category: 'Social' },
  ];
  
  const myRequests = [
    { id: 101, owner: '0xabcd...1234', categoryName: 'Fitness Data', requestDate: '2025-01-15', duration: 30, totalPrice: 1.5, status: 'pending' },
    { id: 102, owner: '0xefgh...5678', categoryName: 'Health Records', requestDate: '2025-01-10', duration: 7, totalPrice: 0.7, status: 'approved' },
    { id: 103, owner: '0xijkl...9012', categoryName: 'Shopping Habits', requestDate: '2025-01-05', duration: 14, totalPrice: 0.42, status: 'rejected' },
  ];

  const filteredData = availableData.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRequestComplete = () => {
    showToast('Access request submitted', 'success');
  };

  if (!isConnected) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Connect your wallet to access the marketplace</h2>
        <p className="mt-4 text-gray-500">You need to connect your wallet to browse and request data.</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Data Marketplace</h1>
            <p className="mt-2 text-sm text-gray-500">
              Browse and request access to personal data
            </p>
            <p className="mt-1 text-xs text-gray-400">Connected as {address}</p>
          </div>
          <div className="mt-4 md:mt-0 w-full md:w-64">
            <input
              type="text"
              placeholder="Search data..."
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Available Data */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Data</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredData.map((item) => (
              <div key={item.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900">{item.pricePerDay} ETH/day</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                      {item.category}
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-gray-500">Owner: {item.owner}</p>
                  </div>
                  <div className="mt-5">
                    <RequestAccessForm
                      categoryId={item.id}
                      categoryName={item.name}
                      pricePerDay={item.pricePerDay}
                      onRequestComplete={handleRequestComplete}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Requests */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Access Requests</h2>
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    Data Category
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Owner
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Request Date
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Duration
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Total Price
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
                {myRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {request.categoryName}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{request.owner}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{request.requestDate}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{request.duration} days</td>
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
                        <button className="text-red-600 hover:text-red-900">Cancel</button>
                      )}
                      {request.status === 'approved' && (
                        <button className="text-purple-600 hover:text-purple-900">View Data</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}