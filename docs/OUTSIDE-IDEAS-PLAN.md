# Implementation Plan — Outside Ideas → LumaChart Features

Source material: the 2026-08-03 outside-ideas sweep (docs/NAM-ACCELERATOR-DIGEST.md) — 20 NAM
accelerator posters + 9 sites: Osmind, Akute Health, Medplum, DrChrono, Scheduling Wizard,
Lunabill, Hubble, Klarify, Fortuna Health.

**Governing rules for every item:** the three design laws (one canonical route per task; as
minimal as possible; redundancy dies on sight) · plain language on the patient tab (codes in
light gray) · every claim cited (PMID or authority chip) · AI features labeled *demo simulation*
with per-encounter physician control · Focus stays clinician-only and untouched.

Already shipped from the sweep: ✅ **Keep your coverage** (Fortuna → patient Billing & payments, f089195).

---

## Wave 1 — small builds, high value (next working session)

| # | Feature | From | What it is | Pillar |
|---|---|---|---|---|
| 1 | **Score trendlines in the chart** | Osmind | PHQ-9/GAD-7/instrument results graphed over time in the clinician chart + patient "My results" — measurement-based care as the chart's spine, not a buried table. Uses existing `state.screens` data; one sparkline component. | Better care / evidence |
| 2 | **Agent-completed prior auth** | Osmind Agent, Lunabill | The FHIR sandbox prior-auth flow gains the completion loop: submitted → tracked → **outcome reported** ("Approved, auth #, valid 60 days"), simulated + labeled. The rule: surface *outcomes, not status updates*. | Revenue cycle |
| 3 | **Privacy guide per AI feature** | Klarify | One plain-language card in Trust/Security: for Scribe, Canary, coding agent, assistant — what's captured, what persists, who can see it, how to turn it off. Three sentences each, no legalese. | Burnout (trust) |
| 4 | **QR onboarding at check-in** | Fortuna | The iPad check-in offers a QR code that opens the patient portal (and the coverage-renewal helper) on the patient's own phone — distribution without an app store. | Fragmentation |

## Wave 2 — the two capstones

| # | Feature | From | What it is | Pillar |
|---|---|---|---|---|
| 5 | **"My record, my request"** — patient-mediated timeline | Hubble | The unified care timeline (data already staged in `TIMELINE`) built on the patient's own HIPAA right of access: simulated IAL2 identity step → patient authorizes → record assembles from every system touched → **patient decides where it goes**. Completes the fragmentation pillar; pairs with consent tiers + info-blocking design rules. | Fragmentation |
| 6 | **Denial-outcomes agent (AR stage)** | Lunabill | Encounter & claim gains a post-clearinghouse stage: the agent watches unpaid claims, checks payer status, drafts appeals — and the biller reviews a short list of **outcomes and decisions**, never a status queue. Simulated + labeled; measured in the Burden lab (minutes returned per claim). | Revenue cycle |

## Wave 3 — measurement & operations

| # | Feature | From | What it is | Pillar |
|---|---|---|---|---|
| 7 | **Time-to-task metrics in the Burden lab** | Akute, Ratwani 29982549 | Instrument the demo itself: clicks + seconds for 5 canonical tasks (sign note, renew rx, release result, book follow-up, delegate) as a measured table — the SUS/usability case made concrete. | Burnout |
| 8 | **Fairness-aware scheduling** | Scheduling Wizard | A fairness strip in the run-on-time coach (late-clinic / call distribution across clinicians) + a managed-service tier note in Plans & value. Fair schedules are a well-being lever. | Burnout |
| 9 | **CWO accelerator candidates** | NAM posters | Crisis-response protocol note (Code Lavender / Stress First Aid), "Wellness Welcome" new-clinician onboarding (Nebraska), per-department drill-down in the CWO extract (Utah). All CWO-side; zero clinician clutter. | Burnout |

## Production-phase architecture (no prototype build)

| # | Decision | From | Note |
|---|---|---|---|
| 10 | **API-first feature definitions** | Medplum | Every feature documented as FHIR resources before UI (inbox→Communication, delegation→Task, coverage→Coverage, timeline→everything). Medplum remains the named backend candidate (ONC roadmap doc). |
| 11 | **Department-level go-to-market** | Scheduling Wizard | Sell to departments/practices with zero-IT deliverables — the single-file `dist/LumaChart.html` demo is already the artifact; keep it sacred. |
| 12 | **Mobile charting parity** | DrChrono | Before pilot: responsive audit of chart + Scribe on phone viewports (CSS exists; needs a verification pass). |

## Wave 4 — validated early warning + alert stewardship (Bayesian Health, added 2026-08-03)

What Bayesian Health proves: clinical AI can be **prospectively validated** (TREWS sepsis early
warning — 5-site study, *Nature Medicine* 2022, PMID 35864252; TREWScore, *Sci Transl Med* 2015,
PMID 26246167), **FDA-cleared** (continuous AI sepsis monitoring), and **adopted** (89% in-study;
adoption mediated the mortality benefit). Their design credo matches ours: "monitors every
patient continuously, surfaces only those who need attention."

| # | Borrow | Improve (the LumaChart angle) |
|---|---|---|
| 13 | Continuous deterioration/sepsis early warning in the record | **The alert IS the action** (one-route law): a single evaluate-now item with the order set attached — never a pop-up chain. |
| 14 | Evidence-first: publish prospective outcomes | Every alert carries its **citation chip + patient-specific contributing factors** in the alert body (§170.315(b)(11) source & logic). |
| 15 | Adoption as the headline metric | **Alert stewardship, measured**: alerts/clinician/day, override rate, median time-to-evaluation — tracked in the Burden lab and on the CWO side, because alert fatigue is a safety *and* burnout metric. |
| 16 | FDA clearance path (SaMD) | Named on the roadmap as the regulatory bar for any production early-warning model — demo stays labeled synthetic/simulated. |

Build: extend the existing Readmission-risk view into **Risk & early warning** (one route — no new
nav item): a TREWS-style deterioration alert card (synthetic, labeled) with contributing factors +
one evaluate action, and an alert-stewardship strip. Cites: 35864252, 26246167, Bayesian (industry
precedent link), SG Advisory (interruption reduction).

## Wave 5 — CWO operationalization (NAM Change Maker in Action, added 2026-08-29)

Source: NAM *Change Maker in Action Series — How Well-Being Leaders Get the Work Done* (Aug 2026, 4-pp
infographic) + Shanafelt & Noseworthy's Nine Organizational Strategies (PMID 27871627). The through-line:
well-being succeeds when it's **operationalized** — integrated into existing priorities, measured next to
quality metrics, tailored by role, and owned by a distributed network ("Wellness starts with we"). LumaChart's
CWO surface should make that operational, not aspirational. All CWO-side; zero clinician clutter.

| # | Idea from the field | LumaChart feature |
|---|---|---|
| 17 | **Report well-being *alongside* quality metrics** — MD Anderson connects well-being to patient access & workflow; NYC H+H reports burnout/anxiety next to system quality. | A CWO "Well-being × Operations" panel that pairs EHR8/WOW8/burnout with quality/access/turnover on one screen — the business case, built in. Extends the existing feeling-valued + equity cards. |
| 18 | **Adoption is the proof** — track awareness of programming, utilization, and workforce outcomes to build momentum. | An "Adoption & utilization" strip (awareness %, utilization %, outcome trend) — mirrors the Bayesian alert-stewardship "adoption is the metric that mattered" theme; reuses the Burden-lab measure-first stance. |
| 19 | **Tailor by role, hold a shared vision** — shadow frontline; one-size-fits-all fails. | Already partly built (equity + per-department drill-down). Add a role-tailored "what this role needs" note per department segment. |
| 20 | **"We-suite" / distributed ownership** — champion networks (SCPMG: 100+ leaders; NYC H+H: 1→45 staff). | A lightweight "Well-being champions" roster on the CWO Action plan — who owns what, across departments. |
| 21 | **Nine Organizational Strategies as the playbook** | Map the CWO Action-plan items to Shanafelt's nine strategies (PMID 27871627) so the plan is evidence-anchored, and link the AMA CWO Road Map toolkit. |

Pick a few (17 + 18 are the highest-leverage and reuse existing components). Cite: namCWO, shanafelt9,
plus the existing namAccel/sgAdvisory/natPlan. Quotable for the deck: "The influence you have may be more
valuable than the budget line" (Ripp); "Wellness starts with we" (Segall).

## Sequence & effort guess

Wave 1 ≈ one working session (all four are small, verified patterns exist).
Wave 2 ≈ one session each — the timeline (#5) is the flagship demo-able feature and should come first.
Wave 3 as capacity allows; #7 doubles as SBIR Phase-I evidence generation.

*Plan written 2026-08-03. Nothing here builds until the founder says go; every item lands with its citation.*
