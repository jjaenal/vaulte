# Pull Request

## 📝 Deskripsi

Jelaskan perubahan yang dibuat dalam PR ini:

- [ ] Bug fix (perubahan non-breaking yang memperbaiki issue)
- [ ] New feature (perubahan non-breaking yang menambah fungsionalitas)
- [ ] Breaking change (fix atau feature yang menyebabkan existing functionality berubah)
- [ ] Documentation update (perubahan dokumentasi)
- [ ] Refactoring (perubahan code tanpa mengubah fungsionalitas)
- [ ] Performance improvement (peningkatan performa)
- [ ] Security fix (perbaikan keamanan)

## 🔗 Issue Terkait

Fixes #(issue number)

## 🧪 Testing

Jelaskan testing yang sudah dilakukan:

- [ ] Unit tests pass (`npm test` di semua package)
- [ ] Integration tests pass (jika ada)
- [ ] Manual testing dilakukan
- [ ] Edge cases sudah ditest

### Smart Contracts (jika ada perubahan)

- [ ] Contract tests pass (`npx hardhat test`)
- [ ] Gas usage checked (`REPORT_GAS=true npx hardhat test`)
- [ ] Coverage adequate (`npx hardhat coverage`)
- [ ] Security considerations reviewed

## ✅ Code Quality Checklist

### Linting & Formatting

- [ ] `npm run lint` pass di semua package
- [ ] `npm run format:check` pass di semua package
- [ ] No console.log atau debugging code tersisa
- [ ] No hardcoded secrets atau API keys

### Code Review

- [ ] Code mengikuti project conventions
- [ ] Functions/methods memiliki dokumentasi yang jelas
- [ ] Error handling sudah proper
- [ ] Performance impact sudah dipertimbangkan

### Security (untuk smart contracts)

- [ ] Access control sudah proper
- [ ] Input validation sudah ada
- [ ] Reentrancy protection (jika diperlukan)
- [ ] Integer overflow/underflow handled
- [ ] Events emitted untuk state changes

## 📸 Screenshots (jika ada UI changes)

Tambahkan screenshots sebelum dan sesudah perubahan.

## 🚀 Deployment Notes

Apakah ada hal khusus yang perlu diperhatikan saat deployment?

- [ ] Database migration diperlukan
- [ ] Environment variables baru
- [ ] Contract deployment/upgrade diperlukan
- [ ] Breaking changes yang memerlukan koordinasi

## 📚 Documentation

- [ ] README updated (jika diperlukan)
- [ ] API documentation updated (jika diperlukan)
- [ ] Inline comments added untuk complex logic
- [ ] TODO.md updated (jika diperlukan)

## 🔍 Reviewer Notes

Hal-hal yang perlu diperhatikan reviewer:

-
-
-

---

**Checklist untuk Reviewer:**

- [ ] Code review completed
- [ ] Tests reviewed dan adequate
- [ ] Security implications considered
- [ ] Performance impact assessed
- [ ] Documentation adequate
