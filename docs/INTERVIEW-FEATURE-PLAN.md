# LumaChart — Feature Plan from the Physician Interview

**Mission:** address the systemic failures of early digitization — **clinician burnout**, **revenue-cycle administrative complexity**, and **fragmentation of the patient experience**.

Source: a physician / prospective customer interview (July 2026), plus the reality that incumbents (Epic "Ambience", ambient AI charting) are moving fast on ambient documentation. This plan turns those notes into concrete LumaChart features, prioritized. Honest note: the ambient/AI pieces below are **demo simulations** in the prototype; a production version needs real speech + LLM services and ONC §170.315(b)(11) decision-support transparency.

---

## Pillar 1 — Clinician burnout ("no homework, no after-hours work")

| # | Feature | What it does | Priority |
|---|---|---|---|
| 1 | **Ambient documentation** ("Luma Ambient") | Listens to the encounter, drafts the note, **suggests questions**, and pre-drafts **ICD-10 + CPT** codes for sign-off. Charting happens *between* patients, not at day's end — no homework. | **P0** |
| 2 | **Focus / Lean mode** *(name TBD — see decision)* | A minimal, distraction-free display — like Do-Not-Disturb on a phone or a car's minimal dashboard. One clear route per task; hides non-essential chrome for maximum concentration. | **P0** |
| 3 | **Batched inbox** | Messages are triaged by staff and **earmarked** for the provider, then delivered in **two batches (AM + PM)** instead of pinging 8×/day — with an emergency-work disclaimer. Protects focus. | **P0** |
| 4 | **Point-of-care charting nudge** | Gentle prompt to close the note between patients ("chart now, don't forget") — builds the healthy habit the interview described. | P1 |
| 5 | **On-time / visit-scope coach** | Running-late awareness; suggests keeping visits focused, deferring non-urgent items to a follow-up ("save appointments for another day; don't tackle everything at once") so later patients aren't delayed. | P1 |
| 6 | **Suggested delegation steps** | Beyond "delegate" — concrete, named steps for what the team can take (interview: "VERY HELPFUL"). | P1 |
| 7 | **Wellness check-in log** | A private, safe-space after-hours feedback log inside the EHR. | P1 |
| 8 | **Box breathing** *(shipped)* + reframe | Keep the 1-minute box-breathing tool; add the interview's insight — *a slow-breathing lung exam with the patient is a meditation within clinic*. | done + copy |
| 9 | **CME tracking** *(shipped)* | Keep credit tracking + suggested topics; note Texas-style state tracking. | done |

## Pillar 2 — Revenue-cycle complexity

| # | Feature | What it does | Priority |
|---|---|---|---|
| 10 | **Ambient auto-coding → claim** | The ambient scribe's drafted **diagnosis + billing codes** flow straight into the existing Encounter & Claim workflow for one-tap verification. Ties Pillar 1 to the revenue cycle. | **P0** |
| 11 | Existing coding + PR bridge *(shipped)* | Full ICD-10 capture, agent CPT, ICD-9 crosswalk, clearinghouse. | done |

## Pillar 3 — Fragmentation of the patient experience

| # | Feature | What it does | Priority |
|---|---|---|---|
| 12 | **Unified care timeline** | One record that follows the patient — every visit, lab, ED trip, hospital stay, specialist and pharmacy event from **every setting**, reconciled into a single story via C-CDA/FHIR. The direct antidote to fragmentation. | **P0** |
| 13 | **Chart Scrub** | One click sweeps the chart and pulls records to surface **every applicable evidence-based screening** (USPSTF) and best-practice gap — proactive disease prevention. | **P0** |
| 14 | **Patient ↔ provider messaging (batched)** | Patient-facing secure messaging that routes through staff triage and batches to the provider — engaged patients, protected physicians. | P1 |
| 15 | **Patient engagement** *(largely shipped)* | Outward-facing portal: prevention, healthspan, payments, community health. Keep deepening. | ongoing |

## Cross-cutting — reduce redundancy

The interview's sharpest UX point: *"too many ways to do the same thing — a result becomes a message, an email, a result note, a staff task… many routes."* **Design rule:** one canonical route per action. The Focus/Lean mode and batched inbox both serve this.

---

## Build order (proposed)

1. **P0 wave:** Focus/Lean mode · Ambient documentation (note + questions + codes → claim) · Batched inbox · Unified care timeline · Chart Scrub.
2. **P1 wave:** point-of-care nudge · on-time/visit-scope coach · suggested delegation steps · wellness check-in log · patient messaging.

## Open decision

The **Focus / Lean mode** needs a catchy, on-brand name (the current tab is unnamed). Candidates under consideration: **Lumen**, **Focus**, **Beam**, **Luma Zen**. (Pending user choice.)
