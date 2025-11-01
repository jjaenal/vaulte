# Vaulté — Decentralized Personal Data Marketplace

Ringkasan proyek monorepo Vaulté (contracts, backend, frontend) dan status pengembangan terkini.

## Struktur Proyek

```
vaulte/
├── vaulte-contracts/   # Smart contracts (Hardhat)
├── vaulte-backend/     # Node.js/Express API
└── vaulte-frontend/    # Next.js 14 (App Router)
```

## Status Terkini (Frontend)

- Integrasi TanStack Query untuk cache dan data fetching
- Devtools diaktifkan (development) untuk inspeksi cache
- SSE: dashboard, vault, marketplace terhubung; update cache langsung via `setQueryData`
- Marketplace: aksi approve/reject/cancel dengan optimistic `useMutation`

## Cara Menjalankan

Frontend:

```bash
cd vaulte-frontend
npm install
npm run dev -- -p 3003
```

Backend:

```bash
cd vaulte-backend
npm install
npm run dev
```

Contracts (Hardhat node):

```bash
cd vaulte-contracts
npx hardhat node
```

## Catatan

- Sesuaikan `NEXT_PUBLIC_BACKEND_URL` di `.env.local` frontend
- Gunakan jaringan `hardhat` lokal atau Mumbai sesuai kebutuhan