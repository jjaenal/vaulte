# Git Workflow — Vaulté

Dokumen alur kerja Git untuk pengembangan Vaulté (branching strategy, commit message, dan checklist).

## Branching Strategy

- `main`: produksi (kontrak mainnet, rilis stabil)
- `dev`: integrasi (testnet), staging fitur
- `feature/<nama-fitur>`: pengembangan fitur
- `bugfix/<nama-bug>`: perbaikan bug
- `hotfix/<isu>`: perbaikan kritis di produksi
- `security/<vulnerability>`: patch keamanan

Contoh:

- `feature/payment-splitter`
- `feature/frontend-marketplace`
- `bugfix/approval-gas-optimization`
- `hotfix/reentrancy-vulnerability`
- `security/access-control-patch`

## Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

Type:

- `feat`, `fix`, `refactor`, `test`, `docs`, `perf`, `security`, `chore`, `ci`, `style`

Scope:

- `contract`, `frontend`, `backend`, `test`, `docs`, `deploy`

Contoh:

- `feat(contract): Add DataVault permission management`
- `fix(frontend): Perbaiki pagination daftar request marketplace`
- `security(contract): Tambah rate limiting untuk mencegah spam`
- `test(contract): Tambah edge case untuk payment splitting`

Advanced (dengan body):

```
feat(contract): Implement pro-rated refund calculation

- Add calculateProRatedRefund function di PaymentSplitter
- Tangani edge cases (0 duration, full refund)
- Tambah unit tests komprehensif

Closes #42
```

## Commit Checklist

- [ ] Format kode: `npm run format`
- [ ] Linting lolos: `npm run lint`
- [ ] Semua test lolos: `npx hardhat test` atau `npm test`
- [ ] Gas usage dicek (jika ada perubahan kontrak)
- [ ] Dokumentasi diperbarui (jika perlu)
- [ ] Tidak ada `console.log` atau code debug tersisa
- [ ] Tidak ada secret/API key di hardcode
- [ ] Pesan commit mengikuti format di atas

## Catatan

- Selalu buat branch fitur untuk pekerjaan non-trivial
- Buka Pull Request ke `dev`; merge ke `main` hanya saat rilis
- Gunakan squash merge untuk menjaga riwayat rapi