# LumaChart — the hospital EHR built for public health

**LUMAEHR.com** · An evidence-based EHR concept where **clinician-centered interoperability *is* physician-health infrastructure** — and the same lean, structured data turns into public-health knowledge.

---

## The thesis that ties it together

Physician burnout and health-IT interoperability are usually treated as two separate conversations. LumaChart's argument is that they are one:

1. **Burnout traces to EHR *burden*.** Primary-care physicians spend ~5.9 hr of an 11.4-hr day in the EHR, with ~1.4 hr of after-hours "pajama time"; inbox and clerical work are the largest slices. (Arndt 2017, PMID 28893811)
2. **Burden traces to documentation the clinician re-enters by hand** — bloated because U.S. notes are built around billing, not medicine (U.S. notes ≈ 4× longer than the same EHR abroad; Downing/Bates/Longhurst 2018, PMID 29801050).
3. **Interoperability, designed around the clinician, is the burden-reduction lever.** Every USCDI data class that flows in cleanly — labs, meds, transitions of care, eligibility, immunizations — is a task the clinician *doesn't* do at 9pm.
4. **The same lean, coded, structured data is research-grade.** Consented and de-identified, it powers the public-health research layer the National Academy of Medicine has called for.

One architecture, the whole **Quadruple Aim** (Bodenheimer & Sinsky 2014, PMID 25384822): better care, better health, lower cost, **and care of the provider.** See it interactively in the app under **Physician health × Interoperability**.

---

## What's in this repo

| | |
|---|---|
| **[docs/LumaChart-Planning.pdf](docs/LumaChart-Planning.pdf)** | The planning document — vision, full evidence base, Canary engine, three pillars, ONC/HIPAA/IRB gates, build-vs-buy. Every PMID is a clickable PubMed link. |
| **[docs/INTEROPERABILITY-PLAN.md](docs/INTEROPERABILITY-PLAN.md)** | The compliance plan — USCDI v3.1 regulatory baseline (USCDI v6 / US Core 9.0.0 / C-CDA 5.0.0 via the 2026 SVAP), a full USCDI data-class → LumaChart feature → FHIR resource mapping, a phased plan to §170.315(g)(10) certification, and a 2026-Standards-for-Approval checklist. Sourced from healthit.gov primary documents; unverified items flagged. |
| **[docs/ONC-CERTIFICATION-ROADMAP.md](docs/ONC-CERTIFICATION-ROADMAP.md)** | The requirements-complete plan — **every** ONC §170.315 (a)–(h) certification criterion mapped to LumaChart's status (prototype / partial / partner / gap / exceeds-floor) with a five-phase path to a certifiable module. |
| **[docs/BILLING-AND-CLEARINGHOUSE-PLAN.md](docs/BILLING-AND-CLEARINGHOUSE-PLAN.md)** | The revenue-cycle plan — undercoding fix, the billing agent, and the Puerto Rico ICD-9 clearinghouse bridge. |
| **[docs/TRUST-SECURITY-DEPLOYMENT.md](docs/TRUST-SECURITY-DEPLOYMENT.md)** | Privacy & security (HIPAA), the ONC SAFER safety practices, cloud-vs-local hosting, implementation readiness, EHR-contract checklist, and the IRB research gate — simplified for health systems. |
| **[docs/PLANS-AND-VALUE.md](docs/PLANS-AND-VALUE.md)** · **[docs/COMPETITIVE-LANDSCAPE.md](docs/COMPETITIVE-LANDSCAPE.md)** · **[docs/ENTERPRISE-INTEGRATION-PLAN.md](docs/ENTERPRISE-INTEGRATION-PLAN.md)** | Long-term value & pricing model · competitive positioning ("evidence on the EHR, not just AI") · enterprise integration & nationwide exchange. |
| **[docs/ENTERPRISE-INTEGRATION-PLAN.md](docs/ENTERPRISE-INTEGRATION-PLAN.md)** | The enterprise architecture — one record across inpatient/outpatient/ED/pharmacy/lab/imaging (HL7 v2 + FHIR + X12 + IHE, EMPI), one portal, and nationwide exchange via TEFCA/QHIN, Carequality & CommonWell. |
| **[docs/COMPETITIVE-LANDSCAPE.md](docs/COMPETITIVE-LANDSCAPE.md)** | Positioning — the best idea from each major EHR vendor, improved. LumaChart's wedge: **evidence-based research in the record, not just AI on top.** |
| **Interactive prototype** | `index.html` + `luma.css` + `data.js` + `app.js`. Dependency-free — open `index.html` in any browser, or `python3 -m http.server`. Roles: Clinician · Patient · Researcher · **CWO** (Chief Wellness Officer). |

## Prototype highlights

- **Three roles** — Clinician · Patient · Researcher (top-bar switcher).
- **Three themes** — Restore (low-glare dark, the default — *eyestrain reduction is a called-out feature*) · Classic · Modern Clinical.
- **🐦 Canary** — burnout early-warning engine on an accelerated demo clock (1 s = 1 min): micro-break at 25 min, breathing prompt at 60, extended-login warning at 120. Private and non-punitive.
- **Physician health × Interoperability** — the synthesis view: toggle each interoperable feed on and watch the projected after-hours load fall, each row tied to the real burnout driver it addresses.
- **Structured Assessment & Plan** — the record's future tense (FHIR CarePlan + companion Task): what / why / when / who, with a patient-friendly translation published to the portal.
- **Prevention plan with scheduling** — real slot-picking flow and `.ics` calendar export.
- **Roadmap & gates** — ONC §170.315 Base-EHR tracker and the build-vs-buy map (Medplum/Aidbox FHIR backend; DrFirst/MDToolbox, Health Gorilla, Candid/Claim.MD, Stedi/Availity).
- **✨ Luma assistant** — scripted side-by-side helper (runs entirely in the browser; a production version would be a §170.315(b)(11) decision-support intervention).
- **Morphing SVG logo**, mobile-friendly, honors `prefers-reduced-motion`.

## Evidence integrity

Every citation in the app **and** the planning document is a **real PubMed ID verified against PubMed E-utilities** — click any PMID chip to open the source. Illustrative figures (e.g., the synthesis view's minutes-reclaimed estimates) are labeled as such and kept distinct from cited findings. Nothing is fabricated.

## Status

**Demonstration prototype — synthetic data only, not for clinical use.**

Gates before real-world use: ONC Health IT certification & FHIR interoperability · HIPAA security review & independent audit · IRB approval for the research layer · clinical validation of Canary thresholds. The path through them is detailed in [docs/INTEROPERABILITY-PLAN.md](docs/INTEROPERABILITY-PLAN.md) and the in-app Roadmap.
