import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { polygonMumbai } from 'viem/chains';
import { CONTRACT_ADDRESSES, DATA_VAULT_ABI } from '@/constants/contracts';

// Buat public client untuk membaca dari blockchain
const publicClient = createPublicClient({
  chain: polygonMumbai,
  transport: http(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id);
    
    // Baca data kategori dari kontrak
    const category = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.dataVault as `0x${string}`,
      abi: DATA_VAULT_ABI,
      functionName: 'getDataCategory',
      args: [BigInt(categoryId)],
    }) as [string, string, bigint, string, boolean]; // [owner, name, pricePerDay, dataHash, active]
    
    // Format data untuk response
    const formattedCategory = {
      id: categoryId,
      owner: category[0],
      name: category[1],
      pricePerDay: Number(category[2]),
      dataHash: category[3],
      active: category[4],
    };
    
    return NextResponse.json(formattedCategory);
  } catch (error) {
    console.error('Error fetching data category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data category' },
      { status: 500 }
    );
  }
}