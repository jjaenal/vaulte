import { NextRequest, NextResponse } from 'next/server';

// API proxy untuk kalkulasi quote akses data
// Komentar (Bahasa Indonesia): Meneruskan POST body ke backend agar frontend bisa memanggil /api/marketplace/quote.

export const dynamic = 'force-dynamic';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Body tidak valid (JSON diperlukan)' },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetch(`${BACKEND}/api/marketplace/quote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const contentType =
      upstream.headers.get('content-type') || 'application/json';
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: { 'content-type': contentType },
    });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'Gagal memanggil backend', detail },
      { status: 502 }
    );
  }
}
