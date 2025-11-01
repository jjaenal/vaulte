# Proses Code Review — Vaulté

Dokumen pedoman code review untuk konsistensi kualitas, keamanan, dan maintainability.

## Tujuan

- Menjaga kualitas kode, keamanan, dan konsistensi standar
- Mendeteksi bug lebih dini dan mengurangi biaya perbaikan
- Transfer pengetahuan dan peningkatan kemampuan tim

## Checklist Reviewer

- [ ] Linting dan format lolos (`npm run lint`, `npm run format` bila ada)
- [ ] Test unit/integrasi lolos; tambahkan test bila fungsi baru
- [ ] Nama variabel/fungsi/kelas jelas (hindari Mysterious Names)
- [ ] Hindari duplikasi (extract fungsi/util bila perlu)
- [ ] Fungsi tidak terlalu panjang; gunakan early return
- [ ] Tanggung jawab kelas jelas; hindari Large Class
- [ ] Parameter tidak berlebihan; pertimbangkan parameter object
- [ ] Akses kontrol dan validasi input (kontrak + backend)
- [ ] Emisi event untuk perubahan state penting (kontrak)
- [ ] Tidak ada hardcoded secrets/API keys
- [ ] Komentar/Doc jelas (NatSpec di kontrak; JSDoc/TSdoc di kode)

## Alur PR

1. Buat branch fitur: `feature/<nama-fitur>` atau perbaikan: `bugfix/<nama-bug>`
2. Pastikan lint & test lolos lokal (dan CI hijau)
3. Ajukan PR ke `dev` dengan deskripsi ringkas (tujuan, dampak, risiko)
4. Minimal 1 reviewer menyetujui; squash merge bila sesuai
5. Merge ke `main` hanya saat rilis/stabil

## Catatan

- PR kecil dan terfokus; hindari shotgun surgery
- Sertakan screenshot untuk perubahan UI
- Tambahkan benchmark/gas report untuk perubahan kontrak signifikan