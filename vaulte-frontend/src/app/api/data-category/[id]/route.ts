import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { localhost } from 'viem/chains';
import { CONTRACT_ADDRESSES, DATA_VAULT_ABI } from '@/constants/contracts';

// Buat public client untuk membaca dari blockchain localhost (Hardhat)
const publicClient = createPublicClient({
  chain: localhost,
  transport: http('http://localhost:8545'), // Explicit RPC URL untuk Hardhat
});

// Handler GET untuk mengambil detail kategori berdasarkan ID
// Catatan: Pada Next.js 16, `params` bersifat Promise dan harus di-await
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Ambil dan validasi parameter dinamis dari URL
    const { id } = await params; // Wajib di-await agar tidak undefined
    const categoryId = Number.parseInt(id, 10);
    
    // Validasi awal: jika ID bukan angka, kembalikan 400 (bad request)
    if (!Number.isFinite(categoryId)) {
      // Komentar: id tidak valid, hindari memanggil kontrak
      return NextResponse.json(
        { error: 'Invalid category id' },
        { status: 400 }
      );
    }
    
    // Baca data kategori dari kontrak
    const category = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.dataVault as `0x${string}`,
      abi: DATA_VAULT_ABI,
      functionName: 'getDataCategory',
      args: [BigInt(categoryId)],
    }) as { name: string; owner: `0x${string}`; isActive: boolean; pricePerDay: bigint; dataHash: `0x${string}` };
    
    // Format data untuk response
    const formattedCategory = {
      id: categoryId,
      owner: category.owner,
      name: category.name,
      pricePerDay: Number(category.pricePerDay),
      dataHash: category.dataHash,
      active: category.isActive,
    };
    
    return NextResponse.json(formattedCategory);
  } catch (error) {
    // Komentar: Jika kontrak me-revert karena kategori tidak ada, kembalikan 404
    const msg = (error as Error)?.message || '';
    if (msg.includes('CategoryNotFound')) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    console.error('Error fetching data category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data category', detail: (error as Error)?.message ?? 'unknown error' },
      { status: 500 }
    );
  }
}