# Interoperability — lessons from the field, applied to LumaChart

*Primary source: Everson J, Adler-Milstein J, Phillips RL, Bazemore AW, Patel V. "EHR Interoperability
Experiences Reported by Family Physicians." **JAMA Netw Open 2025;8(11):e2542460** ([PMID 41231471](https://pubmed.ncbi.nlm.nih.gov/41231471/),
[DOI](https://doi.org/10.1001/jamanetworkopen.2025.42460)). ONC/ASTP + ABFM + UCSF; 8,122 family physicians, 100% response. (According to PubMed.)*

## What the evidence says
- Despite information-blocking rules and certified APIs, **"ideal" interoperability is rare**: only **8–19%** of
  physicians report *often automatically obtaining, easily finding, and easily reconciling* data — **worst (8%) for
  test results from outside hospitals/health systems.**
- **Equity gap:** physicians whose panels are majority-vulnerable are **less likely** to have ideal interoperability
  for primary-care notes and consult reports (OR 0.66, 95% CI 0.48–0.91) — *the underserved get worse interoperability.*
- Simulated marginal interventions moved the needle little; the real fix is **simpler interoperability plus robust
  data standardization and quality**, pursued collaboratively.

## The design target it sets (the "ideal interoperability experience")
The bar is **not** "we support FHIR." It is: incoming data is **(1) automatically obtained · (2) easily found ·
(3) easily reconciled — all inside the EHR.** Design *and measure* to that three-part standard, per data type and
document type.

## Priorities this directs for LumaChart
1. **Fix outside test results first** — the worst gap (8%). LOINC-coded lab/result ingestion **with reconciliation**; make outside results automatic and comparable.
2. **Notes & consult reconciliation** — C-CDA / FHIR DocumentReference auto-obtained, de-duplicated, surfaced.
3. **Medication reconciliation** — auto-pull the med list (e-Rx history / RTPB) and reconcile (ties to `rtpbTool`, PMID 42599729).
4. **Serve the safety-net *especially* well** — because vulnerable panels have the worst interoperability, LumaChart's beachhead edge is making interop **excellent exactly where it's worst** — the **double aim: equity via interoperability.**
5. **Data quality & standardization as first-class** — not just moving data, but coded, reconciled, trustworthy data.

## How it plugs in
- Sharpens the **CTO one-pager** "yet to build" list — move **outside-results ingestion + reconciliation** to the top.
- Reinforces the **double aim** (equity via interop) and the **safety-net beachhead** with hard evidence.
- Adds a **measurable interop KPI**: the *"ideal interoperability experience" rate* — % of incoming data auto-obtained, found, and reconciled — which LumaChart can report where legacy systems can't.
