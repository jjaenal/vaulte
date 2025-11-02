import { NextRequest, NextResponse } from 'next/server';

// API proxy ke backend untuk mengambil daftar request sebagai buyer
// Komentar (Bahasa Indonesia): Endpoint ini mem-proxy ke backend agar frontend bisa memanggil /api/marketplace/requests/buyer/:address tanpa 404

export const dynamic = 'force-dynamic';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Catatan (Bahasa Indonesia): Pada Next.js 16, `params` dapat berupa Promise.
// Lakukan `await params` untuk memastikan nilai tidak undefined.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ address: string }> | { address: string } }
) {
  const p = params instanceof Promise ? await params : params;
  const address = p?.address;
  if (!address) {
    // Validasi awal agar tidak memanggil backend dengan parameter kosong
    return NextResponse.json({ error: 'Address kosong' }, { status: 400 });
  }

  const url = `${BACKEND}/api/marketplace/requests/buyer/${encodeURIComponent(address)}`;

  try {
    const upstream = await fetch(url, { cache: 'no-store' });
    const contentType =
      upstream.headers.get('content-type') || 'application/json';
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: { 'content-type': contentType },
    });
  } catch (err: unknown) {
    // Tangani error jaringan/upstream
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'Gagal memanggil backend', detail },
      { status: 502 }
    );
  }
}
