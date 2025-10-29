# Vaulté — Buyer Interview Script (30-Min)

Goal: Memahami kebutuhan data, proses procurement, consent/privacy requirements, pricing, integrasi, dan blockers untuk memvalidasi fit produk Vaulté.

Calendly: https://calendly.com/vaulte/30min

## Struktur Sesi (30 menit)
- 0–3’ Intro & Consent
- 3–8’ Konteks & Use Case
- 8–15’ Kebutuhan Data (tipe, granularitas, freshness, kualitas)
- 15–22’ Consent/Privacy & Compliance
- 22–27’ Pricing & Procurement
- 27–30’ Integrasi & Next Steps

## 0–3’ Intro & Consent
- “Terima kasih waktunya. Kami bangun Vaulté — privacy‑first data marketplace dengan provenance & granular permissions.”
- “Call ini direkam untuk riset internal, tidak dibagikan eksternal. Setuju?”
- “Kalau ada hal sensitif, silakan bilang, kami skip.”

## 3–8’ Konteks & Use Case
- “Apa peran Anda dan tim?”
- “Gunakan data untuk apa? (model training, market research, personalization, risk scoring, audit)”
- “Sumber data saat ini?”
- “Pain points terbesar saat ini?”

Probes:
- “Contoh proyek terakhir yang pakai data?”
- “Siapa stakeholder utama (legal, security, procurement)?”

## 8–15’ Kebutuhan Data
- “Tipe data apa yang dicari? (health/fitness, professional, financial, location, social)”
- “Granularitas: individual vs aggregated vs statistical?”
- “Freshness: real‑time, harian, mingguan?”
- “Kualitas/provenance: bagaimana verifikasi yang Anda butuhkan?”
- “Volume & frekuensi: seberapa sering/berapa besar?”

Probes:
- “Format preferensi? (CSV/JSON, Parquet, API stream)”
- “Contoh skema minimal?”

## 15–22’ Consent/Privacy & Compliance
- “Persyaratan consent apa yang mandatory?”
- “Kebutuhan anonymization/pseudonymization?”
- “Retention period & usage restrictions?”
- “Regulasi relevan? (GDPR, HIPAA, PCI, lokal)”
- “Audit trail yang dibutuhkan?”

Probes:
- “Apakah butuh ‘data deletion on demand’?”
- “Perlu zero‑knowledge proofs atau signed attestations?”

## 22–27’ Pricing & Procurement
- “Model akses: one‑time, subscription, time‑limited, pay‑per‑use?”
- “Range budget & batas maksimum per kategori?”
- “Apa yang membuat harga ‘worth it’ vs ‘too expensive’?”
- “Proses procurement: vendor onboarding, security review, timeline?”
- “Kontrak: MSA, DPA, SLA — perlu apa saja?”

Probes:
- “Benchmark yang Anda pakai saat ini?”
- “Perlu trial/sample anonymized?”

## 27–30’ Integrasi & Next Steps
- “Metode integrasi: API, batch file, webhook?”
- “Tooling: data warehouse (Snowflake/BigQuery), ETL, BI, MLOps?”
- “Success criteria 30–60 hari?”
- “Mau lanjut: kirim 1‑pager + sample anonymized dan booking sesi teknis?”

## Scoring (1–10)
- Urgensi kebutuhan data
- Privasi/Consent criticality
- WTP (willingness to pay)
- Ease of integration
- Procurement readiness

## Catatan & Logging
- Gunakan `docs/user-research-notes-template.md`
- Track di `docs/user-outreach-tracking.csv` dengan Tag: BuyerInterview
- Simpan link recording + keputusan next steps

## Follow‑up Materials
- 1‑pager Vaulté (privacy, provenance, permissions, pricing tiers)
- Sample dataset (anonymized)
- Draft DPA/SLA (opsional)