# LumaChart — the hospital EHR built for public health

**LUMAEHR.com** · An evidence-based EHR concept that prevents clinician burnout, organizes patient care around prevention & healthspan, and turns consented data into public-health knowledge.

## What's here

- **[docs/LumaChart-Planning.pdf](docs/LumaChart-Planning.pdf)** — the planning document: vision, evidence base, Canary early-warning engine, three pillars, ONC/HIPAA/IRB gates, build-vs-buy strategy. Every PMID is clickable and links to PubMed.
- **Interactive prototype** — `index.html` + `luma.css` + `data.js` + `app.js`. Dependency-free; open `index.html` in any browser (or `python3 -m http.server`).

## Prototype highlights

- **Three roles:** Clinician · Patient · Researcher (switcher in the top bar)
- **Three themes:** Restore (low-glare dark, the default — eyestrain reduction is a feature) · Classic · Modern Clinical
- **🐦 Canary** — burnout early-warning engine on an accelerated demo clock (1 s = 1 min): micro-break at 25 min, breathing prompt at 60, extended-login warning at 120. Private, non-punitive.
- **Structured Assessment & Plan** — the record's future tense (FHIR CarePlan + Task model): what / why / when / who, with a patient-friendly translation published to the portal.
- **Prevention plan with scheduling** — real slot-picking flow and `.ics` calendar export.
- **Roadmap & gates** — ONC §170.315 Base-EHR criteria tracker, and the build-vs-buy map (Medplum/Aidbox FHIR backend; DrFirst/MDToolbox, Health Gorilla, Candid/Claim.MD, Stedi/Availity).
- **✨ Luma assistant** — scripted side-by-side helper (a production version is a §170.315(b)(11) decision-support intervention).
- **Mobile-friendly** and honors `prefers-reduced-motion`.

## Evidence integrity

Every citation in the app and the planning document is a **real PubMed ID verified against PubMed E-utilities** — click any PMID chip to read the source. Nothing is fabricated.

## Status

**Demonstration prototype — synthetic data only, not for clinical use.**
Gates before real-world use: ONC Health IT certification & FHIR interoperability · HIPAA security review & independent audit · IRB approval for the research layer · clinical validation of Canary thresholds.
