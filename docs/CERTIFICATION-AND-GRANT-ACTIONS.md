# LumaChart — Human Action Checklist: Certification + the Non-Dilutive Grant

Two tracks need a **human** (federal registrations, legal signatures, an accountable official, real
money). Claude built the software, the plans, and the packet; a person completes the steps below.
The grant materials are drafted in `~/luma-chart/grant-materials/` (AHRQ one-pager, NLM one-pager,
Program Officer email, weekly action plan).

---

## The grant (the one we chose long ago): **NIH SBIR — non-dilutive, 0% equity**

**What it is.** The **Small Business Innovation Research (SBIR)** program — federal grant money for a
US small business to de-risk R&D. We chose this **instead of selling ~7% equity for ~$500k** to
investors/PE. You keep the whole company.
- **Phase I** (feasibility): ~**$314k**, ~6–12 months.
- **Phase II** (development): ~**$2.1M**, ~2 years.
- (Figures are SBA statutory guidelines, adjusted annually — confirm the current caps.)
- **Target order:** **AHRQ first** (clinician burden & burnout — our exact thesis), **NLM second**
  (PubMed/MEDLINE point-of-care CDS — NLM's own flagship). NIBIB/NIOSH are alternates.
- **STTR variant** if we partner with a research institution (**CU Anschutz** — you have a tie): allows
  the PI to sit at the partner and eases IRB. SBIR requires the PI's primary employment (>50%) in the
  small business; STTR does not.
- **Standard NIH SBIR/STTR due dates:** Jan 5 · Apr 5 · Sep 5.

### What's already done (by Claude)
- ✅ Two targeted one-pagers (AHRQ, NLM) — team block is the strongest lever, left as `[placeholders]`.
- ✅ Program Officer outreach email drafted (fill `[brackets]`, send).
- ✅ The Phase I aims are literally demonstrated in the prototype now: (Aim 1) standards-conformant
  PubMed-to-CDS surfacing + connected FHIR workflows in a sandbox; (Aim 2) burden measured via
  audit-log time + a validated instrument (the Burden lab).

### Next steps — a HUMAN must do these (in order)
1. **Confirm eligibility:** for-profit, US-based, >50% owned by US individuals, <500 employees.
2. **Start the slow federal registrations first — they gate everything (1–3 weeks):**
   - **SAM.gov** → get your **UEI** (Unique Entity ID). Start this first.
   - **eRA Commons** account (via the small business).
   - **Grants.gov** account.
   - **SBA Company Registry** → get your **SBC Control ID**.
3. **Fill the one-pager placeholders:** legal company name, city, contact, and the **team/PI block**.
4. **Find the Program Officer** for the AHRQ SBIR clinician-burden topic — or email the **NIH SEED
   office (seed.nih.gov)** to be routed. Address to "Dear [AHRQ] SBIR Program Team" if no name.
5. **★ Send the Program Officer email (AHRQ first) with the AHRQ one-pager attached.** *This is the one
   action that matters — the reply tells you whether the money is real for you.*
6. **(If STTR)** email **CU Anschutz** to gauge partner interest + IRB support.
7. **Draft the two Specific Aims** — make Aim 1 (PubMed→CDS relevance) rock-solid; pick the burnout
   measure (Mini-Z / MBI / Stanford PFI) + the EHR audit-log burden metric for Aim 2.
8. Identify the notice of funding opportunity (NOFO) and its exact forms; write the full application.

---

## ONC Health IT Certification (45 CFR Part 170) — the human path

The software is **built to** the standard (see the in-app Certification (Part 170) view + roadmap doc).
**Achieving** certification is a human/legal/financial process:

### Next steps — a HUMAN must do these
1. **Incorporate the legal entity** (LLC/PC) if not done; get an **EIN**; appoint an **authorized
   representative / responsible official** who signs attestations.
2. **Stand up a certifiable backend** — a FHIR-native platform (**Medplum / Aidbox**) so real data,
   auth, and the (g)(10) API exist to test against; buy **certified modules** for the specialized
   criteria (e-Rx via DrFirst/MDToolbox, etc.). Certification is achieved by **composition**.
3. **Engage an ONC-ACB** (ONC-Authorized Certification Body) — e.g., **Drummond Group**, **SLI
   Compliance**, or **ICSA Labs** — and an **ONC-ATL** testing lab. Budget for it: accredited testing
   **per criterion**, plus ongoing surveillance. This is a real expense line.
4. **Pass the ONC conformance test tools** — **Inferno** for §170.315(g)(10), C-CDA validators, the
   SVAP tooling, etc. (Our FHIR sandbox is the warm-up; Inferno is the gate.)
5. **Write the Real World Testing plan** (§170.405) and the Conditions-of-Certification attestations
   (§170.406): information blocking (§170.401), assurances/Insights (§170.402), communications
   (§170.403), API Conditions (§170.404).
6. **List on the CHPL** (Certified Health IT Product List) once certified — that's the public proof
   buyers verify, and what a hospital needs for Medicare Promoting Interoperability attestation.
7. **HIPAA + security:** complete the Security Risk Analysis, sign BAAs, and commission the
   **independent third-party security assessment** (also promised in the grant packet).

---

## What only a human can do (Claude cannot, by design)
- Identity-verified **federal registrations** (SAM.gov, eRA Commons) and signing anything.
- **Sending** the Program Officer email from your real account.
- Signing **legal contracts** (ONC-ACB engagement, BAAs, partner/STTR agreements, incorporation).
- **IRB submission** and being the named **PI / responsible official**.
- Committing **money** (testing fees, backend, security assessment).

## The one-sentence version
**Send the AHRQ Program Officer email this week** (grant), and **engage an ONC-ACB + stand up a
Medplum/Aidbox backend to run Inferno** (certification) — everything else on both tracks is drafted,
demonstrated, or documented and waiting on those human moves.

*Compiled 2026-09-09 from ~/luma-chart/grant-materials and the in-app Certification (Part 170) view.*
