'use client';

import { useSwitchChain } from 'wagmi';
import { hardhat } from 'wagmi/chains';
import { useToast } from './ui/ToastProvider';

export default function SwitchToHardhat() {
  const { switchChain } = useSwitchChain();
  const { showToast } = useToast();

  // Fungsi untuk switch ke Hardhat (chain ID 31337)
  const handleSwitchToHardhat = () => {
    try {
      switchChain({ chainId: hardhat.id });
      // Tampilkan notifikasi sukses menggunakan ToastProvider (message, type)
      showToast('Berhasil switch ke Hardhat Local', 'success');
    } catch (error) {
      // Tampilkan notifikasi error menggunakan ToastProvider (message, type)
      showToast(
        'Gagal switch ke Hardhat Local. Pastikan network sudah ditambahkan di wallet.',
        'error'
      );
      console.error('Error switching to Hardhat:', error);
    }
  };

  return (
    <button
      onClick={handleSwitchToHardhat}
      className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-medium"
    >
      Switch ke Hardhat
    </button>
  );
}
