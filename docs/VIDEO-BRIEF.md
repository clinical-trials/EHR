# LumaChart — Explainer / Launch Video Brief

*Source-of-truth brief for the concept video. Works three ways: (1) as the story guardrails
for the `/brag` skill (`latent-spaces/brag` → Hyperframes render), (2) as a shotlist for a
human screen-recorded walkthrough of the live app, (3) as a VO script for any narrated cut.*

**One record. Three people. The doctor comes first.**

---

## Logline (say this in one breath)
> LumaChart is the hospital EHR built for public health — a **physician-resilience & wellness**
> record where the *clinician's* well-being is the design constraint, a **real patient note** is
> the product, and **billing succeeds quietly in the background**. Everything on the screen is
> cited: a PMID, an ONC §170.315 criterion, or a named authority.

## The thesis (never drift from these — they are the whole point)
1. **Well-being first.** The system is measured by whether it gives the physician time and attention back, not by clicks captured. Burnout is the disease we treat.
2. **A real note, not a billing artifact.** The encounter produces a genuine clinical note; the claim is a byproduct, never the headline.
3. **Evidence on the record.** Every feature carries its citation — like citing PMIDs, we cite features to §170.315 criteria.
4. **Public-health scale, taken seriously.** A 50-state + Puerto Rico platform that honors statutory deadlines and compliance per jurisdiction.
5. **Governed AI.** AI assists (scribe, coding, early-warning) under §170.315(b)(11), an FDA/PCCP posture, and a NAM-style code of conduct — with a registry and a kill switch.
6. **A learning health system.** Consented, de-identified, IRB-gated research flows back into the evidence at the point of care.

## Tone
- Default `--tone`: **"calm, credible, clinical — a public-health mission, not a hype reel; warm confidence, evidence over adjectives"**
- Avoid: growth-hacky SaaS energy, fake urgency, "revolutionary," leaderboard vanity metrics.

---

## Narrative arc (~75–90s, 6 beats)

**0. Cold open — the problem (0:00–0:10)**
The physician as data-entry clerk: after-hours "pajama time," inbox avalanche, burnout.
On-screen: *"Physicians didn't train to be typists."*

**1. The turn — reframe (0:10–0:20)**
What if the EHR's job were to protect the clinician's attention?
On-screen: *"An EHR measured in minutes returned to the patient."*

**2. The provider experience (0:20–0:45)** — the heart of the film
Walk the live **Clinician** role:
- **Today / Focus (Luma Lean)** — run on time; one patient, one action; Restore low-glare theme.
- **Luma Scribe** — ambient draft note + suggested questions; the doctor looks at the patient, not the screen.
- **Chart + evidence CDS** — USPSTF prevention and **PubMed at the point of care**; a PMID chip you can click.
- **Batched inbox + delegation** — twice a day, team-routed; not an all-day interrupt.
- **Encounter & claim** — agentic coding + denial prevention runs *in the background* (show it small, on purpose).
- **Canary** — a private, personal burnout early-warning companion (never surveillance).

**3. Around the doctor — the other two people (0:45–1:00)**
- **Patient** role: pre-visit check-in, Healthspan portal, *My record* (HIPAA right of access), Keep-your-coverage / Medicaid renewal.
- **Researcher** role: consented de-identified registry → IRB-gated console → population insight → back into the evidence.

**4. Leadership & the seriousness (1:00–1:15)**
- **CWO / CMO / Admin** role: AI governance registry (scale / pause / kill), the Burden lab (measured, not guessed), Joy-in-Medicine + equity, and **Deadlines & compliance** across 50 states + Puerto Rico.
- Flash the **Systems & Operational Flow** diagram (`docs/diagrams/systems-operational-flow.svg`) as the "how it all connects" money shot.

**5. Close — the standard (1:15–1:30)**
Every claim on screen was cited. Synthetic data, real standards (FHIR R4 / US Core / SMART on FHIR).
On-screen: *"LumaChart — the hospital EHR built for public health."*  ·  lumaehr.com

---

## Shotlist → live app (for a screen-recorded cut)
Serve locally and record the real UI (`python3 -m http.server 8199` → `dist/LumaChart.html`):
| Beat | Role tab | View / nav id | What to show |
|---|---|---|---|
| 2 | Clinician | Today / `focus` | Focus mode on, Restore theme |
| 2 | Clinician | Scribe | ambient draft note appearing |
| 2 | Clinician | Chart / evidence CDS | click a PMID chip → PubMed |
| 2 | Clinician | Inbox | batched, delegated |
| 2 | Clinician | Encounter & claim | coding/denial-prevention, kept small |
| 2 | Clinician | Canary pill (top bar) | private early-warning |
| 3 | Patient | portal / My record | check-in, right of access, coverage |
| 3 | Researcher | console | consent → IRB → cohort |
| 4 | CWO | `aigov`, Burden, `report`, End-of-life compliance, Bibliography | governance + 50-state compliance + citations |
| 4 | — | the SVG systems diagram | full-system money shot |

## On-screen text / lower-thirds (reusable)
- "Well-being first · a real patient note · billing quietly in the background"
- "PubMed at the point of care"
- "50 states + Puerto Rico · compliance taken seriously"
- "Governed AI · §170.315(b)(11) · FDA/PCCP · a kill switch"
- "Every claim cited — PMID, §170.315, or authority"

## Music / pacing
Understated, hopeful, unhurried (matches the calm/credible tone). Cuts land on the on-screen
text, not on beat drops. No stock-corporate swell.

---

## How to generate with `/brag`
Prereqs on this machine are satisfied (Node 26, ffmpeg 8.1, npx 11). In an **interactive** Claude Code terminal, from the repo root:

```bash
/plugin marketplace add latent-spaces/brag
/plugin install brag@brag
```
Then:
```bash
/brag --voice --tone "calm, credible, clinical — a public-health mission, not a hype reel; evidence over adjectives"
```
Output lands in `brag-output/` (narrative plan, share copy, `brag.mp4`). `/brag` owns the
story and hands a brief to Hyperframes, which builds/times/renders; `--voice` adds Kokoro TTS.
Verify the renderer first with `npx hyperframes doctor`.
