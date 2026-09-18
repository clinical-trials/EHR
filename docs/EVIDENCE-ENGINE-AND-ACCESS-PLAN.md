# Evidence Engine + Patient-Access Plan

Two workstreams that came out of the OpenEvidence / Jane comparison.

---

## Part A — The embedded Evidence & Systematic-Review Engine (our answer to OpenEvidence)

### The differentiator, in one sentence
**OpenEvidence is a separate app the physician toggles to; LumaChart puts the evidence *inside* the record — cited on the note, governed by the EHR, with nothing to copy-paste back.**

OpenEvidence is excellent (200M+ consultations; content deals with NEJM, JAMA, Nature, Cochrane, NCCN) — but by its own design it lives *beside* Epic. The clinician leaves the chart, asks a question, reads an answer, then **manually carries it back** into the note. That toggle is:
- a context-switch tax (the very click-burden we exist to remove),
- **un-written-to-the-record** (the answer and its citation don't land on the note automatically),
- **outside the EHR's governance** (not under the record's §170.315(b)(11) transparency, audit log, or PCCP change-control).

LumaChart's move is not to build a better answer box. It is to make evidence **a property of the workflow**: surfaced by CDS Hooks at the moment of decision, and inserted onto the note **with its PMID/DOI and §170.315 chip** in one tap.

### Three tiers — embedded, and mostly automatic
OpenEvidence makes the clinician *pick a model* (Osler / Sackett / Snow). We should **not** put that cognitive load on the physician. Default to the fastest tier, auto-escalate on complexity, and expose the deep tier as an explicit on-demand action.

| Tier | OE analog | Latency | What it is | Where it lives |
|---|---|---|---|---|
| **1 · Point-of-care answer** | Osler | seconds | One cited answer to a focused question (dose, criterion, first-line Rx). One tap → inserts into the note with the PMID chip. | Inline in chart / Scribe / orders (CDS Hooks) |
| **2 · Evidence survey** | Sackett | seconds–1 min | A short **GRADE-graded** survey; asks one clarifying question when a clinically significant detail is missing. | Chart side-panel |
| **3 · Systematic review / report** | Snow | minutes | A **PRISMA-structured** auto-draft review, attached to the record and fed into the RSI learning-health loop. | Research console / CWO |

**Which OpenEvidence model, if used today?** Osler for point-of-care lookups, Sackett for nuance, **Snow** for building an actual review. But the product answer is: *don't make clinicians choose or toggle* — embed the tiers.

### Tier 3 methodology (blueprint = the shared PDF)
Follow Calderon Martinez et al., *Medicine* 2025;104:33 (e41868, CC-BY): well-defined question (**PICO/PICOTS/SPIDER**) → multi-database search (**PubMed/MEDLINE + Embase + Cochrane CENTRAL**, ≥2 databases, incl. grey literature) → de-dup/screen (Rayyan/Covidence pattern) → **PRISMA flow** (the `r1_prisma.pdf` format) → risk of bias (**Cochrane RoB2 / Newcastle-Ottawa / ROBINS-I**) → **GRADE** certainty → synthesis (qualitative, or meta-analysis via R/RevMan with forest/funnel plots, I², Egger) → **PROSPERO**-style protocol registration. Every included study keeps its PMID/DOI on the record.

### Naming
OpenEvidence took Osler / Sackett / Snow. Keep ours distinct EBM figures so it reads as *our* engine, e.g. **Nightingale** (fast, bedside), **Bradford Hill** (survey/causal), **Cochrane** (systematic report) — final names TBD.

### Governance (the compliance point)
Every tier's output is **governed AI under §170.315(b)(11)** — source + logic transparency, provenance/audit-logged, under the FDA-aligned **PCCP** posture and the model registry with a kill switch. A separate app's answers are none of these. *That* is why embedded beats toggled, for compliance as much as for burnout.

---

## Part B — Patient Access & Transparency features (approved to build)

All four are on-thesis (reduce friction, serve public health) and several are **compliance-native**.

1. **Transparent, published pricing** — *strongest add.* Two layers: (a) publish LumaChart's own SaaS pricing openly (a wedge against Epic/Oracle's opaque, quote-only contracts); (b) patient-facing price transparency — **CMS Hospital Price Transparency (45 CFR 180)** machine-readable standard charges + shoppable-services tool, and **No Surprises Act Good-Faith Estimates**. Market differentiator *and* a regulatory requirement, satisfied natively.
2. **Patient self-scheduling / online booking** — a patient-facing booking flow (provider + visit-type + open slots) feeding the Today schedule. Access + no-show reduction.
3. **Automated reminders (email/SMS) + waitlist** — configurable reminders and a waitlist that auto-fills cancellations. No-show reduction, equity of access.
4. **Frictionless payments / card-on-file + memberships/packages** — card-on-file, packages/memberships (matters for DPC/clinic segments), **plus financial-assistance / sliding-scale** surfacing (public-health equity), alongside the existing Keep-your-coverage / Medicaid-renewal flow.

Out of scope (Jane's SMB scope, wrong for a hospital/public-health EHR): payroll, website builder, SEO, reviews management.

### Suggested build order
1. **Transparent pricing** (self-contained, compliance-native, demo-ready).
2. **Self-scheduling / online booking** (+ waitlist).
3. **Reminders**.
4. **Payments / card-on-file / memberships + financial assistance**.
Then the **embedded evidence engine** tiers as the flagship differentiator (highest design lift).
