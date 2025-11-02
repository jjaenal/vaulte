'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount, useBalance } from 'wagmi';
import { useToast } from '@/components/ui/ToastProvider';
import type { EIP1193Provider } from 'viem'; // Komentar: Tipe provider EIP-1193 untuk menghindari penggunaan any

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Marketplace', href: '/marketplace' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { address } = useAccount();
  // Komentar: Ambil saldo ETH dari wallet terhubung untuk indikator cepat
  const { data: balanceData, isLoading: isBalanceLoading } = useBalance({
    address,
  });
  const { showToast } = useToast();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-2xl font-bold text-purple-700">
                Vaulté
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map(item => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    pathname === item.href
                      ? 'border-purple-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center gap-4">
            {/* Indikator saldo ETH singkat di Navbar */}
            <div className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
              {isBalanceLoading
                ? 'Loading…'
                : `${balanceData?.formatted ?? '0'} ${
                    balanceData?.symbol ?? 'ETH'
                  }`}
            </div>
            <button
              onClick={() => {
                try {
                  // Komentar: Cek ketersediaan provider terlebih dahulu untuk menghindari error runtime
                  const provider: EIP1193Provider | undefined =
                    typeof window !== 'undefined'
                      ? (window as unknown as { ethereum?: EIP1193Provider })
                          .ethereum
                      : undefined;
                  if (!provider?.request) {
                    showToast(
                      'Provider wallet tidak tersedia. Buka MetaMask/compatible wallet.',
                      'error'
                    );
                    return;
                  }
                  provider.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                      {
                        chainId: '0x7A69', // 31337 dalam hex
                        chainName: 'Hardhat Local',
                        nativeCurrency: {
                          name: 'Ether',
                          symbol: 'ETH',
                          decimals: 18,
                        },
                        rpcUrls: ['http://127.0.0.1:8545'],
                      },
                    ],
                  });
                } catch (error) {
                  console.error('Error adding Hardhat network:', error);
                }
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-md text-sm font-medium"
            >
              Tambah Hardhat
            </button>
            <button
              onClick={async () => {
                if (!address) {
                  showToast('Connect wallet dulu untuk faucet', 'error');
                  return;
                }
                try {
                  const resp = await fetch('/api/faucet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address, amountEth: 100 }),
                  });
                  const data = await resp.json();
                  if (!resp.ok) throw new Error(data?.error || 'Faucet gagal');
                  showToast('Faucet 100 ETH sukses', 'success');
                } catch (e) {
                  console.error('Faucet error:', e);
                  showToast(
                    'Faucet gagal. Pastikan Hardhat node aktif',
                    'error'
                  );
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm font-medium"
            >
              Faucet 100 ETH
            </button>
            <ConnectButton />
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            {/* Mobile menu button */}
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className="sm:hidden" id="mobile-menu">
        <div className="pt-2 pb-3 space-y-1">
          {navigation.map(item => (
            <Link
              key={item.name}
              href={item.href}
              className={`${
                pathname === item.href
                  ? 'bg-purple-50 border-purple-500 text-purple-700'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
            >
              {item.name}
            </Link>
          ))}
          <div className="pl-3 pr-4 py-2">
            <ConnectButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
