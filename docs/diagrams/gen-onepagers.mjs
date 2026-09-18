import fs from "node:fs";
const OUT = process.argv[2];

const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
@page{size:8.5in 11in;margin:0}
html,body{width:816px}
body{font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;color:#12303a;font-size:12px;line-height:1.42}
.page{width:816px;min-height:1056px;padding:42px 46px 60px;position:relative;background:#fff}
.wm{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.wm .b{display:flex;align-items:center;gap:10px;font-size:19px;font-weight:800}
.wm .dot{width:26px;height:26px;border-radius:7px;background:linear-gradient(140deg,#22c0cf,#0e7c8b)}
.wm .b span{color:#12303a}.wm .b i{color:#0e7c8b;font-style:normal}
.kick{font-size:11px;font-weight:800;letter-spacing:2.5px;color:#0e7c8b;text-transform:uppercase;border:1px solid #bfe1e6;background:#eaf6f8;padding:6px 12px;border-radius:999px}
h1{font-size:27px;font-weight:850;letter-spacing:-.5px;line-height:1.08;margin-top:6px}
.sub{font-size:13px;color:#5a6c76;margin-top:7px;margin-bottom:4px}
.rule{height:3px;background:linear-gradient(90deg,#0e7c8b,#22c0cf 60%,#eaf6f8);border-radius:3px;margin:14px 0 12px}
h2{font-size:13px;font-weight:800;color:#0e7c8b;text-transform:uppercase;letter-spacing:.6px;margin:14px 0 8px;padding-left:10px;border-left:4px solid #22c0cf}
.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.card{border:1px solid #d7e2e5;border-radius:10px;padding:11px 13px;background:#fbfdfd}
.card h3{font-size:12.5px;font-weight:800;margin-bottom:3px;color:#12303a}
.card p{font-size:11.5px;color:#3f5560}
ul{list-style:none}
li{position:relative;padding-left:15px;margin:5px 0;font-size:11.7px;color:#25404a}
li:before{content:"";position:absolute;left:0;top:6px;width:6px;height:6px;border-radius:2px;background:#22c0cf}
li b{color:#12303a}
li.gap:before{background:#c2472f}
li.done:before{background:#2e8b62}
.chip{display:inline-block;font-size:9.5px;font-weight:700;color:#0e7c8b;background:#eaf6f8;border:1px solid #bfe1e6;border-radius:999px;padding:1px 7px;margin-left:3px;white-space:nowrap}
.pill-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.foot{position:absolute;left:46px;right:46px;bottom:24px;border-top:1px solid #e3ebed;padding-top:9px;font-size:10px;color:#8a9aa4;display:flex;justify-content:space-between}
.foot b{color:#c98a1e}
.lead{font-size:12.5px;color:#25404a;margin-bottom:4px}
`;

const wm = kick => `<div class="wm"><div class="b"><span class="dot"></span><span>Luma<i>Chart</i></span></div><div class="kick">${kick}</div></div>`;
const foot = `<div class="foot"><span><b>Demonstration prototype</b> · synthetic data · every claim carries a PMID / §170.315 / authority citation</span><span>lumaehr.com</span></div>`;
const page = (kick, inner) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="page">${wm(kick)}${inner}${foot}</div></body></html>`;

/* ---------------- INVESTOR ---------------- */
const investor = page("For investors", `
<h1>The competitive advantage</h1>
<div class="sub">Why a well-being-first, compliance-native EHR wins a market legacy vendors structurally can't serve.</div>
<div class="rule"></div>
<p class="lead"><b>The market.</b> Physician burnout is a measurable, multibillion-dollar drain on health systems — and the EHR is a leading cause. LumaChart is the hospital EHR built to reverse it, and to serve public health.</p>
<h2>Four advantages legacy can't easily copy</h2>
<div class="two">
  <div class="card"><h3>1 · Evidence on the record</h3><p>Care is cited at the point of decision. Adoption alone never raised quality — <b>intensive decision-support use did</b> <span class="chip">PMID 19390094</span>. Not a bolt-on AI toggle beside Epic.</p></div>
  <div class="card"><h3>2 · Compliance as a live engine</h3><p>ONC Part 170 by design; governed AI <span class="chip">§170.315(b)(11)</span> under an FDA/PCCP posture; a 50-state + PR statutory-deadline engine; transparent pricing <span class="chip">CMS 45 CFR 180</span>. The moat.</p></div>
  <div class="card"><h3>3 · Well-being first</h3><p>Burnout is the disease it treats — the design constraint. Epic and Oracle Health are built around the revenue cycle; the note is a billing artifact.</p></div>
  <div class="card"><h3>4 · Low-cost, open, standards-native</h3><p>A nationwide <i>and</i> low/middle-income lane <span class="chip">PMID 37991820</span>, aligned to CMS's modular, interoperable Medicaid (MES) goals. Standards, not lock-in.</p></div>
</div>
<h2>The moat</h2>
<ul>
<li><b>Evidence + compliance + implementation method.</b> National EHRs fail on people and process, not software <span class="chip">PMID 33017724</span> — so our edge compounds exactly where legacy is weakest, and it's hard to retrofit onto a billing-first monolith.</li>
</ul>
<h2>Business model &amp; funding</h2>
<ul>
<li><b>Non-dilutive first.</b> NIH SBIR (AHRQ → NLM) funds the R&amp;D — no equity given up to start.</li>
<li><b>Open-core revenue.</b> The core is open and low-cost; revenue comes from hosting, support, certified builds, and implementation services — the recurring, defensible layer.</li>
</ul>
<h2>Where we are — candidly</h2>
<ul>
<li><b>A working, evidence-cited prototype</b> — 66 peer-reviewed sources on the record, certification-by-design, and active engagement on the CMS MES IT-Standards RFI.</li>
<li class="gap"><b>Not yet deployed or certified.</b> That maturity — a certified pilot at a real site — is precisely what the raise funds.</li>
</ul>
`);

/* ---------------- SALES ---------------- */
const sales = page("For the sales team", `
<h1>Sales &amp; integration approach</h1>
<div class="sub">Who we sell to, the message by buyer, and how we land and deploy without a rip-and-replace.</div>
<div class="rule"></div>
<h2>Who we sell to (ideal customer)</h2>
<ul>
<li><b>Safety-net &amp; community hospitals</b>, <b>DPC / private practices</b>, and <b>underserved / LMIC systems</b> — buyers worn down by cost, vendor lock-in, and clinician burnout.</li>
</ul>
<h2>The message, by buyer</h2>
<div class="two">
  <div class="card"><h3>CMO / CWO</h3><p>Retention and Joy in Medicine; measurable burnout reduction; a real note, not homework.</p></div>
  <div class="card"><h3>CIO / CTO</h3><p>Standards-native (FHIR/USCDI/TEFCA), composable, no lock-in, low total cost. Buy certified modules, don't rebuild.</p></div>
  <div class="card"><h3>CFO</h3><p>Transparent published pricing, denial-prevention ROI, and price-transparency compliance handled.</p></div>
  <div class="card"><h3>Clinicians &amp; nurses</h3><p>Fewer clicks, ambient notes, gentle alerting — designed <i>with</i> nurses, the largest user group <span class="chip">PMID 21524315</span>.</p></div>
</div>
<h2>Land where legacy hurts</h2>
<ul>
<li><b>Open the door on pain:</b> burnout, opaque expensive contracts, rigid workflows — then land a <b>low-risk pilot on one service line</b>, not a house-wide switch.</li>
</ul>
<h2>Integration approach — how we deploy</h2>
<ul>
<li><b>Standards-native connectors:</b> eligibility &amp; prior auth (Da Vinci), labs, e-prescribing (NCPDP SCRIPT), telehealth, and TEFCA exchange — interoperability that returns time.</li>
<li><b>Composition:</b> certified modules on a FHIR-native core; we integrate, we don't reinvent.</li>
<li><b>Gated go-live (Wave 0 → 3):</b> readiness → pilot → specialty expansion → enterprise, with super-users, training, and tiered support. A wave graduates on data — adoption &amp; minutes-returned <span class="chip">PMID 33017724</span>.</li>
</ul>
<h2>Objections → answers</h2>
<ul>
<li><b>“You're a prototype.”</b> → A phased, low-risk pilot; every feature is evidence-cited; a clear ONC certification path.</li>
<li><b>“Switching is too costly.”</b> → Standards-based migration &amp; two-way interoperability; run alongside, don't rip out.</li>
<li><b>“Who supports it?”</b> → A tiered support model and super-user program — support is a top adoption factor, and we resource it.</li>
</ul>
`);

/* ---------------- CTO / TECHNICAL ---------------- */
const cto = page("For the CTO · engineering", `
<h1>Interoperability — built vs. yet to build</h1>
<div class="sub">Standards-native by design. What's live in the prototype, and the honest roadmap to hospital- and practice-scale interoperability.</div>
<div class="rule"></div>
<div class="two">
  <div>
    <h2>In the prototype today</h2>
    <ul>
    <li class="done"><b>FHIR R4 + US Core</b> data model; <b>USCDI v3</b> mapping.</li>
    <li class="done"><b>SMART on FHIR</b> app surface — the (g)(10) sandbox.</li>
    <li class="done"><b>Evidence / citation engine</b> (PMID · §170.315 · authority).</li>
    <li class="done"><b>AI governance registry</b> (scale / pause / kill · PCCP).</li>
    <li class="done"><b>Compliance engine</b> — 50-state + PR statutory deadlines.</li>
    <li class="done"><b>Role UIs</b> — clinician, patient, researcher, CWO/CMO.</li>
    </ul>
  </div>
  <div>
    <h2>Yet to build (priority order)</h2>
    <ul>
    <li class="gap"><b>Certified (g)(10) API</b> + Inferno conformance — productionize.</li>
    <li class="gap"><b>TEFCA / QHIN</b> join + <b>C-CDA</b> transitions of care.</li>
    <li class="gap"><b>Payer interop:</b> Da Vinci CRD/DTR/PAS (prior auth); X12 837/835.</li>
    <li class="gap"><b>Labs</b> (LOINC, HL7 v2 ↔ FHIR), <b>e-Rx</b> (NCPDP SCRIPT, EPCS), <b>imaging</b> (DICOMweb / FHIR ImagingStudy).</li>
    <li class="gap"><b>Vital records / EDRS</b> (VRDR FHIR) per jurisdiction.</li>
    <li class="gap"><b>Bulk data</b> ($export / Flat FHIR) for registry, population &amp; research.</li>
    <li class="gap"><b>Patient matching</b> + provider directory; <b>consent management</b>.</li>
    <li class="gap"><b>Documentation integrity:</b> signed notes + hash-chained, append-only audit log — the standards-based alternative to blockchain.</li>
    <li class="gap"><b>Low-resource / offline-tolerant sync</b> (LMIC / rural).</li>
    <li class="gap"><b>Security attestations:</b> SAFER, HIPAA, audit; SOC 2 / HITRUST.</li>
    </ul>
  </div>
</div>
<h2>Plus: the 5 readiness factors still to close <span class="chip">Fennelly · 15 factors · PMID 33017724</span></h2>
<div class="two">
  <div class="card"><h3>Organizational &amp; human (3)</h3><p><b>Training</b> — role-based + super-users · <b>Support model</b> — tiered go-live desk · <b>User competencies</b> — role-based proficiency, incl. nurses.</p></div>
  <div class="card"><h3>Technological (2)</h3><p><b>Infrastructure</b> — low-resource / offline-tolerant mode (LMIC / rural) · <b>Testing</b> — phased field pilots with conformance &amp; fidelity gates.</p></div>
</div>
<h2>Scale — same core, two footprints</h2>
<div class="two">
  <div class="card"><h3>Hospital scale</h3><p>Enterprise integration engine, HL7 v2 / HIE bridges, SSO, HA &amp; DR, bulk export for the warehouse.</p></div>
  <div class="card"><h3>Private-practice scale</h3><p>Turnkey SaaS, plug-and-play certified connectors, lightweight onboarding — no integration team.</p></div>
</div>
<div style="margin-top:12px;font-size:11.5px;color:#3f5560"><b>Principle — certification by composition:</b> certified modules on a FHIR-native core; every capability cites its §170.315 criterion. Interoperability is a returned-time feature, not a project.</div>
`);

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(`${OUT}/onepager-investor.html`, investor);
fs.writeFileSync(`${OUT}/onepager-sales.html`, sales);
fs.writeFileSync(`${OUT}/onepager-cto.html`, cto);
console.log("wrote 3 one-pagers to", OUT);
