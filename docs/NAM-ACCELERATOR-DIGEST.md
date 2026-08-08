# NAM Inaugural Accelerator Action Plans — poster digest (read 2026-08-03)

Source: *Embedding Well-Being as a Lasting Value: Inaugural Accelerator Action Plans* (NAM, published April 2026) —
https://nam.edu/product/embedding-well-being-as-a-lasting-value-inaugural-accelerator-action-plans/
20 poster slides read in full (2023–2025 cohort tracking National Plan implementation).

## What each institution showcased (one line each)

| Org | Core move |
|---|---|
| ACGME | Accreditors harmonizing minimum well-being standards: confidential reporting w/o retaliation, mental-health crisis education, scheduling that permits learners' own healthcare. "Systems standpoint rather than individual-level actions." |
| AACOM | National surveys: burnout rises 29% (entering) → 64% (graduating); faculty-mindset course (RMiM) across 21 COMs / 23,000 students |
| AACP | Mid-Career Recharge program (PERMAH pre/post), 100+ faculty |
| ACP | Well-being Champions; online curriculum to 162,000 members |
| ASHP | 4,500 Well-Being Ambassadors (HRSA grant); pharmacy suicide-awareness day; cognitive-load research in med management |
| Cedars-Sinai | Five domains incl. **Efficiency**; next: supporting physicians navigating litigation; protected time for wellness ambassadors |
| CommonSpirit | System-wide peer ambassador program; well-being framework; hire well-being leadership (PA6) |
| Kedren (FQHC/APH, safety net) | Workforce upskilling + burnout tools + PDSA cycles; **well-being dashboard (VisionSync)**; equity barriers addressed (childcare, transport, costs) |
| MD Anderson | All 7 priority areas; first CWO; **Ease of Practice Committee**; reduced stigmatizing credentialing language; secure chat + ambient AI pilot |
| Michigan Medicine | **Ambient listening study (n=196): significant ↓ after-hours charting, ↓ cognitive load, ↑ work-life balance; small but significant ↓ burnout**; Epic Signal/audit-log analytics; "10000% yes. Time saver." |
| OhioHealth | 37-FTE well-being division; same-day/on-call mental-health; **well-being costs built into operating budgets**; crisis interventions falling (4.7%→1.8%) as prevention scales |
| Ochsner | **Mini-Z systemwide; ambient saves ~170 min/week; inbox burden cut to 50th percentile; "pajama time" among best in country for Epic users**; AI-assisted inbox + chart summarization; cabana pods |
| OSU Wexner | Respite room on every unit; credentialing-form refinement; pilot grants; Ambient AI + PWAC survey; well-being in the strategic plan |
| Peter Munk (UHN, Canada) | Nursing coaching/mentorship; unit safety-huddle redesign w/ real-time digital metrics |
| SCPMG | Stigma-reduction campaign; PsychPPE benefits escalation; physician-experience assessment |
| UC San Diego | Wellness directors funded in **all 19 clinical departments**; listening campaigns; honest outcomes (individual burnout +6 pts, turnover intent −2) — "people problems result from process problems upstream" |
| U Kansas | Well-being conference, lactation support, SPARHC suicide prevention, professional-fulfillment assessment |
| U Nebraska | "Wellness Welcome": psychiatrist personally meets every new physician in year 1 (~80/yr) |
| U New Mexico | PWAC survey since 2018; leadership assessments for 26 chairs + 15 PDs; **40% clinical-faculty burnout — primary driver: efficiency of practice**; CE-CERT next |
| U Utah | **Every leader gets an interactive dashboard of well-being + engagement data**; Code Lavender (48 activations); Stress First Aid (1,097 trained); Abridge ambient widely available; dept-level dataset linking engagement/burnout/psych-safety/turnover/patient experience |

## Cross-cutting patterns → LumaChart mapping

1. **Ambient documentation is the single most-cited technology win** (Michigan, Ochsner, MD Anderson, OSU, Utah, OhioHealth) — with real measured outcomes (~170 min/week; ↓ after-hours time). Validates Luma Scribe + the Burden lab's measure-first stance. Michigan's Epic-Signal audit-log skills = exactly our audit-log methodology.
2. **Leader-level well-being dashboards** (Utah, UNM, Kedren, UCSD) — data to every chair, not just the CWO. → Candidate: per-department drill-down in the CWO extract (aggregate-only).
3. **Ease-of-Practice / efficiency committees** (MD Anderson, Cedars, Ochsner, UNM's #1 burnout driver) — institutional twin of our GROSS "kill a stupid task" flow.
4. **Crisis & peer infrastructure** (Code Lavender, Stress First Aid, same-day mental health, WE Care) — beyond our Battle Buddy card. → Candidate: crisis-response protocol note in Wellness Center.
5. **Onboarding as well-being** (Nebraska's Wellness Welcome, SCPMG onboarding, Peter Munk mentorship) — → Candidate: "new-clinician welcome" flow.
6. **Credentialing/stigma language reduction** (MD Anderson, OSU) — already shipped (licensure-rights card).
7. **Honesty about outcomes** (UCSD's burnout went *up* 6 pts despite investment) — the field's own data says: measure, publish, iterate. This is the Burden lab's reason to exist.
8. **Budget permanence** (OhioHealth: well-being costs inside operating budgets; UCSD: funded directors in every department) — well-being as a budget line, not a grant.

## Vendor scan (same session): Osmind · Akute · Medplum · DrChrono

Ideas worth absorbing — filtered by the design laws (one way, minimal, nothing redundant):

- **Osmind** (psychiatry EHR): measurement-based care as the chart's spine — every visit anchored to instrument scores over time; patient-reported outcomes between visits; research-grade registry consented from clinical data. → LumaChart already has the instrument engine; the absorbable idea is **score-over-time trendlines in the chart** and treatment-response tracking. Specialty-pack model confirmation (psychiatry pack).
- **Akute Health** (direct-primary-care EHR): radical minimalism for 1–3 clinician shops — flat pricing, fast task flows, integrated e-fax/e-Rx, no per-interface fees. → Confirms "Own your practice" positioning; absorbable idea: **time-to-task as a marketed metric**.
- **Medplum** (open-source FHIR-native platform): headless architecture — every feature is an API resource first, UI second; open-source trust as a sales channel. → Already our roadmap backend candidate (ONC roadmap doc); absorbable idea: **API-first feature definitions** so nothing exists only as UI.
- **DrChrono** (the only YC general US EHR, exited ~$180M): iPad-first check-in and mobile charting; app marketplace; billing bundled. → Our iPad check-in + Helix Hub already mirror this; absorbable lesson: mobile-first charting is table stakes, and marketplace = distribution.

- **Osmind Agent detail**: their AI agent *submits prior auths and reports approvals* ("Prior auth submitted to Aetna for Spravato — approval received"), and the network claims 3.6M+ outcomes measured — measurement-based care at commercial scale. → Confirms our FHIR prior-auth flow should evolve into an agent that completes the loop, not just starts it.
- **Scheduling Wizard** (schedulingwiz.com): a *managed service*, not software — departments submit constraints, experts + solver return fair, ACGME-compliant schedules as plain Excel (uploads to Amion/QGenda). Sells to departments; no IT procurement. → Two absorbable ideas: (1) fairness-optimized clinic/call scheduling as a LumaChart service tier (pairs with our run-on-time coach; fairness is a well-being lever); (2) the **department-level go-to-market with zero-IT-friction deliverables** — our single-file demo bundle is already this shape.
- **Lunabill** (lunabill.com, YC): AI agents that work the entire AR queue — check payer portals, call payers, write appeals — "your team reviews **outcomes, not status updates**." → The back-office twin of one-route-per-task: our claim workflow should surface only decisions, never statuses. Candidate: denial-chasing agent stage in Encounter & claim (post-clearinghouse), reported as outcomes.
- **Hubble** (hubble.ai — patient-mediated access): the patient is the *account holder* — verifies identity to NIST IAL2, exercises their own HIPAA individual right of access, receives their assembled record from every system they've touched, and decides where it goes next. → The strongest architecture for our **unified care timeline**: build it on the patient's own right of access rather than provider-side HIE alone. Pairs with the info-blocking design rules and the consent-tier model. Candidate: "My record, my request" flow in the patient portal (timeline data already staged).
- **Klarify** (klarify.ca — AI assistant for therapists): privacy-first positioning as the *product*, not the fine print — "your notes are protected, always," works alongside any EHR/telehealth. → Confirms Scribe's consent-first, notes-stay-yours framing; absorbable idea: publish a plain-language **privacy guide per AI feature** (what's captured, what persists, who can see it) the way Klarify publishes privacy guides — candidate for the Trust section.

*Every claim above from vendor marketing sites (read 2026-08-03) or the NAM posters; no figures beyond what sources state.*
