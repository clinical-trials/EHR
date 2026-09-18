# National EHR Implementation — the international evidence

Other countries have already run national EHR programs; the lessons are well-summarized.
Primary source: **Fennelly O, et al. "Successfully implementing a national electronic health record:
a rapid umbrella review." *International Journal of Medical Informatics* 2020;144:104281**
(DOI 10.1016/j.ijmedinf.2020.104281, CC-BY; umbrella review of 27 reviews / 5,040 articles, Ireland HSE
context, internationally applicable).

## The headline lesson
National EHR programs succeed or fail mostly on **organizational and human** factors, **not** the
software. "The implementation process is critical, as opposed to the product supplied by the vendor."
LumaChart is strong on the *technological* factors (usability, interoperability, standards); the
**differentiating work is a credible implementation methodology** — the socio-organizational side.

## 15 factors → LumaChart (✓ strong · ◑ partial · ○ to build)

**Organizational**
| Factor | LumaChart | |
|---|---|---|
| Governance, leadership & culture | RSI two-loop governance · AI governance registry · CWO/CMO | ✓ |
| End-user involvement | Clinician-designed · "Own your practice" · ideas voting · site interviews (VA) | ✓ |
| Training | CME & licensure module | ○ add change-management / super-user training |
| Support | Luma assistant · help | ◑ define a support model (super-users, 24/7, escalation) |
| Resourcing | Non-dilutive NIH SBIR · transparent pricing | ✓ |
| Workflows | Focus/Luma Lean · batched inbox · workflow-fit | ✓ |

**Human (individual end-users)**
| Factor | LumaChart | |
|---|---|---|
| Skills & characteristics | Usability for varying literacy | ◑ role-based competencies |
| Perceived benefits & incentives | Burnout reduction as the incentive · ROI · denial prevention | ✓ |
| Perceived changes to the health ecosystem | Canary is private · security · trust-building | ✓ |

**Technological**
| Factor | LumaChart | |
|---|---|---|
| Usability | Restore theme · Focus · clean UI (the design center) | ✓ |
| Interoperability | FHIR R4/US Core · USCDI · TEFCA · SMART | ✓ |
| Adaptability | Composable · customizable metrics · Helix Hub app store | ✓ |
| Infrastructure | Cloud · reliability | ◑ low-resource/offline story |
| Regulation, standards & policies | §170.315 certification · 50-state compliance engine | ✓ |
| Testing | Pilot → Systemwide packaging | ◑ formal field-testing / phased pilots |

## Where this gets used
1. **CMS MES RFI** — these 15 factors *are* the "barriers to MES transformation." Structure barrier
   answers around them (governance, end-user involvement, training, support, interoperability,
   standards, testing), citing Fennelly 2020. Pairs with the five Pew evidence-based-policymaking
   components ([[cms-mes-it-standards-rfi]], EVIDENCE-BASED-POLICYMAKING-ALIGNMENT.md).
2. **Deployment strategy** — a phased, end-user-involved rollout (echoes the VA/EHRM deployment
   schedule already in OUTSIDE-IDEAS-PLAN); foreground training + support + testing, our current gaps.
3. **Investor/technical narrative** — "we win on implementation, not just features," backed by the
   international evidence that implementation is where national EHRs fail.

## To do
Add Fennelly 2020 (and Pew Results First 2014, Calderon Martinez 2025) to `AUTHORITIES` so they carry
`aut()` chips and land in the annotated bibliography, per our cite-everything discipline.
