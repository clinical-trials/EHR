/* LumaChart demo data — entirely synthetic. Every PMID below is real and was
   verified against PubMed E-utilities during preparation of the planning doc. */

const EVIDENCE = {
  arndt:      { pmid:"28893811", cite:"Arndt et al., Ann Fam Med 2017 — PCPs spend 5.9 hr/day in the EHR, 1.4 hr after hours." },
  sinskyTM:   { pmid:"27595430", cite:"Sinsky et al., Ann Intern Med 2016 — ~2 hr of EHR/desk work per 1 hr of direct patient care." },
  downing:    { pmid:"29801050", cite:"Downing, Bates & Longhurst, Ann Intern Med 2018 — US notes ~4× longer than the same EHR abroad; billing rules are the driver." },
  gidwani:    { pmid:"28893812", cite:"Gidwani et al., Ann Fam Med 2017 (RCT) — scribes significantly increased physician satisfaction." },
  quadAim:    { pmid:"25384822", cite:"Bodenheimer & Sinsky, Ann Fam Med 2014 — the Quadruple Aim: care of the patient requires care of the provider." },
  west:       { pmid:"27692469", cite:"West et al., Lancet 2016 (meta-analysis) — interventions measurably reduce physician burnout." },
  lovingKind: { pmid:"18954193", cite:"Fredrickson et al., J Pers Soc Psychol 2008 (RCT) — loving-kindness meditation builds positive emotion & personal resources." },
  holzel:     { pmid:"21071182", cite:"Hölzel et al., Psychiatry Res 2011 — 8 weeks of mindfulness practice increased regional brain gray-matter density." },
  proqol:     { pmid:"28347144", cite:"O'Mahony et al., Am J Hosp Palliat Care 2018 — ProQOL-measured compassion satisfaction buffers burnout." },
  mafi:       { pmid:"29132154", cite:"Mafi et al., Ann Intern Med 2018 — patients contributing to notes can increase efficiency & engagement." },
  wright:     { pmid:"29365301", cite:"Wright & Katz, NEJM 2018 — APEX team model cut clinician burnout 53%→13% in 6 months, cost-neutral." },
  sprint:     { pmid:"26551272", cite:"SPRINT, NEJM 2015 (RCT) — intensive BP control (<120 systolic target) reduced cardiovascular events and death." },
  uspstfCrc:  { pmid:"34003218", cite:"USPSTF, JAMA 2021 — colorectal cancer screening recommended ages 45–75 (Grade A/B)." },
  smoking:    { pmid:"23343063", cite:"Jha et al., NEJM 2013 — quitting smoking before age 40 regains ~9–10 years of life expectancy." },
  medDiet:    { pmid:"29897866", cite:"PREDIMED, NEJM 2018 (RCT) — Mediterranean diet + olive oil/nuts reduced major cardiovascular events ~30%." },
  activity:   { pmid:"21846575", cite:"Wen et al., Lancet 2011 — 15 min/day of moderate activity added ~3 years of life expectancy." },
};

const SCHEDULE = [
  { time:"8:00",  initials:"MA", name:"Maria Alvarez",   age:58, sex:"F", reason:"Diabetes & BP follow-up",  status:"roomed",   preVisit:true  },
  { time:"8:30",  initials:"JT", name:"James Tran",      age:44, sex:"M", reason:"Annual health maintenance", status:"arrived", preVisit:true  },
  { time:"9:00",  initials:"DW", name:"Denise Whitfield",age:67, sex:"F", reason:"Knee pain, mobility",       status:"scheduled",preVisit:false },
  { time:"9:30",  initials:"RK", name:"Ravi Kapoor",     age:52, sex:"M", reason:"Lipid results review",      status:"scheduled",preVisit:true  },
  { time:"10:00", initials:"LN", name:"Linh Nguyen",     age:35, sex:"F", reason:"Postpartum visit",          status:"scheduled",preVisit:true  },
  { time:"10:30", initials:"EB", name:"Earl Bishop",     age:71, sex:"M", reason:"COPD action plan",          status:"scheduled",preVisit:false },
];

const INBOX = [
  { cat:"Results", t:"CBC + CMP — Maria Alvarez",       d:"A1c 6.9% (was 7.4) — improving", urgent:false, delegable:false },
  { cat:"Results", t:"Lipid panel — Ravi Kapoor",       d:"LDL 118, on-visit review today", urgent:false, delegable:false },
  { cat:"Results", t:"TSH — Linh Nguyen",               d:"Within normal limits",           urgent:false, delegable:true  },
  { cat:"Refill",  t:"Metformin 500 mg — M. Alvarez",   d:"Protocol-eligible renewal",      urgent:false, delegable:true  },
  { cat:"Refill",  t:"Lisinopril 10 mg — E. Bishop",    d:"Protocol-eligible renewal",      urgent:false, delegable:true  },
  { cat:"Refill",  t:"Albuterol HFA — E. Bishop",       d:"Protocol-eligible renewal",      urgent:false, delegable:true  },
  { cat:"Portal",  t:"Question about diet — M. Alvarez",d:"“Is olive oil really better?”",  urgent:false, delegable:true  },
  { cat:"Portal",  t:"Work note request — J. Tran",     d:"Template available",             urgent:false, delegable:true  },
  { cat:"Portal",  t:"Thank you 💛 — D. Whitfield",     d:"“You listened. Thank you.”",     urgent:false, delegable:false, gratitude:true },
];

const CHART = {
  name:"Maria Alvarez", age:58, sex:"F", mrn:"LC-0042-DEMO",
  problems:[ "Type 2 diabetes (improving)", "Hypertension", "Overweight (BMI 29.1)" ],
  meds:[ "Metformin 500 mg BID", "Lisinopril 20 mg daily", "Atorvastatin 20 mg nightly" ],
  allergies:"NKDA",
  vitals:[
    { m:"Blood pressure", v:"132/81", trend:"↓ from 141/88", flag:"amber" },
    { m:"A1c",            v:"6.9%",   trend:"↓ from 7.4%",   flag:"green" },
    { m:"LDL",            v:"96",     trend:"↓ from 121",    flag:"green" },
    { m:"Weight",         v:"172 lb", trend:"↓ 6 lb / 6 mo", flag:"green" },
  ],
  preVisit:{
    concerns:"Wants to talk about diet — heard olive oil helps the heart. Some foot tingling at night.",
    goals:"Stay off insulin. Dance at daughter's wedding in October.",
    sdoh:"Walks 20 min, 4×/week. Sleeping ~6.4 h. No tobacco (quit 2019). Lives with spouse.",
  },
  prevention:[ { t:"Colonoscopy", due:true }, { t:"Mammogram", due:false, done:"11 mo ago" }, { t:"Flu vaccine", due:true } ],
};

/* ---------- Structured Assessment & Plan — the record's FUTURE TENSE ----------
   Modeled on the FHIR CarePlan + Task resources: every plan item says
   what / why / when / who — specific, time-bound, actionable.              */
const CARE_PLAN = {
  assessment:"58F with T2DM and HTN, both improving (A1c 6.9 from 7.4; BP 132/81 on lisinopril 20). New nocturnal foot tingling — monofilament exam normal today; will surveil. Motivated by daughter's October wedding; asked about Mediterranean diet.",
  plan:[
    { what:"Colonoscopy referral",            why:"Screening due at 58",                    ev:"uspstfCrc", when:"within 6 weeks",           who:"Referral team",       status:"ordered",
      patient:"Schedule your colonoscopy — we'll send prep instructions once it's booked.", due:"by Aug 15" },
    { what:"Continue metformin 500 mg BID",   why:"A1c trending down on current dose",      ev:null,        when:"ongoing · recheck A1c 3 mo", who:"Maria + pharmacy",  status:"active",
      patient:"Keep taking metformin twice daily with food.",                              due:"ongoing" },
    { what:"Mediterranean diet pattern",      why:"Patient-raised; strong RCT evidence",    ev:"medDiet",   when:"start now · review 3 mo",  who:"Maria + nutrition",   status:"active",
      patient:"Olive oil, nuts, fish, vegetables — the diet you asked about. The evidence is real.", due:"start this week" },
    { what:"Home BP checks, upload to portal",why:"Close the gap to <130 target",           ev:"sprint",    when:"2×/week for 4 weeks",      who:"Maria → care team",   status:"active",
      patient:"Check your blood pressure twice a week and upload readings — we're watching for <130.", due:"twice weekly" },
    { what:"Foot-symptom surveillance",       why:"Nocturnal tingling; exam normal today",  ev:null,        when:"recheck at 3-mo visit",    who:"Dr. Chen",            status:"planned",
      patient:"Tell us right away if the foot tingling gets worse or you notice any sores.", due:"watch & report" },
  ],
};

/* ---------- Prevention plan + scheduling offers ---------- */
const PREVENTION_PLAN = [
  { t:"Colorectal cancer screening", status:"due", detail:"Colonoscopy or FIT — you're 58; screening is recommended for ages 45–75.", ev:"uspstfCrc",
    benefit:"Finds cancer early or prevents it entirely by removing precancerous polyps." },
  { t:"Blood-pressure control", status:"active", detail:"Current 132/81 → goal <130. Your medication + walking plan is working.", ev:"sprint",
    benefit:"Tighter control reduced heart attacks, heart failure and death in a landmark trial." },
  { t:"Mediterranean-style diet", status:"active", detail:"Olive oil, nuts, fish, vegetables — exactly what you asked about in your message.", ev:"medDiet",
    benefit:"Cut major cardiovascular events by roughly 30% in a randomized trial." },
  { t:"Daily movement", status:"active", detail:"You average ~95 min/week. Even 15 minutes a day measurably extends life.", ev:"activity",
    benefit:"15 min/day of moderate activity added ~3 years of life expectancy in a cohort of 416,000 people." },
  { t:"Staying tobacco-free", status:"done", detail:"You quit in 2019 — one of the most powerful things you've ever done for your health.", ev:"smoking",
    benefit:"Quitting early in life regains ~9–10 years of life expectancy." },
  { t:"Mammography", status:"done", detail:"Completed 11 months ago. Next due next year (USPSTF Grade B recommendation).", ev:null,
    benefit:"Regular screening reduces breast-cancer mortality." },
  { t:"Influenza vaccine", status:"due", detail:"Annual dose recommended each fall (CDC/ACIP recommendation).", ev:null,
    benefit:"Reduces flu illness, hospitalization, and cardiovascular complications." },
];

const SLOTS = {
  "Colorectal cancer screening":[
    { d:"Tue, Jul 14", t:"7:30 AM",  loc:"Endoscopy Center — Main Campus",  ics:"20260714T073000" },
    { d:"Fri, Jul 24", t:"9:00 AM",  loc:"Endoscopy Center — Main Campus",  ics:"20260724T090000" },
    { d:"Mon, Aug 3",  t:"1:00 PM",  loc:"Riverside Outpatient Center",     ics:"20260803T130000" },
  ],
  "Influenza vaccine":[
    { d:"Today",       t:"walk-in until 5 PM", loc:"Clinic pharmacy — no appointment needed", ics:"20260703T150000" },
    { d:"Sat, Jul 11", t:"10:15 AM", loc:"Community vaccination clinic",    ics:"20260711T101500" },
  ],
};

const LONGEVITY = [
  { m:"Blood pressure", now:"132/81", target:"<130/80", pct:78, ev:"sprint" },
  { m:"A1c",            now:"6.9%",   target:"<7.0%",   pct:96, ev:null },
  { m:"LDL cholesterol",now:"96",     target:"<100",    pct:100,ev:null },
  { m:"Activity",       now:"95 min/wk", target:"150 min/wk", pct:63, ev:"activity" },
  { m:"Sleep",          now:"6.4 h",  target:"7–8 h",   pct:80, ev:null },
];

const PAJAMA_14D = [62,55,71,48,66,58,80,74,52,60,45,49,38,31];

const THANK_YOUS = [
  { from:"Denise W.", note:"You listened. Thank you for taking my knee seriously." },
  { from:"Earl B.",   note:"First doctor who explained my inhalers so I understood." },
  { from:"Linh N.",   note:"You made me feel safe through the whole pregnancy." },
];

const RESEARCH = {
  consented:12847, total:18203,
  studies:[
    { t:"Clinician workload signals & well-being", d:"Prospective cohort linking de-identified EHR event-log patterns (after-hours time, inbox load) to validated well-being measures — the linkage the National Academy of Medicine has called for. Doubles as the clinical-validation study for Canary's thresholds.", n:"412 clinicians · 24 months", status:"Enrolling" },
    { t:"Prevention uptake & healthspan outcomes", d:"Does an evidence-forward patient portal increase screening completion? Consented, de-identified comparison across sites.", n:"12,847 patients · 36 months", status:"Active" },
  ],
  guardrails:[
    "Explicit, revocable patient opt-in — consent is never assumed",
    "De-identified extracts only; small cells (<11) suppressed",
    "IRB approval required before any cohort export",
    "Clinician well-being data is aggregate-only — never individual",
    "Full audit log of every query",
  ],
};

/* ---------- Path to production: gates, ONC criteria, build-vs-buy ---------- */
const GATES = [
  { t:"ONC Health IT certification & FHIR interoperability", status:"in design",
    d:"Certify against the Base EHR Definition (§170.315) via ONC-ACB testing. FHIR R4 native from day one — see the criteria tracker below." },
  { t:"HIPAA security review & independent audit", status:"planned",
    d:"Full Security Rule risk analysis, SOC 2 Type II, third-party penetration test before any PHI touches the system." },
  { t:"IRB approval for the research layer", status:"planned",
    d:"No cohort leaves the researcher console without an approved protocol. Consent flows already modeled in the prototype." },
  { t:"Clinical validation of Canary thresholds", status:"study designed",
    d:"Canary's nudge thresholds are demo defaults. The prospective well-being study (researcher console) validates them against MBI/ProQOL outcomes before production use." },
];

const ONC_CRITERIA = [
  { cap:"Patient demographic & clinical health information",
    crit:"§170.315(a)(5) Demographics · (a)(14) Implantable device list",
    timing:"(a)(5) updated as of Jan 1, 2026",
    strategy:"Build on FHIR-native backend (Medplum / Aidbox)", kind:"build-on" },
  { cap:"Clinical decision support",
    crit:"§170.315(b)(11) Decision support interventions",
    timing:"update required by Dec 31, 2027",
    strategy:"Build — Canary + prevention engine as transparent DSIs (source, evidence & logic disclosed)", kind:"build" },
  { cap:"Physician order entry",
    crit:"§170.315(a)(1)–(3) CPOE (meds, labs, imaging)",
    timing:"current",
    strategy:"Build lean CPOE; standing-order protocols delegate the clerical share", kind:"build" },
  { cap:"Clinical quality measures",
    crit:"§170.315(c)(1) CQM — record & export",
    timing:"current",
    strategy:"Build — plan-based quality: assess the Plan prospectively, not only past data", kind:"build" },
  { cap:"Exchange & integrate health information",
    crit:"§170.315(b)(1) Transitions of care · (g)(7)(9)(10) APIs incl. standardized FHIR API · (h)(1)/(h)(2) Direct",
    timing:"(b)(1), (g)(9), (g)(10) updated as of Jan 1, 2026",
    strategy:"Medplum/Aidbox FHIR R4 API (g)(10) + HIE / Direct partner", kind:"build-on" },
  { cap:"Real-time prescription benefit",
    crit:"§170.315(b)(4) RTPB",
    timing:"required as of Jan 1, 2028",
    strategy:"Buy: DrFirst or MDToolbox certified e-Rx module", kind:"buy" },
];

const BUY_BUILD = [
  { area:"FHIR data backend",    partner:"Medplum (open-source) or Aidbox", kind:"build-on",
    why:"FHIR R4-native store, auth, subscriptions & the §170.315(g)(10) API path — saves 12+ months of data-infrastructure work." },
  { area:"e-Prescribing & EPCS", partner:"DrFirst · MDToolbox", kind:"buy",
    why:"Certified e-Rx, controlled substances, and real-time prescription benefit (§170.315(b)(4))." },
  { area:"Lab orders & results", partner:"Health Gorilla", kind:"buy",
    why:"National lab network (Quest, Labcorp, regionals) through one API." },
  { area:"Claims & billing",     partner:"Candid Health · Claim.MD", kind:"buy",
    why:"Billing lives in its own automated layer — keeping it OUT of the clinical note is the LumaChart thesis." },
  { area:"Eligibility & coverage", partner:"Stedi · Availity APIs", kind:"buy",
    why:"Real-time eligibility checks without building X12 plumbing." },
];

/* Why the PLAN is the most valuable structure in the record (A&P thesis) */
const PLAN_THESIS = [
  { who:"CMS · Quality",       d:"Assess the clinician's stated plan prospectively — and whether it tracked evidence — instead of only judging past data." },
  { who:"FDA · Real-world data", d:"The A&P reveals the intent behind treatment choices — the missing piece that separates causation from correlation in retrospective data." },
  { who:"NIH/FDA · Research",  d:"Protocols are structured plans. A record that speaks 'plan' natively can run studies inside routine care — a learning health system." },
  { who:"CDC · Public health", d:"Structured, findable plans let public-health agencies see what clinicians intend to do across a population — critical in outbreaks." },
  { who:"The patient",         d:"The after-visit summary becomes a forward-looking plan with tasks and reasons — the record's future tense, translated for the person living it." },
];

/* ---------- Customizable clinician metrics ---------- */
const METRIC_LIBRARY = [
  { id:"facetime",  t:"Face-time ratio",        v:"52%",  d:"of today with patients, not screens", bar:52,  tone:"green" },
  { id:"afterhrs",  t:"After-hours EHR",        v:"31 min",d:"yesterday · 14-day trend falling",   bar:37,  tone:"green" },
  { id:"inboxload", t:"Inbox burden",           v:"9",    d:"open · 6 team-delegable",             bar:45,  tone:"amber" },
  { id:"prevgaps",  t:"Panel prevention gaps",  v:"14",   d:"patients overdue for screening",      bar:30,  tone:"amber" },
  { id:"a1cpanel",  t:"Panel A1c control",      v:"71%",  d:"of diabetic panel at goal",           bar:71,  tone:"green" },
  { id:"noteLen",   t:"Note length vs peer",    v:"−38%", d:"leaner than national average",        bar:62,  tone:"green" },
];

/* ---------- Luma assistant (scripted demo) ---------- */
const ASSISTANT_RULES = [
  { match:/due|overdue|maria|alvarez/i,
    a:"Maria Alvarez has 2 prevention items due: <b>colorectal cancer screening</b> and the <b>flu vaccine</b>. Her A1c improved to 6.9% and BP is 132/81 (goal <130). Want me to open the scheduling options?",
    actions:[{ label:"Open prevention plan", go:{ role:"patient", view:"plan" } }] },
  { match:/inbox|message|refill/i,
    a:"Your inbox has <b>9 items</b> — 6 are protocol-eligible and can be delegated to the care team (est. 14 minutes returned). 3 need you: two results reviews and one thank-you note worth reading. 💛",
    actions:[{ label:"Open inbox", go:{ role:"clinician", view:"inbox" } }] },
  { match:/schedul|book|appointment|colonoscopy|flu/i,
    a:"I can help schedule what's due. For the colonoscopy there are 3 open slots (earliest Tue Jul 14, 7:30 AM); the flu vaccine is walk-in at the clinic pharmacy until 5 PM today.",
    actions:[{ label:"Schedule now", go:{ role:"patient", view:"plan" } }] },
  { match:/evidence|diet|olive|why/i,
    a:"The Mediterranean-diet advice rests on PREDIMED (NEJM 2018, RCT): ~30% reduction in major cardiovascular events with olive oil/nuts. <a class='pmid' href='https://pubmed.ncbi.nlm.nih.gov/29897866/' target='_blank' rel='noopener'>PMID 29897866</a> Every recommendation in LumaChart carries its citation — click any PMID to read the source." },
  { match:/plan|a&p|assessment/i,
    a:"Today's plan for Maria has 5 items, each with what/why/when/who — it exports as FHIR <b>CarePlan + Task</b> resources, and a patient-friendly translation is already live in her portal.",
    actions:[{ label:"View structured plan", go:{ role:"clinician", view:"chart" } }] },
  { match:/burnout|canary|tired|break/i,
    a:"Canary is watching your session privately. You can take a one-minute breathing break any time — evidence says it helps. Your after-hours trend is falling. 🐦",
    actions:[{ label:"Open Wellness Center", go:{ role:"clinician", view:"wellness" } }] },
  { match:/interoperab|physician health|together|synthesis|burden|reduce.*work|pajama/i,
    a:"Here's the thesis that ties it all together: <b>clinician-centered interoperability IS physician-health infrastructure.</b> Every USCDI feed that flows in — labs, meds, transitions of care, eligibility — is documentation the clinician doesn't re-type after dinner. The same lean, structured data also powers the public-health research layer. One architecture, the whole Quadruple Aim.",
    actions:[{ label:"Open Physician health × Interop", go:{ role:"clinician", view:"synthesis" } }] },
  { match:/fhir|onc|certif|hipaa|irb|compliance|roadmap/i,
    a:"The path to production runs through 4 gates: ONC §170.315 certification (FHIR R4 via Medplum/Aidbox), HIPAA security audit, IRB approval for research, and clinical validation of Canary. The Roadmap view tracks all Base-EHR criteria.",
    actions:[{ label:"Open roadmap", go:{ role:"clinician", view:"roadmap" } }] },
];
const ASSISTANT_FALLBACK = "I'm a scripted demo assistant — in production I'd be a certified decision-support intervention with full source-and-logic transparency (§170.315(b)(11)). Try asking about <i>what's due</i>, <i>my inbox</i>, <i>scheduling</i>, <i>the evidence</i>, the <i>roadmap</i>, or <i>physician health &amp; interoperability</i>.";

/* ---------- The synthesis: interoperability AS physician-health infrastructure ----------
   Each interoperable feed replaces documentation the clinician would otherwise
   re-enter by hand. Minute values are ILLUSTRATIVE demo estimates (not from the
   literature); the PMID supports the burnout DRIVER, not the specific minutes. */
const AH_BASELINE = 84;   // after-hours "pajama-time" minutes/day (Arndt: ~1.4 hr) — real
const AH_FLOOR = 18;      // irreducible minimum in this demo model

const INTEROP_RELIEF = [
  { cap:"Lab results", how:"Health Gorilla → US Core Observation", uscdi:"Laboratory",
    flows:"Results, reference ranges & trend history land pre-filed",
    saves:"Manual result entry and hunting across portals",
    mins:16, driver:"Inbox / results ≈ 24% of EHR time", ev:"arndt" },
  { cap:"Medications", how:"DrFirst → FHIR MedicationRequest / Dispense", uscdi:"Medications",
    flows:"Active meds, fill status, reconciliation candidates",
    saves:"Re-typing med lists and manual reconciliation",
    mins:12, driver:"Clerical order & med burden", ev:"arndt" },
  { cap:"Transitions of care", how:"C-CDA § 170.315(b)(1)", uscdi:"Multiple classes",
    flows:"Outside problems, meds, allergies and notes, structured",
    saves:"Re-charting from faxes and PDFs",
    mins:14, driver:'"Desktop medicine" re-entry', ev:"downing" },
  { cap:"Eligibility & coverage", how:"Stedi / Availity → US Core Coverage", uscdi:"Health Insurance Info",
    flows:"Insurance, benefits and prior-auth status",
    saves:"Manual coverage lookups and prior-auth chasing",
    mins:9, driver:"Regulatory / billing burden", ev:"downing" },
  { cap:"Real-time prescription benefit", how:"§ 170.315(b)(4) via e-Rx partner", uscdi:"—",
    flows:"Formulary and patient cost at the point of care",
    saves:"Pharmacy callbacks and prescription resubmissions",
    mins:7, driver:'After-hours "pajama time"', ev:"arndt" },
  { cap:"Immunizations", how:"State IIS registry → US Core Immunization", uscdi:"Immunizations",
    flows:"Full vaccine history from the state registry",
    saves:"Hunting vaccine records; avoiding duplicate doses",
    mins:5, driver:"Prevention gaps surfacing in the room", ev:"wright" },
];

const THREE_WINS = [
  { win:"Physician health", ic:"🩺", tone:"accent",
    d:"Every field that flows in is a field the clinician doesn't re-type after dinner. Interoperability is the burden-reduction lever — and Canary watches the after-hours trend fall." },
  { win:"Patient healthspan", ic:"✚", tone:"green",
    d:"Clean inbound labs, meds and immunizations mean prevention is accurate and nothing is missed in the room. The record organizes around staying well." },
  { win:"Public health", ic:"◫", tone:"amber",
    d:"The same lean, coded, structured data — consented and de-identified — becomes research-grade. Interoperability is what makes the learning health system possible." },
];
