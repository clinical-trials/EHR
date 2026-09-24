# LumaChart — Clinical Coverage Taxonomy (the full basics of medicine)

*Framing lens: the U.S. medical licensing exam (USMLE Step 1 / 2 CK / 3), the canonical map of what a
physician must know. We use only the standard high-level structure (organ systems + basic/clinical sciences —
common medical categories), not any copyrighted review-book content. This taxonomy gives the evidence engine
**structured specialty breadth**, frames subspecialties, and sets a credible clinical-content roadmap.*

## Why this matters
- **Specialty breadth is a CDS-currency requirement** (emergency / hospital / ambulatory / subspecialty, no silo).
  Organizing coverage on the USMLE map makes breadth *structured and checkable*, not an ad-hoc pile of PMIDs.
- **Credibility** with clinicians, reviewers, and buyers: "built to the full breadth of U.S. medical knowledge."
- **A roadmap**: what clinical content to build first (beachhead-driven) and how subspecialties expand from a spine.

## The three Steps → LumaChart's spine
The exam ladder maps cleanly onto how evidence should live in the record:
| USMLE | Tests | LumaChart analog |
|---|---|---|
| **Step 1** — mechanisms/basic science | *why* a therapy works | the **"why we recommend this"** rationale behind each cited CDS suggestion |
| **Step 2 CK** — clinical knowledge | diagnosis & management | the **CDS recommendation** at the point of care (cited) |
| **Step 3** — patient management | managing a real patient over time | the **workflow**: orders, the note, follow-up, the care plan |

So the evidence engine's tiers and the note inherit the exam's own logic: mechanism → recommendation → management.

## The map (standard categories)
**A · Foundational / general principles** (Step 1 emphasis): biochemistry · genetics · cell & molecular ·
immunology · microbiology · pathology · pharmacology · **public-health sciences** (epidemiology, biostatistics,
ethics). *Note: the public-health-sciences block is LumaChart's home turf — USPSTF prevention, the biostatistics
behind the RSI research loop, and the ethics behind AI governance.*

**B · Organ systems** (Step 1 & 2 CK): Cardiovascular · Respiratory · Gastrointestinal · Renal/Urinary ·
Reproductive · Endocrine · Hematology & Oncology · Musculoskeletal / Skin / Connective tissue ·
Nervous system & Special senses · **Psychiatry / Behavioral health**.

**C · Clinical disciplines** (Step 2 CK / Step 3): Internal Medicine · Family Medicine · Pediatrics · OB/GYN ·
Surgery · Emergency Medicine · Psychiatry — plus **health maintenance / prevention** and **ethics/communication**.

## Coverage matrix — organ system × what the CDS must cover
For each organ system, the evidence engine should carry, cited: **screening/prevention (USPSTF), diagnosis,
first-line management, red flags, and common meds.** Build the matrix as a checklist; a system is "covered" when
each cell has a current, openable, GRADE-rated citation.

## Content roadmap — beachhead first, then subspecialties
Prioritize by **disease burden in the safety-net Medicaid/Medicare beachhead** (where the SBIR pilot runs), not by
academic completeness:
1. **Cardiometabolic** (Cardiovascular + Endocrine): hypertension, type 2 diabetes, hyperlipidemia, heart failure — the highest-volume ambulatory load (already seeded in the app: Maria Alvarez "Diabetes & BP").
2. **Respiratory:** COPD, asthma (already seeded: Earl Bishop "COPD action plan").
3. **Behavioral health / Psychiatry:** depression, anxiety, SUD — validated PHQ-9 / GAD-7 / AUDIT-C already in the app; ties to the resilience + equity thesis.
4. **Renal:** CKD (progresses from #1–2); **Prevention/health maintenance:** USPSTF Grade A/B across the panel.
5. **Then expand** to Heme/Onc, GI, Neuro, MSK/Derm, Repro/OB-GYN, Peds, Surgery/EM — one system at a time, gated on evidence-currency + a specialist reviewer (the STTR/academic partners).

## How it plugs into what's already built
- The app already surfaces several of these (diabetes, HTN, COPD, postpartum, lipid review; USPSTF prevention; PHQ-9/GAD-7). This taxonomy **formalizes the scope** so coverage is deliberate and checkable.
- It sharpens the **evidence-engine "specialty breadth"** requirement in `EVIDENCE-ENGINE-AND-ACCESS-PLAN.md` — run identical queries across cardiology / infectious disease / oncology to test breadth.
- It de-risks the **SBIR** (rigor + coverage) and the sale (credible clinical depth), and it scopes the **subspecialty** expansion the user wants to frame.

## Guardrail
This is a coverage *framework*, not clinical content to copy. Actual CDS content is built from **primary,
current, GRADE-rated sources** (PubMed/USPSTF/guidelines) under the governance in
`EVIDENCE-ENGINE-AND-ACCESS-PLAN.md` — never lifted from any single review book.
