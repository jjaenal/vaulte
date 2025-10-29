# Buyer Survey — Data Needs (10 Questions)

Purpose: Understand buyer data needs, consent requirements, pricing expectations, and platform features to inform Vaulté’s marketplace design.

Instructions:
- Estimated time: 7–10 minutes
- Your answers are confidential and used only for product research
- If any question isn’t relevant, feel free to skip

## Questions
1) What primary use-cases do you need personal data for?
- Examples: market research, product analytics, health studies, geospatial analysis, ML model training
- Open-ended

2) Which data types are most valuable to you?
- Select all that apply: fitness/health, location, purchase behavior, app usage, demographics, surveys, browsing patterns, time-series logs
- Why these? (Open-ended)

3) What level of granularity and structure do you require?
- Multiple choice: aggregated vs. individual-level vs. pseudonymous
- Format preferences: JSON, CSV, Parquet; schema requirements
- Metadata needs: timestamps, device type, region, sampling rate

4) How fresh should the data be?
- Options: real-time (<24h), recent (<=7 days), historical (>30 days)
- Update frequency: daily/weekly/monthly

5) What quality and validity signals do you need?
- Examples: consent proof, data provenance, owner verification, deduplication, completeness, outlier handling
- Minimum sample size per cohort

6) What consent and privacy constraints are mandatory for you?
- Required: explicit owner consent, revocable access, retention limits, anonymization/pseudonymization, data minimization
- Compliance frameworks: GDPR/CCPA, HIPAA (if health), internal policy

7) What access model do you prefer?
- Per-request purchase, time-bound subscription (e.g., per day/week), bulk datasets, streaming API
- Need for sandboxed viewing vs. full export

8) How do you think about pricing and budget?
- Willingness-to-pay per category/day (range)
- Preferred pricing: fixed, tiered, volume discounts, pay-per-query
- Typical monthly budget for data acquisition (range)

9) What discovery and filtering features would help you find the right data?
- Filters: persona cohort, geo, timeframe, device/platform, event types
- Ratings/reviews, samples/previews, queryable schema, dataset summaries

10) What risks or blockers would stop you from buying?
- Concerns: data ethics, legal risk, quality uncertainty, vendor lock-in, integration friction
- What evidence or guarantees would reduce these concerns?

## Optional Profile
- Organization type: startup, enterprise, academic, NGO, independent
- Role: researcher, data scientist, PM, marketing, analyst, compliance
- Region/timezone
- Urgency: when do you need data? (now/this month/quarter)

## Follow-up
- Interested in pilot access or samples? (Yes/No)
- Best contact method (email/Discord/Twitter)
- Consent to be contacted for a 30‑minute interview: https://calendly.com/vaulte/30min

---

Usage: Share via email/DM or embed in Typeform/Google Forms. Log respondents and outcomes in `docs/user-outreach-tracking.csv`.