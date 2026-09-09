# LumaChart — Requirements-Complete EHR Roadmap (45 CFR Part 170)

**A design plan that maps LumaChart against the *entire* ONC Health IT Certification Program — 45 CFR Part 170: Subpart B (standards & implementation specifications, §170.205/207/210), Subpart C (certification criteria, §170.315), and Subpart D (Conditions & Maintenance of Certification, §170.401–406) — not just the Base EHR API.**
Prepared 2026-07-10 · updated 2026-09-09 · companion to `INTEROPERABILITY-PLAN.md` (USCDI/US Core) and `BILLING-AND-CLEARINGHOUSE-PLAN.md`; surfaced in-app on the clinician **Certification (Part 170)** view.

**Regulatory currency (as of 2026-09-09).** Built to the program as revised through the HTI rules: **HTI-1** (Jan 9 2024 — Decision Support Interventions §170.315(b)(11) *replaces* the legacy (a)(9) CDS criterion; **USCDI v3** adopted as the certification baseline effective **Jan 1 2026**, with v4–v6 adoptable via SVAP; Insights Condition; (g)(10) API & (b)(1) updated), **HTI-2** (Dec 16 2024 — TEFCA + program updates), **HTI-3** (Dec 17 2024 — information blocking), **HTI-4** (Aug 4 2025 — electronic prior authorization + e-prescribing). Subpart D Conditions of Certification LumaChart addresses: §170.401 information blocking, §170.402 assurances + Insights, §170.403 communications ("no gag clauses"), §170.404 API Conditions, §170.405 Real World Testing, §170.406 attestations.

> **Honest framing.** LumaChart is a dependency-free front-end prototype. This roadmap enumerates every certification criterion so the design is *complete by construction* — you can see exactly what is prototyped, what is a partner module, and what is still a gap. Certification is achieved by **composition**: one or more Certified Health IT Modules, most of it built on a FHIR-native backend (Medplum/Aidbox) with certified modules bought for the specialized pieces.

## Legend

| Mark | Meaning |
|---|---|
| ✅ **Proto** | Demonstrated in the prototype (synthetic data) |
| 🟡 **Partial** | Modeled in part; needs backend + hardening |
| 🧩 **Partner** | Delivered by a bought certified module |
| ⬜ **Gap** | Not yet built; on the plan |
| ⭐ **Exceeds** | LumaChart goes beyond the regulatory floor |

Criteria marked **[Base]** are part of the **Base EHR Definition** (the minimum bundle for a "Base EHR").

---

## (a) Clinical

| Criterion | Requirement (short) | Status | Strategy |
|---|---|---|---|
| a(1) **[Base]** | CPOE — medications | 🟡 Partial | Build lean CPOE on Medplum `MedicationRequest`; standing-order delegation |
| a(2) **[Base]** | CPOE — laboratory | 🟡 Partial | `ServiceRequest`; Health Gorilla for the lab network 🧩 |
| a(3) **[Base]** | CPOE — diagnostic imaging | ⬜ Gap | `ServiceRequest` (imaging) — Phase 2 |
| a(4) | Drug-drug / drug-allergy interaction checks | ⬜ Gap | Build on a terminology/interaction service (First Databank/Medi-Span) 🧩 |
| a(5) **[Base]** | Demographics (USCDI) | ✅ Proto | Chart + iPad check-in capture; close race/ethnicity/language/address gaps → `Patient` |
| a(9) | Clinical decision support (legacy CDS) | ✅ Proto ⭐ | Prevention engine + Canary; superseded by b(11) DSI below |
| a(12) | Family health history | ⬜ Gap | `FamilyMemberHistory` (new in USCDI v6) — Phase 1 |
| a(13) | Patient-specific education resources | 🟡 Partial | Prevention cards + evidence links; wire Infobutton |
| a(14) | Implantable device list (UDI) | ⬜ Gap | `Device` — Phase 1 (already tracked in the Roadmap view) |
| a(15) | Social, psychological & behavioral data | ✅ Proto ⭐ | **PHQ-9/GAD-7/AUDIT-C instruments + SDOH intake** — a core differentiator |

## (b) Care coordination

| Criterion | Requirement | Status | Strategy |
|---|---|---|---|
| b(1) **[Base]** | Transitions of care (C-CDA send/receive) | ⬜ Gap | C-CDA 5.0.0 generation/consumption — Phase 2 (see interop plan) |
| b(2) | Clinical information reconciliation & incorporation | 🟡 Partial | iPad check-in reconciles problems/meds; extend to allergies + C-CDA import |
| b(3) | Electronic prescribing (NCPDP SCRIPT) | 🧩 Partner | DrFirst / MDToolbox certified e-Rx + EPCS |
| b(6) | Data export | ⬜ Gap | Bulk export tooling — Phase 3 |
| b(7)–b(9) | Security tags / consent management | 🟡 Partial | Research-layer consent modeled; extend to `Consent` + segmentation |
| b(10) | Electronic Health Information (EHI) export | ⬜ Gap | Full-record export — Phase 3 |
| b(11) **[Base]** | **Decision Support Interventions (DSI)** + transparency | ✅ Proto ⭐ | **Canary, prevention engine, Luma assistant** — designed as DSIs with source/evidence/logic disclosed, the exact intent of the 2023 DSI rule |

## (c) Clinical quality measures (CQMs)

| Criterion | Requirement | Status | Strategy |
|---|---|---|---|
| c(1) **[Base]** | CQM — record & export | 🟡 Partial | "Plan-based quality" thesis — assess the *Plan* prospectively; QRDA export |
| c(2) | CQM — import & calculate | ⬜ Gap | Phase 3 |
| c(3) | CQM — report (QRDA I/III) | ⬜ Gap | 2026 CMS QRDA IGs — Phase 3 |
| c(4) | CQM — filter | ⬜ Gap | Phase 3 |

## (d) Privacy & security — *the whole category is Phase 1, non-negotiable*

| Criterion | Requirement | Status | Strategy |
|---|---|---|---|
| d(1) | Authentication, access control, authorization | ⬜ Gap | Medplum auth + RBAC |
| d(2) | Auditable events & tamper-resistance | ⬜ Gap | Provenance + immutable audit log (already load-bearing for the research layer) |
| d(3) | Audit report(s) | ⬜ Gap | Report generation over the audit log |
| d(4) | Amendments | ⬜ Gap | Patient-requested amendments workflow |
| d(5) | Automatic access time-out | ⭐ Proto-adjacent | Canary's session timer already models session awareness; add hard time-out |
| d(6) | Emergency access ("break-the-glass") | ⬜ Gap | Phase 1 |
| d(7) | End-user device encryption | 🧩 Partner | Platform/MDM |
| d(8) | Integrity (hashing) | ⬜ Gap | Phase 1 |
| d(9) | Trusted connection (TLS) | 🧩 Partner | Infra |
| d(10)–d(11) | Auditing actions on PHI · accounting of disclosures | ⬜ Gap | Provenance-backed |
| d(12) | Encrypt authentication credentials | 🧩 Partner | Medplum/OIDC |
| d(13) | Multi-factor authentication | 🧩 Partner | Medplum/OIDC |

## (e) Patient engagement

| Criterion | Requirement | Status | Strategy |
|---|---|---|---|
| e(1) **[Base]** | View, Download, Transmit (VDT) | 🟡 Partial | Patient portal built; add download/transmit |
| e(2) | Secure messaging | 🟡 Partial | Care & messages modeled; harden |
| e(3) | Patient health information capture | ✅ Proto ⭐ | **iPad check-in + patient-reported screenings** feeding the record |

## (f) Public health — *LumaChart's public-health mission lives here*

| Criterion | Requirement | Status | Strategy |
|---|---|---|---|
| f(1) | Immunization registry transmission (IIS) | 🟡 Partial | Prevention portal has immunizations; wire IIS/HL7 |
| f(2) | Syndromic surveillance | ⬜ Gap | Phase 3 |
| f(3) | Reportable laboratory results | ⬜ Gap | Phase 3 |
| f(4) | Cancer registry reporting | ⬜ Gap | Phase 3 |
| f(5) | **Electronic case reporting (eCR)** | ⬜ Gap ⭐-fit | Natural extension of the consented research layer — Phase 3 priority |
| f(6) | Antimicrobial use & resistance | ⬜ Gap | Phase 4 |
| f(7) | Health care surveys | ⬜ Gap | Phase 4 |

## (g) Design & performance

| Criterion | Requirement | Status | Strategy |
|---|---|---|---|
| g(3) | **Safety-enhanced design (usability)** | ✅ Proto ⭐ | Restore Mode, lean notes, calm notifications — usability *is* the product thesis; formalize SED testing |
| g(4) | Quality management system | ⬜ Gap | Adopt a QMS |
| g(5) | Accessibility-centered design | 🟡 Partial | `prefers-reduced-motion`, contrast, keyboard — formalize WCAG |
| g(6) | Consolidated CDA creation performance | ⬜ Gap | With b(1) |
| g(7) **[Base]** | Application access — patient selection | ⬜ Gap | Medplum FHIR API |
| g(9) **[Base]** | Application access — all data request | ⬜ Gap | Medplum FHIR API |
| g(10) **[Base]** | **Standardized API (FHIR / SMART / Bulk)** | 🟡 Partial | The centerpiece — Medplum FHIR R4 + US Core + SMART 2.0 + Bulk (see interop plan) |

## (h) Transport

| Criterion | Requirement | Status | Strategy |
|---|---|---|---|
| h(1) | Direct Project (secure health transport) | 🧩 Partner | HISP partner; certifies only with b(1) |
| h(2) | Direct + XDR/XDM | 🧩 Partner | HISP partner |

---

## Where LumaChart already *exceeds* the floor ⭐

The certification floor is necessary but not sufficient for the problem LumaChart exists to solve. These are built and demonstrated, and have no direct single criterion:

- **Clinician sustainability** — Canary (EHR-time/after-hours early warning), Wellness Center, the well-being toggle, CME & licensure, and the **AMA Joy in Medicine / EHR8-WOW8 CWO dashboard** with a one-click **data-extract report**.
- **Patient healthspan** — USPSTF Grade A/B prevention wired into both role views, longevity tracking, and a "mental health is health" screening suite (PHQ-9/GAD-7/AUDIT-C) with symptom-targeted, PubMed-cited self-care.
- **Public-health research** — a consented, de-identified prospective research layer (the learning-health-system substrate that f(5) eCR would plug into).
- **Revenue integrity** — full ICD-10 capture with ICD-9 crosswalk, agent-assisted CPT, and the Puerto Rico clearinghouse bridge.

## Phased plan to a certifiable module

1. **Phase 0 — Foundation.** Choose Medplum vs. Aidbox; re-model `data.js` as US Core resources; emit **Provenance** from the first write.
2. **Phase 1 — Security + API core.** Entire **(d)** category; **g(7)/g(9)/g(10)** with SMART 2.0 + Bulk; a(5), a(12), a(14), d(5) hard time-out.
3. **Phase 2 — Exchange + orders.** b(1)/b(2) C-CDA, b(3) e-Rx 🧩, a(1)–a(3) CPOE, a(4) interaction checks, h(1) Direct 🧩.
4. **Phase 3 — Quality + public health.** c(1)–c(4) CQMs, f(1)/f(5) immunization + **eCR**, b(6)/b(10) export, e(1) VDT.
5. **Phase 4 — Breadth.** Remaining (f) public-health transmissions, g(4) QMS, formal g(3) SED and g(5) accessibility testing.

## Gates before real-world use (unchanged, restated)

ONC-ACB certification testing (Inferno for g(10)) · HIPAA Security Rule risk analysis + SOC 2 + independent pen-test · IRB for the research layer · clinical validation of any Canary/DSI predictive threshold · coding-compliance review for the billing agent. Nothing here is a shortcut around those.

## Why certification is non-negotiable: the Medicare Promoting Interoperability Program

Hospitals and critical access hospitals participating in the Medicare Promoting Interoperability
Program must be **meaningful users of certified EHR technology (CEHRT)** to avoid a **downward
Medicare payment adjustment**. Per the CY2021 Physician Fee Schedule final rule (85 FR 84818–84828),
CEHRT means technology certified to (1) the 2015 Edition criteria, (2) the 2015 Edition **Cures
Update** criteria (API/smartphone patient access, new privacy & security criteria, USCDI updates),
or (3) a combination. Timing rule (CY2022 fact sheet): functionality must be in place on the first
day of the EHR reporting period and certified by its last day — "deployed but pending
certification" is permitted in many situations.

**Business consequences for LumaChart:**
- No hospital can attest with an uncertified product — certification gates the entire hospital market.
- **Certification is a material expense**: ONC-ACB/ATL per-criterion testing, ongoing surveillance,
  annual Real World Testing plans/results, and §170.315(b)(11) decision-support transparency.
  Budget it as a program, not a one-time fee.
- Buyers verify status on the ONC Certified Health IT Product List (CHPL): https://chpl.healthit.gov/
- Required hospital attestations LumaChart is designed to support: Security Risk Analysis and the
  SAFER Guides self-assessment (see Security & SAFER view).

Source: CMS Promoting Interoperability Programs —
https://www.cms.gov/medicare/regulations-guidance/promoting-interoperability-programs
(2022 CEHRT fact sheet provided by the founder, 2026-08-03.)
