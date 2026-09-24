# LumaChart × Medicare Care Compare — quality measures, reporting & ROI

*How LumaChart maps to CMS's public hospital scorecard ([Care Compare](https://www.medicare.gov/care-compare/?providerType=Hospital)),
how it reports the measures, and the penalty-avoidance ROI. Public product doc.*

## Why Care Compare is strategic
Care Compare is both **how hospitals are judged** (the public 1–5★ Overall Star Rating and its measure groups)
**and how they're paid** — several CMS programs tie Medicare dollars to these exact measures. Improving them is a
hard-dollar value proposition, not just a reputation story.

## The CMS programs behind the measures (what's at stake)
| Program | At stake | LumaChart lever |
|---|---|---|
| **HRRP** — Hospital Readmissions Reduction | up to **−3%** of Medicare inpatient payments | Risk & early-warning + timed post-discharge follow-up |
| **HAC** Reduction Program | **−1%** (worst quartile) | BCMA five-rights + CDS + antibiotic stewardship → fewer HAIs |
| **Hospital VBP** (value-based purchasing) | ~**2%** redistributed on quality | gains across process, outcome & experience measures |
| **Hospital IQR + Promoting Interoperability** | pay-for-reporting; eCQM submission | §170.315(c) eCQM capture & automated submission |

## Care Compare measure groups → how LumaChart moves each
| Measure group | Examples | LumaChart lever | Status |
|---|---|---|---|
| **Patient experience (HCAHPS)** | communication · discharge info · care transitions · would-recommend | patient portal + right-of-access + care-transition summaries + language-first comms | designed-in |
| **Timely & effective care** | sepsis (SEP-1) · ED throughput · preventive care · follow-up | evidence-CDS + USPSTF prevention + one-tap sepsis screen | partial |
| **Complications & deaths** | 30-day mortality (AMI/HF/pneumonia/COPD/stroke) · PSI-90 · HAIs | BCMA med safety + CDS + antibiotic stewardship | partial |
| **Unplanned visits — readmissions** | 30-day readmission (AMI/HF/pneumonia/COPD/CABG/THA-TKA) + hospital-wide | Risk & early-warning + **readmission-timing** ([PMID 42593794](https://pubmed.ncbi.nlm.nih.gov/42593794/)) → targeted follow-up intervals | designed-in |
| **Payment & value of care** | Medicare spending per beneficiary · value | denial-prevention + transparent pricing + efficiency | partial |

## Reporting — automated eCQMs
Electronic clinical quality measures (eCQMs) are computed from the **FHIR-native record** and submitted under the
certified **§170.315(c)(1)–(4)** capabilities; the 50-state compliance engine tracks the reporting deadlines.
Measurement becomes a **byproduct of care**, not a separate chart-abstraction project — reducing the burden that
manual abstraction adds (the resilience thesis, again).

## The ROI — penalty avoidance & incentive capture
- **Avoid HRRP** readmission penalties (up to **3%** of Medicare inpatient payments).
- **Avoid HAC** penalties (**1%**) by cutting HAIs and complications.
- **Capture VBP** incentives by moving experience + outcome measures.
- **Equity/beachhead:** these penalties fall **hardest on safety-net hospitals** — so the ROI lands hardest exactly
  in the Medicaid/Medicare beachhead, reinforcing the double aim (resilience + equity).

## Where it plugs in
- In-app **CWO "Quality & Care Compare"** view surfaces all of the above.
- The **sales one-pager** gains a CFO-grade line: *"better Care Compare standing + fewer CMS penalties."*
- The **business plan** value section folds in penalty-avoidance as a quantified value driver.
