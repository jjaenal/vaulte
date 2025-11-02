# CONTRIBUTING

Terima kasih sudah berkontribusi ke Vaulté! Dokumen ini menjelaskan standar kontribusi agar kualitas, keamanan, dan konsistensi kode tetap terjaga.

## Prasyarat

- Node.js 18+
- npm 9+
- Wallet untuk pengujian (untuk kontrak)

## Struktur Monorepo

- `vaulte-contracts` (Hardhat, Solidity)
- `vaulte-backend` (Node.js/Express)
- `vaulte-frontend` (Next.js)

## Alur Kerja (Workflow)

1. Buat branch sesuai format:
   - `feature/<nama-fitur>`
   - `bugfix/<nama-bug>`
   - `hotfix/<isu>`
2. Lakukan perubahan kecil dan teruji (small-step), jalankan tes setelah setiap perubahan.
3. Buka Pull Request menggunakan template yang tersedia dan isi checklist kualitas.

## Standar Kode

- Jalankan `npm run lint` di semua paket sebelum commit.
- Jalankan `npm run format:check` di semua paket; gunakan `npm run format` untuk auto-fix.
- Ikuti Solidity Style Guide dan OpenZeppelin standards untuk kontrak.
- Gunakan Prettier untuk format otomatis.

## Testing

- Kontrak: `npx hardhat test` dan `npx hardhat coverage` (target 100%).
- Backend: `npm test` (unit/integration bila ada).
- Frontend: `npm run build` untuk memastikan tidak ada error tipe/kompilasi.

## Keamanan (Smart Contracts)

- Tambahkan akses kontrol untuk semua fungsi yang mengubah state.
- Terapkan `ReentrancyGuard` pada fungsi pembayaran.
- Validasi semua input (revert dengan pesan jelas).
- Emit event untuk perubahan state kritis.
- Hindari `tx.origin` untuk autentikasi, gunakan `msg.sender`.

## Commit Message

Format:

```
<type>(<scope>): <subject>

[opsional body]
[opsional footer]
```

Contoh:

- `feat(contract): Implement permission management in DataVault`
- `fix(frontend): Perbaiki pagination di list marketplace`
- `test(contract): Tambah skenario edge case untuk PaymentSplitter`

## Pull Request

- Gunakan template PR (`.github/PULL_REQUEST_TEMPLATE.md`).
- Pastikan checklist PR terisi: lint, format, test, coverage, security, docs.
- Sertakan screenshot bila ada perubahan UI.

## Husky Hooks

- Pre-commit: menjalankan `lint-staged` dan lint di semua paket.
- Pre-push: menjalankan tes di contracts dan backend, build di frontend (ditambahkan).

## CI/CD

- GitHub Actions menjalankan lint, format check, test, dan coverage.
- Gas report tersedia untuk kontrak dengan `REPORT_GAS=true`.

## Review

- Fokus pada: correctness, keamanan, performa, dan readability.
- Gunakan komentar yang menjelaskan "mengapa" pada bagian kompleks.

## Tips

- Hindari nesting yang dalam; gunakan early return.
- Hindari cloning/kopi objek yang tidak perlu.
- Gunakan nama deskriptif untuk variabel/fungsi.

Selamat berkontribusi! 🚀
