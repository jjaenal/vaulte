import { NextResponse } from 'next/server';
import { parseEther } from 'viem';

// API Faucet: Menambah saldo ETH ke alamat pada Hardhat local
// Catatan: Hanya untuk pengembangan lokal. Jangan aktifkan di produksi.
export async function POST(request: Request) {
  try {
    const { address, amountEth } = await request.json();
    if (typeof address !== 'string' || !address.match(/^0x[0-9a-fA-F]{40}$/)) {
      return NextResponse.json({ error: 'Alamat tidak valid' }, { status: 400 });
    }

    const eth = typeof amountEth === 'number' && amountEth > 0 ? amountEth : 100; // default 100 ETH
    // Konversi ETH ke wei dengan presisi menggunakan viem.parseEther
    // Catatan: Hindari Math.floor(eth * 1e18) karena melampaui Number.MAX_SAFE_INTEGER dan kehilangan presisi
    const weiBigInt = parseEther(String(eth));
    const weiHex = '0x' + weiBigInt.toString(16);

    const rpcResp = await fetch('http://127.0.0.1:8545', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Panggil hardhat_setBalance untuk set saldo
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'hardhat_setBalance',
        params: [address, weiHex],
      }),
    });

    // Tipe aman untuk respons JSON-RPC
    type JsonRpcResponse = { error?: { code?: number; message?: string }; result?: unknown };
    const data: JsonRpcResponse = await rpcResp.json();
    if (data.error) {
      return NextResponse.json({ error: data.error.message || 'RPC error' }, { status: 500 });
    }

    // Verifikasi saldo setelah setBalance
    const balResp = await fetch('http://127.0.0.1:8545', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'eth_getBalance',
        params: [address, 'latest'],
      }),
    });
    const balData: JsonRpcResponse = await balResp.json();
    const balanceHex = balData?.result as string | undefined;

    return NextResponse.json({ ok: true, address, amountEth: eth, balanceHex });
  } catch (err) {
    console.error('Faucet error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}