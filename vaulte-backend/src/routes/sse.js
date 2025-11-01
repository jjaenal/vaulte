const express = require('express');
const eventBus = require('../services/eventBus');

const router = express.Router();

// SSE untuk push update kategori per address
// Tangani preflight jika ada (meski EventSource tidak melakukan OPTIONS, beberapa proxy bisa)
router.options('/categories/:address', (req, res) => {
  const allowList = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map((o) => o.trim()).filter(Boolean);
  const origin = req.headers.origin;
  if (origin && allowList.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Karena EventSource tidak menggunakan kredensial, aman pakai wildcard
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-KEY');
  res.status(204).end();
});
router.get('/categories/:address', (req, res) => {
  const address = String(req.params.address || '').toLowerCase();
  if (!address || address.length < 6) {
    return res.status(400).json({ error: 'Invalid address' });
  }

  // Header SSE
  // Pastikan CORS header eksplisit untuk koneksi SSE (menghindari blokir browser)
  // Izinkan 3002 secara default untuk dev; bisa override via env CORS_ORIGIN
  const allowList = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3002')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const origin = req.headers.origin;
  if (origin && allowList.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    // Fallback: pakai wildcard tanpa kredensial
    // Catatan: SSE umumnya tidak butuh cookie; Authorization header tetap bisa dipakai
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'false');
  }
  // Header CORS tambahan dan beri tahu cache/proxy bahwa header bergantung pada Origin
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-KEY');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // nginx buffering off
  res.flushHeaders?.();

  // Kirim event awal untuk konfirmasi koneksi
  res.write(`event: init\n`);
  res.write(`data: {"ok": true, "address": "${address}"}\n\n`);

  // Keep-alive ping setiap 25 detik
  const keepAlive = setInterval(() => {
    res.write(`event: ping\n`);
    res.write(`data: ${Date.now()}\n\n`);
  }, 25_000);

  // Subscribe ke event bus
  const unsubscribe = eventBus.subscribe(address, (payload) => {
    try {
      res.write(`event: update\n`);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch (e) {
      // Jika write gagal, log ringan lalu tutup koneksi
      console.info('SSE: write gagal:', e?.message);
      clearInterval(keepAlive);
      unsubscribe();
      try { res.end(); } catch (closeErr) {
        // Informasi ringan bila penutupan koneksi gagal, aman untuk diabaikan
        console.info('SSE: gagal menutup koneksi secara bersih:', closeErr?.message);
      }
    }
  });

  // Cleanup saat koneksi ditutup
  req.on('close', () => {
    clearInterval(keepAlive);
    unsubscribe();
  });
});

module.exports = router;