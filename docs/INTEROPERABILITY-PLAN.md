# LumaChart Interoperability Compliance Plan

**LumaChart — the hospital EHR built for public health (LUMAEHR.com)**
Prepared 2026-07-03 · Working repo: `public-health-ehr` (branch `new-feature`)
Companion to the in-app Roadmap view (`vRoadmap` in `app.js`; `ONC_CRITERIA`, `BUY_BUILD`, `GATES` in `data.js`)

> **Honesty note (read first).** LumaChart today is a dependency-free front-end prototype with synthetic data. It has **no FHIR server, no API, no terminology services, and no document exchange**. This plan therefore marks most USCDI data classes as *gap* or *planned via Medplum/Aidbox*. Every standard name and version number below was read from a fetched primary source on 2026-07-03 (see §6 Sources). Anything not verifiable from those sources is explicitly labeled **[unverified]**.

---

## 1. Executive summary

LumaChart's interoperability posture is **"FHIR-native by construction, certified by composition."** The strategy already encoded in the prototype's Roadmap view — build on a FHIR R4-native backend (Medplum or Aidbox) and buy certified modules for e-prescribing (DrFirst/MDToolbox), labs (Health Gorilla), claims (Candid Health/Claim.MD), and eligibility (Stedi/Availity) — aligns cleanly with the current regulatory floor: **USCDI v3 as updated by v3.1 (June 2025)** exchanged through **US Core STU 6.1.0** over **FHIR R4 (4.0.1)** with **SMART App Launch 2.0.0**, **Bulk Data Access 1.0.0**, and **OpenID Connect Core 1.0**, per §170.315(g)(10). ASTP/ONC's *Standards Version Advancement Process — Approved Standards for 2026* opens a voluntary uplift path (usable 60 days after posting, i.e., **August 29, 2026**) to **USCDI v6**, **US Core STU 9.0.0**, and **C-CDA 5.0.0**. LumaChart's differentiators map naturally onto the certified surface — the structured Assessment & Plan onto US Core CarePlan (the exact resource that carries the USCDI *Assessment and Plan of Treatment* class), the prevention portal onto Immunization/Procedure/Goal, and the consented research layer onto Bulk Data group export with Provenance. The honest gap: today none of that surface exists as an API — the plan below sequences it, consistent with the four gates and the buy/build map users already see in the app.

---

## 2. Standards baseline table

Regulatory baselines are drawn from the ONC §170.315(g)(10) and §170.315(h)(1) certification-criterion pages (healthit.gov, fetched 2026-07-03) and the *Approved Standards for 2026* SVAP document (isp.healthit.gov, fetched 2026-07-03). The SVAP document covers only the criteria listed in its table; it does **not** address SMART, Bulk Data, Direct edge protocols, or terminology releases — those rows cite the other sources.

| Standard | Required (regulatory baseline) | 2026 SVAP-approved version | LumaChart implementation route |
|---|---|---|---|
| USCDI | **v3**, as updated by **v3.1 (June 2025)** — v3.1 "updates Version 3 to be consistent with Executive Order 14168" (SVAP doc); the (g)(10) page cites USCDI v3 per §170.213(b) | **USCDI v6** (published July 24, 2025) | Medplum/Aidbox native store + LumaChart UI (build-on) |
| FHIR base | **HL7 FHIR Release 4.0.1** (§170.215(a)(1)) | — (not in SVAP 2026 doc) | Medplum/Aidbox native (build-on) |
| US Core IG | **STU 6.1.0** (§170.215(b)(1)(ii)); SVAP alternatives already available: 7.0.0 (with USCDI v4), 8.0.1 (with USCDI v5) | **STU 9.0.0 (June 2026)** | Medplum/Aidbox profile validation (build-on) |
| SMART App Launch | **Release 2.0.0** (§170.215(c)(2)) incl. mandatory "Patient Access for Standalone Apps" and "Clinician Access for EHR Launch" capability sets | — (not in SVAP 2026 doc) | Medplum/Aidbox auth layer (build-on) |
| Bulk Data Access (Flat FHIR) | **v1.0.0: STU 1** (§170.215(d)(1)) incl. mandatory `group-export` OperationDefinition | v2.0.0 (STU 2) already SVAP-approved per the (g)(10) page | Medplum/Aidbox native; also powers the research layer's cohort export (build-on) |
| OpenID Connect | **Core 1.0, incorporating errata set 1** (§170.215(e)(1)) | — | Medplum/Aidbox auth layer (build-on) |
| C-CDA (§170.315(b)(1), (b)(2), (b)(7)–(9), (e)(1), (g)(9)) | HL7 IG for CDA R2: **C-CDA Templates for Clinical Notes (US Realm), DSTU Aug 2015, June 2019 (with Errata)** + **C-CDA Companion Guide Release 4.1 (US Realm, June 2023)** | **HL7 C-CDA 5.0.0 – STU 5 (US Realm) (June 2026)** | **Gap** — build on backend document generation; no capability today |
| Direct (§170.315(h)(1)) | **ONC Applicability Statement for Secure Health Transport v1.2** (§170.202(a)(2)) + ONC IG for Delivery Notification in Direct (§170.202(e)(1)); "wrapped" RFC-5751 format required | v1.3 (May 2021) already SVAP-approved per the (h)(1) page | **Buy** — HISP partner (matches `ONC_CRITERIA` row "Exchange & integrate"). Note: (h)(1) can only be certified together with (b)(1) |
| CQM reporting (§170.315(c)(3)) | CMS QRDA Category I (Hospital) and Category III (Eligible Clinicians) IGs for 2020 | **2026 CMS QRDA I IG (updated May 2025)**; **2026 CMS QRDA III IG (updated Dec 2025)** | Build (per `ONC_CRITERIA` "plan-based quality" thesis) + reporting tooling |
| Da Vinci prior-auth APIs (§170.315(g)(31)–(33)) | CRD IG v2.0.1—STU 2 (Jan 8, 2024); DTR IG v2.0.1—STU 2 (Jan 11, 2024); PAS IG v2.0.1—STU 2 (Dec 1, 2023) | **CRD 2.2.1—STU 2.2; DTR 2.2.0—STU 2.2; PAS 2.2.1—STU 2.2** | Partner territory (Stedi/Availity/Candid). **Currently absent from `BUY_BUILD`/`ONC_CRITERIA` — applicability decision needed** (see §5) |
| Terminologies (per USCDI v3.1 applicable vocabulary standards) | SNOMED CT U.S. Edition, **March 2022 Release** · LOINC **2.72** · RxNorm Full Monthly Release, **July 5, 2022** · ICD-10-CM **2022** · CVX updates through **June 15, 2022** + Vaccine NDC Linker Table through **June 16, 2022** · UCUM **Rev 2.1** · CPT **2022** / HCPCS **July 2022** · CDT **2022** (dental) · ICD-10-PCS **2022** (optional) · FDA UDI System · CDC Race & Ethnicity Code Set **v1.2 (July 2021)** + OMB Directive 15 · RFC 5646 (language) · Project US@ **v1.0** (addresses) · Occupational Data for Health **20201030** · ITU-T E.123/E.164 (telecom) | — (newer releases apply under later USCDI versions; not enumerated in the SVAP 2026 doc) | Medplum/Aidbox terminology services + partner modules (labs/e-Rx carry their own coding) |
| e-Prescribing (NCPDP SCRIPT, §170.315(b)(3)) | **[unverified — not covered by any source fetched for this plan; version must be confirmed before Phase 2]** | — | **Buy**: DrFirst / MDToolbox certified module (per `BUY_BUILD`) |

---

## 3. USCDI data-class mapping (USCDI v3.1 — the required baseline)

All 19 data classes of USCDI v3.1 (June 2025), from the v3.1 document fetched 2026-07-03. US Core resource mappings follow the conventional USCDI-v3 → US Core 6.1.0 alignment; **profile-level mapping should be re-verified against the US Core 6.1.0 "USCDI" mapping page during Phase 0** [mapping column not independently fetched in this pass].

Status legend: **prototype-modeled** = surfaced in the demo UI with synthetic data (display only — nothing is a FHIR resource yet) · **partner-provided** = arrives via a `BUY_BUILD` module · **gap** = no surface and no named provider.

| # | USCDI v3.1 data class | LumaChart feature / screen | US Core (FHIR R4) resource | Status |
|---|---|---|---|---|
| 1 | Allergies and Intolerances | Chart header ("NKDA", `CHART.allergies`, `vChart`) | AllergyIntolerance | prototype-modeled (display only) → Medplum |
| 2 | **Assessment and Plan of Treatment** (incl. SDOH Assessment) | **The flagship**: structured A&P (`CARE_PLAN`, `vChart`) with what/why/when/who; SDOH assessment via pre-visit intake (`CHART.preVisit.sdoh`) | **CarePlan** (narrative A&P) + Observation/QuestionnaireResponse for SDOH assessment | prototype-modeled — LumaChart's strongest class; see Task caveat in §5 |
| 3 | Care Team Member(s) | Plan items' "who" field ("Referral team", "Dr. Chen", "Maria + nutrition") | CareTeam, Practitioner, PractitionerRole | partial prototype — free-text owners; no identifiers/roles/telecom → gap for most elements |
| 4 | Clinical Notes (5 note types) | Assessment note editor only (`#lean-note`); no Consultation/Discharge/H&P/Procedure/Progress note taxonomy | DocumentReference (+ DiagnosticReport) | **gap** — the "lean note" thesis still needs LOINC-typed note artifacts |
| 5 | Clinical Tests | Not modeled (no ECG, visual acuity, etc.) | DiagnosticReport / Observation | **gap** |
| 6 | Diagnostic Imaging | Not modeled | DiagnosticReport (imaging) | **gap** |
| 7 | Encounter Information | Day schedule (`SCHEDULE`, `vDashboard`): type, time, status | Encounter (+ Condition for encounter diagnosis, Location) | prototype-modeled (display only) → Medplum |
| 8 | Goals (incl. SDOH Goals) | Patient goals in pre-visit voice ("Stay off insulin. Dance at daughter's wedding"); `LONGEVITY` targets; prevention portal | Goal | prototype-modeled — unstructured; needs coded Goal resources |
| 9 | Health Insurance Information | Not surfaced in any view | Coverage | **partner-provided (planned)** — Stedi/Availity eligibility per `BUY_BUILD`; needs a UI surface |
| 10 | Health Status/Assessments (Health Concerns, Functional, Disability, Mental/Cognitive, Pregnancy, Smoking Status) | Pre-visit SDOH/lifestyle capture (sleep, activity); smoking status ("quit 2019"); pregnancy context (postpartum visit) | Observation screening/assessment profiles; Observation smoking status; Observation pregnancy status | partial prototype — functional/disability/mental-cognitive status are **gap** |
| 11 | **Immunizations** | **Prevention portal flagship**: flu vaccine due + walk-in scheduling (`PREVENTION_PLAN`, `SLOTS`, `vPlan`) | Immunization (CVX + Vaccine NDC per v3.1) | prototype-modeled — scheduling flow exists; no Immunization records/registry (IIS) link |
| 12 | Laboratory | Results inbox (CBC+CMP, lipid, TSH in `INBOX`); A1c/LDL trends in chart | Observation (lab) + DiagnosticReport (lab) + Specimen | prototype-modeled display; **ingestion is partner-provided** (Health Gorilla per `BUY_BUILD`) |
| 13 | Medications (Dose, Units, Indication, Fill Status) | Med list (`CHART.meds`); refill inbox items | MedicationRequest, Medication (+ MedicationDispense for fill status) | prototype-modeled display; orders/fill status **partner-provided** (DrFirst/MDToolbox) |
| 14 | Patient Demographics/Information (24 elements in v3.1) | Chart header: name, age, sex, MRN only | Patient (+ RelatedPerson; occupation via Observation) | prototype-modeled for ~4 of 24 elements; race, ethnicity, tribal affiliation, preferred language, addresses (Project US@), phone/email, related persons, occupation/industry are **gap** |
| 15 | Problems (incl. SDOH Problems, Date of Diagnosis/Resolution) | Problem list (`CHART.problems`) | Condition | prototype-modeled — free text; needs SNOMED CT/ICD-10-CM coding and onset/resolution dates |
| 16 | Procedures (incl. SDOH Interventions, Reason for Referral) | **Prevention portal**: colonoscopy referral (ordered, with reason "Screening due at 58"), mammogram (done) | Procedure + ServiceRequest | prototype-modeled partially — reason-for-referral is captured conceptually in plan items' "why"; SDOH interventions **gap** |
| 17 | Provenance (Author Time Stamp, Author Organization) | Nothing — no authorship metadata anywhere | Provenance | **gap — and disproportionately important**: the research layer's "full audit log of every query" guardrail (`RESEARCH.guardrails`) and de-identification pipeline both presuppose Provenance from day one |
| 18 | Unique Device Identifier(s) for Implantable Device(s) | Nothing (tracked as §170.315(a)(14) in `ONC_CRITERIA`) | Device (implantable) | **gap** → Medplum, per existing roadmap row |
| 19 | Vital Signs (13 elements) | "Vitals & trends" table (`CHART.vitals`): BP, weight | Observation (vital signs profiles) | prototype-modeled display. **Note:** A1c and LDL shown under "Vitals & trends" are USCDI *Laboratory* data, not Vital Signs — reclassify at data-model time (see §5) |

**Where the distinctive features land:**

- **Structured A&P → CarePlan.** USCDI's *Assessment and Plan of Treatment* class is exactly LumaChart's center of gravity, and it carries over US Core CarePlan. This is the rare place where the prototype is *ahead* of typical EHRs: the certified floor only requires the A&P as narrative; LumaChart's what/why/when/who decomposition is a superset. The **Task** half of the "CarePlan + Task" model is *not* part of the USCDI v3.1 data set — keep it as a companion resource, and don't describe it as part of the certified (g)(10) surface (§5, conflict C1).
- **Prevention portal → Immunizations + Procedures + Goals.** The scheduling flow (`SLOTS`, `.ics` export) is UI ahead of data: it needs Immunization and Procedure/ServiceRequest resources behind it, plus an IIS/registry connection for immunization reporting (a public-health function squarely in LumaChart's mission).
- **Research layer → Bulk Data + Provenance + de-identification.** Consented cohort export maps to Bulk Data `group-export` (v1.0.0 required; v2.0.0 SVAP-approved). Small-cell suppression and de-identification are **HIPAA Privacy Rule matters (Safe Harbor / Expert Determination), not ONC certification criteria** — they ride alongside this plan, not inside it [HIPAA methods not covered by the sources fetched here].
- **Canary → §170.315(b)(11) DSI**, as `ONC_CRITERIA` already records: source, evidence, and logic disclosed.

---

## 4. Gap analysis & sequencing

Ordered to be consistent with the four `GATES` and the `ONC_CRITERIA`/`BUY_BUILD` strategy the Roadmap view already shows users. Target: **§170.315(g)(10) certification first**, because it anchors the Base EHR Definition API requirement and everything LumaChart is (per `GATES[0]`, "in design").

**Phase 0 — Foundation (backend selection & data model).**
Decide Medplum vs. Aidbox (`BUY_BUILD` row 1). Re-model every `data.js` structure as US Core 6.1.0 resources against USCDI v3.1: `CHART` → Patient/Condition/MedicationRequest/AllergyIntolerance/Observation; `CARE_PLAN` → CarePlan (+ Task as companion); `PREVENTION_PLAN` → Immunization/Procedure/ServiceRequest/Goal; `SCHEDULE` → Encounter/Appointment. **Emit Provenance on every write from the first commit** — retrofitting authorship is the classic failure mode, and the research guardrails depend on it. Close the demographics gap (race/ethnicity per CDC v1.2 + OMB, language per RFC 5646, addresses per Project US@ 1.0). Exit: prototype UI reads from the FHIR server instead of `data.js`.

**Phase 1 — The certified API core (§170.315(g)(7), (g)(9), (g)(10)).**
Stand up SMART App Launch 2.0.0 (both mandatory capability sets), OpenID Connect Core 1.0 errata 1, Bulk Data 1.0.0 with `group-export` (adopt v2.0.0 via SVAP if timing allows), US Core 6.1.0 conformance for all USCDI v3.1 classes. Matches `ONC_CRITERIA` rows 1 and 5 ("build-on"). Exit: passes Inferno (g)(10) test kit.

**Phase 2 — Content exchange & partner modules.**
(b)(1) Transitions of care: C-CDA June 2019 errata + Companion Guide 4.1 generation/consumption (plan the C-CDA 5.0.0 uplift, approved June 2026). (h)(1) Direct via HISP partner — remember (h)(1) certifies only together with (b)(1). CPOE (a)(1)–(3) lean build per `ONC_CRITERIA` row 3. Wire `BUY_BUILD` partners: Health Gorilla (labs → Laboratory class), DrFirst/MDToolbox (e-Rx; **confirm current NCPDP SCRIPT version — unverified here**), Stedi/Availity (eligibility → Coverage class + a new UI surface for insurance information, currently gap #9).

**Phase 3 — Decision support & quality.**
(b)(11) DSI certification for Canary, the prevention engine, and the Luma assistant (repo notes "update required by Dec 31, 2027" — **[unverified]**, re-confirm against the current regulation). (c)(1) CQM record/export per the "plan-based quality" thesis; (c)(3) reporting on the 2026 QRDA I/III IGs. (b)(4) RTPB via the e-Rx partner (repo notes "required as of Jan 1, 2028" — **[unverified]**).

**Phase 4 — Research layer & SVAP uplift.**
Bulk Data group-export for consented cohorts (revocable consent via FHIR Consent resources; small-cell suppression in the export pipeline; IRB gate per `GATES[2]`). Voluntary SVAP uplift — usable from **August 29, 2026**: USCDI v6 + US Core STU 9.0.0 + C-CDA 5.0.0, which buys headroom before any future rule raises the floor (draft USCDI v7 was published January 2026). Decide (g)(31)–(33) prior-auth applicability with the claims partner (§5, item 8).

**Three most important gaps (severity order):**
1. **No FHIR data layer at all** — every USCDI class is display-only synthetic JS. Phase 0/1 is the whole ballgame; nothing else certifies without it.
2. **No document exchange** — C-CDA (b)(1) and Direct (h)(1) are entirely absent, and (h)(1) can't certify without (b)(1). The `BUY_BUILD` map names no HISP partner ("HIE / Direct partner" is a placeholder in `ONC_CRITERIA` only).
3. **Provenance + the invisible classes** — Provenance, Health Insurance Information, Clinical Notes taxonomy, Clinical Tests, Diagnostic Imaging, and most Patient Demographics elements have no surface anywhere in the prototype, and Provenance in particular is load-bearing for the research layer's audit guarantees.

---

## 5. 2026 Standards for Approval checklist

Derived from *Standards Version Advancement Process — Approved Standards for 2026* (ASTP/ONC, fetched 2026-07-03). SVAP adoption is **voluntary**; certifying on the regulatory baseline remains valid. "Plan satisfies" = the existing repo strategy (`ONC_CRITERIA`/`BUY_BUILD`) already accounts for it.

| # | 2026-approved standard | Criteria affected | Plan satisfies? | Action |
|---|---|---|---|---|
| 1 | USCDI v6 (regulatory baseline: USCDI v3.1, June 2025) | (b)(1), (b)(2), (b)(11), (e)(1), (f)(5), (g)(9), (g)(10) | ◐ Partially — repo targets FHIR R4/USCDI via Medplum but names no USCDI version anywhere | Certify on v3.1; schedule v6 uplift in Phase 4 |
| 2 | US Core STU 9.0.0, June 2026 (baseline: STU 6.1.0) | (g)(10) | ◐ Same as above | Pin 6.1.0 in Phase 1; verify Medplum/Aidbox 9.0.0 support before uplift |
| 3 | C-CDA 5.0.0 – STU 5, June 2026 (baseline: June 2019 errata + Companion Guide 4.1) | (b)(1), (b)(2), (b)(7)–(9), (e)(1), (g)(9) | ✗ Needs adding — no C-CDA capability or partner named | Phase 2 |
| 4 | 2026 CMS QRDA I IG (May 2025) | (c)(3) hospital reporting | ✗ Needs adding — `ONC_CRITERIA` covers (c)(1) only | Phase 3 |
| 5 | 2026 CMS QRDA III IG (Dec 2025) | (c)(3) clinician reporting | ✗ Needs adding | Phase 3 |
| 6–8 | Da Vinci CRD 2.2.1 / DTR 2.2.0 / PAS 2.2.1 (all STU 2.2) | (g)(31), (g)(32), (g)(33) provider prior-auth APIs | ✗ Absent from `BUY_BUILD` and `ONC_CRITERIA` | Applicability decision with claims/eligibility partners (Candid/Claim.MD, Stedi/Availity) — prior-auth is adjacent to their scope |
| 9 | SVAP effective date: voluntary use begins 60 days after posting (**August 29, 2026**) | all above | ✓ Compatible — phases sequence baseline-first, uplift-later | Track ONC's updated test data/tools |

**Conflicts and near-conflicts found in the current build:**

- **C1 — Task over the (g)(10) API (wording conflict).** `vChart` (app.js ~line 213) claims the plan "Exports as FHIR CarePlan + Task resources over the §170.315(g)(10) standardized API." CarePlan is correct — it is the US Core carrier for *Assessment and Plan of Treatment*. But Task is **not** a USCDI v3.1 data class/element, so it is not part of the certified (g)(10) surface. Not illegal — servers may expose extra resources — but the sentence overstates what certification covers. Suggested fix (not applied; this plan modifies no other file): "…exports as FHIR CarePlan resources over the §170.315(g)(10) API, with companion Task resources."
- **C2 — Laboratory data labeled as vitals (data-model conflict).** The "Vitals & trends" table mixes true Vital Signs (BP, weight) with USCDI *Laboratory* data (A1c, LDL). Harmless in a demo; must be classified correctly when re-modeled in Phase 0, or (g)(10) responses will misfile them.
- **C3 — SOGI watch item (policy, not a present conflict).** USCDI v3.1 **removed Sexual Orientation and Gender Identity** and changed the *Sex* element to require support for exactly two SNOMED CT values (248152002 Female, 248153007 Male), per Executive Order 14168. The prototype captures neither SOGI element, so nothing conflicts today — but a public-health-oriented research layer that later wants SOGI data must hold it **outside** the certified USCDI surface and should get IRB/counsel review first.
- **Unverified repo claims (flag, not conflict).** `ONC_CRITERIA` timing strings — "(a)(5) updated as of Jan 1, 2026", "(b)(11) update required by Dec 31, 2027", "(b)(4) required as of Jan 1, 2028", "(b)(1), (g)(9), (g)(10) updated as of Jan 1, 2026" — could not be confirmed or refuted from the sources fetched for this plan. Re-verify against the current certification regulation before publishing them beyond the demo.

---

## 6. Sources

All fetched **2026-07-03**. Retrieval notes are included for full transparency.

1. **USCDI overview page** — <https://isp.healthit.gov/united-states-core-data-interoperability-uscdi>
   Basis for: version history (v1–v6 published; **v6 published July 24, 2025** is the newest published version; **Draft v7, January 2026**, under development; v3.1 updates v3 per EO 14168); ONC enforcement-discretion note on certain v3 elements.
2. **ASTP/ONC, *Standards Version Advancement Process — Approved Standards for 2026*** — <https://isp.healthit.gov/sites/default/files/2026-07/2026%20Standards%20for%20Approval_508.pdf>
   The initial fetch returned raw PDF binary that the fetch summarizer could not parse; the saved 4-page PDF was then read directly page-by-page, so **all content was successfully extracted** — no section of this plan falls back to the web page alone. Basis for: regulatory-vs-2026-approved table (USCDI v3.1 → v6; US Core 6.1.0 → 9.0.0; C-CDA June-2019-errata + Companion Guide 4.1 → C-CDA 5.0.0 STU 5; QRDA 2020 → 2026 IGs; Da Vinci CRD/DTR/PAS 2.0.1 → 2.2.x) and the August 29, 2026 voluntary-use date.
3. **USCDI Version 3.1 (June 2025)** — <https://isp.healthit.gov/sites/default/files/USCDI-Version-3-1_2025_508.pdf>
   Read directly (20 pages) after the same binary-fetch workaround. Basis for: the complete 19-class / element inventory in §3, all terminology versions in §2's terminology row, and the v3→v3.1 change log (Sex element changed; Sexual Orientation and Gender Identity removed).
4. **ONC certification criterion page, §170.315(g)(10)** — <https://www.healthit.gov/test-method/standardized-api-patient-and-population-services>
   Basis for: FHIR 4.0.1, US Core STU 6.1.0, USCDI v3 per §170.213(b), SMART App Launch 2.0.0 (+ named capability sets), Bulk Data 1.0.0 (+ `group-export`), OpenID Connect Core 1.0 errata 1, and the already-approved SVAP alternatives (USCDI v4/v5 with US Core 7.0.0/8.0.1; Bulk Data 2.0.0).
5. **ONC certification criterion page, §170.315(h)(1)** — <https://www.healthit.gov/test-method/direct-project>
   Basis for: Applicability Statement for Secure Health Transport v1.2 (§170.202(a)(2)), SVAP v1.3 (May 2021), Delivery Notification IG (§170.202(e)(1)), wrapped RFC-5751 requirement, and the (h)(1)↔(b)(1) certification dependency.

**Not retrievable:** eCFR sections 45 CFR 170.213/170.215 (ecfr.gov returned a bot-protection redirect); the healthit.gov criterion pages above were used instead. **Not sourced (marked [unverified] in text):** NCPDP SCRIPT version for e-prescribing; the regulatory timing dates quoted in the repo's `ONC_CRITERIA`; HIPAA de-identification methodology details.
