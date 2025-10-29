# Vaulté — Buyer Personas

Tujuan: Memetakan tipe buyer utama untuk memandu outreach, interview, pricing, dan integrasi.

## 1) Research Lead — University/Think Tank
- Demografi/Peran: PhD/Prof; pimpin proyek penelitian; grant‑driven
- Goals: akses dataset verified, etis, dan dapat di‑cite
- Kebutuhan Data: aggregated + anonymized; provenance kuat; consent jelas
- Freshness: mingguan/bulanan; historis untuk longitudinal studies
- Consent/Compliance: IRB/ethics board, GDPR, data deletion on request
- Pricing Bands: $100–500/mo per kategori; prefer subscription atau time‑limited
- Procurement: proses formal (DPA, SLA), timeline 4–8 minggu
- Integrasi: batch CSV/Parquet, repository akademik, reproducibility
- Pain Points: broker data tidak transparan, dokumentasi minim
- Quote: “Tanpa provenance dan consent, data tidak bisa dipakai.”

## 2) Data Product Manager — HealthTech
- Peran: memimpin pipeline data untuk fitur kesehatan
- Goals: real‑time insights untuk pengguna; kepatuhan HIPAA
- Kebutuhan Data: individual‑level; biometric & activity; high quality
- Freshness: real‑time/harian; event‑driven
- Consent/Compliance: HIPAA, granular permissions, retention ketat
- Pricing Bands: $200–1,000/mo; premium untuk real‑time & verified
- Procurement: security review, vendor onboarding, legal sign‑off
- Integrasi: API streaming, webhook, audit logs
- Pain Points: sumber noisy, consent tidak jelas, audit sulit
- Quote: “Granular permissions + audit trail adalah wajib.”

## 3) ML Engineer — Fintech/Lending
- Peran: bangun model risk/credit; butuh data akurat
- Goals: fitur prediktif dengan low latency; compliance PCI
- Kebutuhan Data: financial + behavioral; individual‑level; feature‑ready
- Freshness: harian/mingguan; historis 12–24 bulan
- Consent/Compliance: DPA, usage restrictions, pseudonymization
- Pricing Bands: $300–1,500/mo; bayar premium untuk kualitas & coverage
- Procurement: cepat jika ROI jelas; PoC → kontrak
- Integrasi: batch + API; schema stabil; lineage
- Pain Points: data bias, drift, provenance ambigu
- Quote: “Tanpa lineage yang jelas, sulit maintain model.”

## 4) Marketing Analyst — E‑commerce
- Peran: kampanye, segmentasi, attribution
- Goals: insights audience & personalization yang aman
- Kebutuhan Data: aggregated + cohort; location/social; anonymized
- Freshness: mingguan; kampanye musiman
- Consent/Compliance: opt‑in, no PII leakage, deletion
- Pricing Bands: $50–300/mo; sensitif harga; prefer pay‑per‑use
- Procurement: simple; butuh sampel & quick wins
- Integrasi: CSV/BI tools; dashboards
- Pain Points: akurasi rendah, noise tinggi, compliance risk
- Quote: “Anonymized cohorts dengan provenance itu ideal.”

## 5) Risk Analyst — Insurtech
- Peran: analisis risiko; policy pricing
- Goals: model risiko akurat; traceable data
- Kebutuhan Data: health/activity + location; kombinasi individual & aggregated
- Freshness: mingguan; historis untuk baseline
- Consent/Compliance: strict usage scope, retention pendek, audit siap
- Pricing Bands: $150–800/mo; willing bayar untuk reliability
- Procurement: formal; multi‑stakeholder (legal, compliance, data)
- Integrasi: secure batch, S3/GCS, signed attestations
- Pain Points: provenance lemah, compliance burden, akses kompleks
- Quote: “Reliability dan auditability mengalahkan harga.”

## Persona Usage
- Outreach: personalisasi pesan & value props
- Interview: fokus sesuai pain points persona
- Pricing: set tier/multipliers berdasarkan kategori
- Integrasi: siapkan mode (API vs batch) per persona