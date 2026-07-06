# LumaChart — Billing Agent & Puerto Rico Clearinghouse Bridge

**Companion to the in-app *Encounter & claim* view (clinician) and *Check-in* view (patient).**
Prepared 2026-07-04 · branch `new-feature`

> **Why this exists.** The single biggest, most fixable revenue leak in primary care is **incomplete coding**. A complex patient is not an easy patient — three or more diagnoses each demand thought and each needs its own **ICD-10** code. Code them all and the claim reflects the true work; miss two and you are literally paid less for the same visit. LumaChart is built so **stating every condition is the path of least resistance**, not extra work.

---

## 1. The problem in one line

Practices fall short on **ICD-10 diagnosis codes and CPT procedure codes**, and — for Puerto Rico — on the fact that **mainland U.S. EHRs are not natively compatible with PR clearinghouses**. Both are integration problems, and both are solvable with a well-scoped agent plus a bridge connector.

## 2. The target workflow (what should happen)

| Step | Who | What happens in LumaChart |
|---|---|---|
| 1 · Waiting-room intake | **Patient** (iPad) | "Great to see you again — do you still have these conditions? still take these meds? anything new?" Patient confirms/updates the pre-loaded problem list, meds, demographics, and **uploads a photo ID**. A large chunk of intake is done *by the patient*. |
| 2 · Pre-load | System | The confirmed conditions (e.g., the first **8** ICD-10 problems) and demographics flow straight into the encounter and the claim. |
| 3 · The visit | **Clinician** | Adds only the **last two** diagnoses discussed today (e.g., `R20.2` paresthesia, `Z12.11` colon-cancer screening) — the record already holds the rest. |
| 4 · CPT suggestion | **🤖 Billing agent** | With the note (scribe) + coded diagnoses, the agent proposes the visit's **CPT** codes (E/M level, screenings, venipuncture, etc.) with a rationale for each. |
| 5 · Verify / override | **Clinician** | Verify ✓ check-check-check, or override. The agent **never bills without sign-off.** |
| 6 · Assemble | **🤖 Billing agent** | Fills the claim form (**837P** professional claim) from demographics + ICD-10 + CPT — the form the biller used to fill by hand. |
| 7 · Review | **Biller** | Double-checks demographics (the most common denial cause), codes, and payer eligibility. |
| 8 · Submit | **Biller** | Uploads to the **clearinghouse of the medical plan** — routed through the PR bridge when the payer is in Puerto Rico. |

The prototype demonstrates steps 1–8 end to end with a real ICD-10/CPT set for the demo patient.

## 3. The billing agent

**Role:** a supervised claim-preparation assistant — not an autonomous biller.

- **Inputs:** structured problem list (ICD-10), the clinician's note/scribe output, encounter metadata, patient demographics & coverage, and CPT rules.
- **Actions:** (a) **download / open** the correct claim form or payer template; (b) **fill** it — map diagnoses to CPT, suggest E/M level from documented complexity, attach modifiers; (c) **hand off** a complete draft to the biller.
- **Guardrails:** every code is a *suggestion* with a rationale and a source; the clinician verifies or overrides; the biller performs the final human check before submission. No automated employment or payment action. Full audit trail of what the agent proposed vs. what a human changed.
- **Why an agent here:** coding is high-volume, rule-dense, and repetitive — exactly where assistance recovers clinician time and captured revenue without removing human judgment. This dovetails with the Quadruple-Aim thesis: less clerical burden *and* a cleaner claim.

## 4. The Puerto Rico bridge connector

**Problem:** EHRs and claim formats built for the U.S. mainland are frequently **not accepted natively by Puerto Rico clearinghouses and payers**, so PR practices re-enter claims by hand into a separate system.

**Proposed solution — a third-party bridge:** a connector that
1. **collects the pertinent information** from the EHR (demographics, ICD-10, CPT, coverage) via the standardized API (FHIR / §170.315(g)(10));
2. **transforms** it into the format the PR clearinghouse/payer requires — including **mapping ICD-10 to its ICD-9 crosswalk** for PR payers that still require ICD-9 (Puerto Rico lagged the mainland ICD-10 transition); every crosswalk in the demo was verified against the NLM ICD-9-CM database, referencing <https://www.icd9data.com/2015/Volume1/default.htm>;
3. **connects both directions** — EHR ↔ bridge ↔ clearinghouse — so a mainland-built record can bill a PR plan (and vice-versa) without manual re-keying;
4. keeps a **linked longitudinal record** between mainland and PR care, closing the interoperability gap for patients who move or receive care in both.

The bridge is the natural home for the billing agent's output: the agent assembles the 837P, the biller approves, and the bridge handles PR-specific delivery. See also `docs/INTEROPERABILITY-PLAN.md` (USCDI/US Core mapping) — the same FHIR surface that carries clinical data carries the claim's structured inputs.

## 5. Scope notes

- **Not for burn aesthetics / medical-photography practices.** LumaChart is a primary-care / public-health record; image-heavy aesthetic-medicine workflows (serial clinical photography, procedure imaging catalogs) are explicitly **out of scope** for v1.
- **Robust code coverage.** A newer EHR built for a single specialty (e.g., a chiropractor's system) often ships without the **broad ICD-10/CPT coverage** general practice needs. LumaChart's coding layer is built around the full code sets from the start, not a narrow subset.
- **Well-being features are optional.** Not every provider wants self-care tooling. The Wellness Center and Canary are a **preference toggle** (like dark mode / eyestrain) — on by default, one click to hide for a lean clinical view. The billing, coding, and prevention core is unaffected.

## 6. Honest status

The in-app flow is a **demonstration** with synthetic data. Real deployment requires: a certified **837P** generator and payer connections, clearinghouse contracts (mainland + PR), coding-compliance review, and validation of any agent-suggested codes against current CMS/AMA rules before a human submits. ICD-10-CM and CPT are standardized code sets; the specific codes shown are illustrative for one demo patient.
