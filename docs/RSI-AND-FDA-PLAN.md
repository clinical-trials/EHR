# LumaChart — Recursive Self-Improvement (RSI) for Discovery + the FDA / National-Standards Pathway

**North star (unchanged, and it governs everything below):** every capability exists to **reduce
clinician burnout** and produce a **real patient note**, with **billing that succeeds quietly in the
background — never at the forefront**. Clinician and patient well-being are the top priority. RSI and
FDA clearance are means to that end, not ends in themselves.

---

## Part 1 — The regulatory architecture (national standards, kept honestly separate)

A serious platform meets the law precisely and does **not** blur the tracks. Three, in the app now
(Security → "Regulatory architecture"):

1. **ONC Health IT Certification — 45 CFR Part 170 / §170.315** (the *record*). Interoperability, the
   standardized FHIR API, USCDI, security. Certified by an **ONC-ACB** after passing the **ONC
   conformance test tools** (Inferno for the §170.315(g)(10) API). This is what CEHRT and Medicare
   Promoting Interoperability require. **Not the FDA.** [cfr170, oncTestTools]
2. **Non-Device CDS safe harbor** (the *evidence layer*). Because LumaChart shows the **basis** of every
   recommendation — the PMID, the logic — so a clinician can **independently review** it, the evidence
   cards are **Non-Device CDS**, outside FDA device regulation by design (Cures Act §3060; FDA CDS
   guidance 2022). Our §170.315(b)(11) transparency is what keeps us in this safe harbor. [fdaCDS]
3. **FDA 510(k)/De Novo + PCCP** (the *predictive module*). A model that flags a patient **before
   clinical suspicion** (deterioration/sepsis) **is a device**. It goes through FDA clearance with
   **Good Machine Learning Practice**, and its adaptive learning is bounded by a **Predetermined Change
   Control Plan (PCCP)** — the exact path **Bayesian Health just proved** with the **first-ever 510(k)
   for continuous AI sepsis monitoring (May 12, 2026: 82% sensitivity, 5.7-hr lead time, 89% adoption,
   18% lower in-hospital mortality when clinicians act in time; 764,707 encounters, 5 hospitals).**
   [fdaSaMD, fdaPCCP, bayesian]

**Why this matters for RSI:** the PCCP is the legal mechanism that lets a *learning* clinical model
improve after deployment **within a pre-validated envelope**. That is the only FDA-sanctioned form of
"self-improvement" that may touch care — and it is bounded, not open-ended.

---

## Part 2 — RSI, done safely: two loops

Unbounded self-modifying clinical software is neither safe nor legal. So LumaChart splits RSI into an
**inner loop** (fast, safe — improves *discovery*, never touches a patient) and an **outer loop**
(slow, gated — a validated finding reaches care only through human review, IRB, prospective validation,
and a PCCP-scoped change). RSI lives in the **research console**, which is already IRB-gated and runs on
**consented, de-identified** data — not in the deployed clinical decision support.

### The six-step loop, mapped to LumaChart (with the now-live MCP tools as substrate)

| Step | What it does | LumaChart substrate |
|---|---|---|
| 1. **Generate hypotheses** from literature, datasets, prior results | Mine overlooked patterns; produce many candidate mechanisms fast | **PubMed** MCP (search/related/metadata) + **Consensus** + **bioRxiv/medRxiv** + **ClinicalTrials.gov** + **Open Targets / ChEMBL** for mechanism, over the de-identified registry (research console) |
| 2. **Rank** by novelty, plausibility, testability, expected value | Prioritize systematically instead of by hunch | Scoring rubric: *novelty* = low literature overlap (related-article counts); *plausibility* = mechanistic support (Open Targets); *testability* = data actually present in the registry; *expected value* = population size × plausible effect × **actionability toward burnout / patient outcomes** |
| 3. **Design experiments / simulations** | Turn a hypothesis into a study | Pragmatic embedded studies — the "record speaks *plan* natively" thesis — or **retrospective target-trial emulation** on the registry; the `clinical-trial-protocol` skill drafts the protocol |
| 4. **Run analyses / propose protocols** | Execute or hand to a human | Retrospective analysis on de-identified data; protocol → **IRB**; nothing runs on patients without approval |
| 5. **Compare results against predictions** | Learn from failed predictions | Outcomes tracked in the research console / Burden lab; predictions logged up front (pre-registration) to prevent p-hacking |
| 6. **Update** the generator, scoring, search strategy, experimental design → **repeat** | The recursive step: the *process* improves | Versioned, auditable scorer + search strategy; a failed prediction retunes weights; **every hypothesis, score, and query is logged with provenance** |

**Where RSI earns its keep for *this* mission:** finding overlooked patterns in the literature/registry;
producing candidate mechanisms fast; prioritizing which screening-gap or workflow change is worth a
pilot; improving models from failed predictions; discovering better features/causal variables — all
pointed at **reducing clinician burden and improving patient outcomes**, e.g. "which post-discharge
patients truly benefit from CHW follow-up," "which inbox-batching cadence lowers after-hours time
without harming safety," "which USPSTF gap best predicts a downstream ED visit in this panel."

### Governance gates (non-negotiable, honest)
- **No autonomous deployment to care.** Human sign-off + IRB for anything touching patients; a model
  change ships only inside a **PCCP** envelope.
- **Full provenance & auditability.** Every hypothesis, score, data query, and generator version logged
  and reproducible; the scorer can be rolled back.
- **NAM AI Code of Conduct** — this is literally its *Monitor Performance* + *Innovate & Learn*
  commitments: continuous learning **with** monitoring, not instead of it. [namAICC]
- **Equity by construction** — findings checked on the equity-disaggregated data we already surface, so
  RSI never optimizes for the majority at a subgroup's expense.
- **Pre-registration** of predictions to keep the loop honest (no fishing).

### Demoable now (small, lean — not a big fan-out)
One turn of the inner loop, live, using the PubMed/Consensus/ClinicalTrials MCP tools: generate 3
candidate hypotheses from the literature on a burnout/screening question, score them on the rubric, and
show the top pick with its citations and its proposed retrospective design — labeled research-layer,
never clinical. (Ask before running; it costs some tokens.)

---

## Part 3 — Connected outside ideas (build on our existing structure)

- **ONC EHIgnite Challenge — Phase 1 winners.** The stated mission — bring a patient's critical health
  data to whoever needs it (patient seeing a new doctor, family in an emergency, clinician reconciling
  conflicting info) — **is exactly LumaChart's patient-mediated "My record."** Strong external
  validation; our unified timeline + HIPAA right-of-access flow already targets it. [ehignite]
- **Circle Medical** (UCSF-partnered telehealth primary care, 55k patients/mo, PPO-accepted, **$0–35
  transparent out-of-pocket**). Reinforces our **transparent pricing** and patient-access posture — the
  deliberate opposite of Epic's individually-negotiated, unpublished pricing. Candidate: a telehealth
  primary-care surface on the same record.
- **Epic** (promo + real-user videos). The contrast we lean into: no public pricing, dense grey/white
  click-around. LumaChart's answer is **Focus/Lean minimalism + transparent pricing + one route per
  task** — well-being first.
- **Clara Health AI** — *site blocks automated fetch (Cloudflare 403); review in a browser before
  describing.* Queued.
- **Becker's HIT/RCM 2026 & HL7 events** — industry/standards touchpoints; networking + standards
  currency, not build items.

### Trust & certification signals (what a *production* LumaChart earns — honestly labeled, not claimed by the prototype)
Circle Medical surfaces verifiable trust badges (HIPAA Compliant · LegitScript Certified · American
Telemedicine Association member). A serious LumaChart carries an equivalent, **verifiable** set — and
because we don't fabricate proof, each is shown only once actually earned:
- **HIPAA** — Security Risk Analysis + BAAs (already in the compliance binder). *foundational.*
- **ONC-ACB certified (§170.315)** — the EHR-specific credential; the real analog to a trust badge here.
- **SOC 2 Type II / HITRUST** — the enterprise security attestations buyers ask for.
- **LegitScript** — relevant if/when e-prescribing or a telehealth surface is added.
- **ATA membership** — relevant if the Circle-style telehealth primary-care surface is built.
- **FDA 510(k)** — for the predictive early-warning module only (Part 1, track 3).
Candidate: a small, honest "Trust & certifications" strip in Security — each badge greyed until earned,
with a "Verify" link, so the signal is real, never theater.

---

## Part 4 — The 160-specialty problem (why RSI + packs matter here)

There are ~160 recognized medical specialties/subspecialties in U.S. practice, and **each has its own
pajama-time profile** — the dermatologist's after-hours burden is not the oncologist's is not the
psychiatrist's. Most EHR efforts optimize for **sepsis or primary care** and leave the rest on a generic
chassis. LumaChart's answer, consistent with everything above:

- **One spine, specialty packs.** The core never forks — evidence engine, Scribe, batched inbox, Focus,
  revenue cycle, FHIR surface, the regulatory architecture. A **specialty pack** swaps four data layers
  we already isolate: guideline set, case-mix/CME map, instruments, and ecosystem connections. (IM
  first → cardiology → outward, per the sequencing strategy.)
- **Per-specialty burden, measured.** The Burden lab's audit-log metrics are computed **per specialty**,
  so each pack targets *its own* pajama time rather than a national average — the well-being mission,
  specialty-aware.
- **RSI is how 160 packs stay current without 160 teams.** The discovery loop (Part 2) mines each
  specialty's literature and its slice of the de-identified registry to surface that specialty's
  highest-value screening gaps and workflow fixes — then human review + gates before anything ships.
  This is the only realistic way to keep guideline currency across 160 fields.

Honest scope: challenging but doable *because* the burden is concentrated in the four swappable layers,
not the whole system. Depth-first in one specialty with a design partner beats shallow coverage of all.

## Build order (proposed, lean)
1. **Shipped this pass:** dated Bayesian FDA 510(k) fact in the early-warning card; the three-track
   **Regulatory architecture** card in Security; seven regulatory authorities added to the bibliography.
2. **Next (small):** a research-console "RSI discovery loop" panel that shows the six steps + governance
   gates (read-only, honest, labeled research-layer), optionally wired to one live PubMed query.
3. **Later (real work, gated):** the predictive early-warning module's FDA 510(k) + PCCP dossier;
   Inferno conformance runs against the FHIR surface.

*Written 2026-09-09. Everything here stays in service of clinician & patient well-being; billing and
even FDA clearance are background infrastructure, never the point.*
