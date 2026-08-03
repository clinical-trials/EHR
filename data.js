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
  kansagara:  { pmid:"22009101", cite:"Kansagara et al., JAMA 2011 (systematic review) — evaluating hospital-readmission risk-prediction models." },
  lace:       { pmid:"20194559", cite:"van Walraven et al., CMAJ 2010 — the LACE index predicts early death or unplanned readmission after discharge." },
  kangovi14:  { pmid:"24515422", cite:"Kangovi et al., JAMA Intern Med 2014 (RCT) — patient-centered community health worker support improved post-hospital outcomes." },
  kangovi18:  { pmid:"30422224", cite:"Kangovi et al., JAMA Intern Med 2018 (IMPaCT RCT) — CHW support improved chronic-disease control and reduced hospital days." },
  kangoviPool:{ pmid:"32643163", cite:"Kangovi et al., Health Serv Res 2020 (pooled analysis of 3 RCTs) — a standardized CHW intervention reduced hospitalization among disadvantaged patients." },
  projectRED: { pmid:"19189907", cite:"Jack et al., Ann Intern Med 2009 (Project RED RCT) — a reengineered hospital discharge reduced rehospitalization." },
  produceRx:  { pmid:"37641928", cite:"Hager et al., Circ Cardiovasc Qual Outcomes 2023 — produce-prescription programs improved diet, food security and cardiometabolic health." },
  collabCare: { pmid:"23076925", cite:"Archer et al., Cochrane 2012 — collaborative (stepped) care improves depression and anxiety outcomes." },
  amrSteward: { pmid:"28178770", cite:"Davey et al., Cochrane 2017 — antibiotic-stewardship interventions safely reduce unnecessary prescribing." },
  eyestrain:  { pmid:"40283833", cite:"Int J Environ Res Public Health 2025 — immediate effects of light vs dark mode on visual fatigue in tablet users (dark mode reduced visual fatigue)." },
  phq9:       { pmid:"11556941", cite:"Kroenke, Spitzer & Williams, J Gen Intern Med 2001 — the PHQ-9, a validated brief depression severity measure." },
  gad7:       { pmid:"16717171", cite:"Spitzer, Kroenke, Williams & Löwe, Arch Intern Med 2006 — the GAD-7, a validated brief generalized-anxiety measure." },
  bdi:        { pmid:"13688369", cite:"Beck, Ward, Mendelson, Mock & Erbaugh, Arch Gen Psychiatry 1961 — the original Beck Depression Inventory." },
  auditc:     { pmid:"9738608",  cite:"Bush et al., Arch Intern Med 1998 — the AUDIT-C, a brief screen for unhealthy alcohol use." },
  uspstfDep:  { pmid:"37338872", cite:"US Preventive Services Task Force, JAMA 2023 — Screening for Depression and Suicide Risk in Adults (Grade B)." },
  uspstfBreast:{pmid:"38687503", cite:"US Preventive Services Task Force, JAMA 2024 — Screening for Breast Cancer (Grade B)." },
  scExercise: { pmid:"26978184", cite:"Schuch et al., J Psychiatr Res 2016 (meta-analysis) — exercise is an effective treatment for depression." },
  scSleep:    { pmid:"26054060", cite:"Trauer et al., Ann Intern Med 2015 (meta-analysis) — cognitive behavioral therapy improves chronic insomnia." },
  scMind:     { pmid:"24395196", cite:"Goyal et al., JAMA Intern Med 2014 (meta-analysis) — meditation programs reduce anxiety, depression and stress." },
  scBA:       { pmid:"24936656", cite:"Ekers et al., PLoS One 2014 (meta-analysis) — behavioural activation is an effective treatment for depression." },
  scConnect:  { pmid:"20668659", cite:"Holt-Lunstad et al., PLoS Med 2010 (meta-analysis) — stronger social relationships are linked to better health and survival." },
  scAlcohol:  { pmid:"29476653", cite:"Kaner et al., Cochrane 2018 — brief interventions in primary care reduce unhealthy alcohol use." },
};

const SCHEDULE = [
  { time:"8:00",  initials:"MA", name:"Maria Alvarez",   age:58, sex:"F", reason:"Diabetes & BP follow-up",  status:"roomed",   preVisit:true  },
  { time:"8:30",  initials:"JT", name:"James Tran",      age:44, sex:"M", reason:"Annual health maintenance", status:"arrived", preVisit:true  },
  { time:"9:00",  initials:"DW", name:"Denise Whitfield",age:67, sex:"F", reason:"Knee pain, mobility",       status:"scheduled",preVisit:false },
  { time:"9:30",  initials:"RK", name:"Ravi Kapoor",     age:52, sex:"M", reason:"Lipid results review",      status:"scheduled",preVisit:true  },
  { time:"10:00", initials:"LN", name:"Linh Nguyen",     age:35, sex:"F", reason:"Postpartum visit",          status:"scheduled",preVisit:true  },
  { time:"10:30", initials:"EB", name:"Earl Bishop",     age:71, sex:"M", reason:"COPD action plan",          status:"scheduled",preVisit:false },
];

// Every message lands with staff first, is triaged, then earmarked into an AM or PM
// batch for the provider (interview: batch check-ins 2×/day, not 8×; urgent always breaks through).
const INBOX = [
  { cat:"Results", t:"CBC + CMP — Maria Alvarez",       d:"A1c 6.9% (was 7.4) — improving", urgent:false, delegable:false, batch:"AM", by:"M. Rivera, RN" },
  { cat:"Results", t:"Lipid panel — Ravi Kapoor",       d:"LDL 118, on-visit review today", urgent:false, delegable:false, batch:"AM", by:"M. Rivera, RN" },
  { cat:"Results", t:"TSH — Linh Nguyen",               d:"Within normal limits",           urgent:false, delegable:true,  batch:"AM", by:"M. Rivera, RN" },
  { cat:"Refill",  t:"Metformin 500 mg — M. Alvarez",   d:"Protocol-eligible renewal",      urgent:false, delegable:true,  batch:"PM", by:"J. Ortiz, PharmD" },
  { cat:"Refill",  t:"Lisinopril 10 mg — E. Bishop",    d:"Protocol-eligible renewal",      urgent:false, delegable:true,  batch:"PM", by:"J. Ortiz, PharmD" },
  { cat:"Refill",  t:"Albuterol HFA — E. Bishop",       d:"Protocol-eligible renewal",      urgent:false, delegable:true,  batch:"PM", by:"J. Ortiz, PharmD" },
  { cat:"Portal",  t:"Question about diet — M. Alvarez",d:"“Is olive oil really better?”",  urgent:false, delegable:true,  batch:"PM", by:"T. Begay, MA" },
  { cat:"Portal",  t:"Work note request — J. Tran",     d:"Template available",             urgent:false, delegable:true,  batch:"PM", by:"T. Begay, MA" },
  { cat:"Portal",  t:"Thank you 💛 — D. Whitfield",     d:"“You listened. Thank you.”",     urgent:false, delegable:false, gratitude:true, batch:"AM", by:"T. Begay, MA" },
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

/* ---------- USPSTF preventive care (Grade A/B recommendations) ----------
   Authoritative source: US Preventive Services Task Force. Each row is USPSTF's
   own published metadata; verified PubMed IDs attached where confirmed. */
const USPSTF_URL = "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation-topics";
const USPSTF_TOOLS_URL = "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation-topics/tools-and-resources-for-better-preventive-care";

// ctx for the demo patient (Maria Alvarez): 58F, T2DM + HTN, former smoker (quit 2019),
// postmenopausal, not pregnant. `applies` decides whether a rec surfaces for her.
const PATIENT_CTX = { age:58, sex:"F", pregnant:false, diabetes:true, htn:true, formerSmoker:true, postmenopausal:true };

// Embedded fallback used only if data/uspstf-ab.json can't be fetched (e.g. file://).
// The live app loads the JSON so new A/B recommendations flow in without code changes.
const USPSTF_FALLBACK = [
  { id:"depression", topic:"Depression & Suicide Risk in Adults", grade:"B", year:2023,
    pop:"Adults", cat:"Mental Health", ev:"uspstfDep", instrument:"phq9",
    clin:"Screen all adults; use a validated instrument and ensure systems for diagnosis, treatment and follow-up.",
    pt:"A quick, confidential check-in on mood — because feeling well mentally is part of staying well.",
    applies:c=>c.age>=18 },
  { id:"anxiety", topic:"Anxiety Disorders in Adults", grade:"B", year:2023,
    pop:"Adults ≤64", cat:"Mental Health", instrument:"gad7",
    clin:"Screen adults 64 and younger, including pregnant/postpartum, when systems for accurate diagnosis and care are in place.",
    pt:"A short questionnaire about worry and stress that you can complete privately.",
    applies:c=>c.age>=18 && c.age<=64 },
  { id:"statin", topic:"Statin Use for Primary Prevention of CVD", grade:"B", year:2022,
    pop:"Adults 40–75", cat:"Cardiovascular", ev:"sprint",
    clin:"Offer a statin to adults 40–75 with ≥1 CVD risk factor and an estimated 10-year risk ≥10% (Grade B).",
    pt:"A daily pill that lowers the chance of a heart attack or stroke — worth discussing given your numbers.",
    applies:c=>c.age>=40 && c.age<=75 && (c.diabetes||c.htn) },
  { id:"breast", topic:"Breast Cancer: Screening", grade:"B", year:2024,
    pop:"Women 40–74", cat:"Cancer", ev:"uspstfBreast",
    clin:"Biennial screening mammography for women 40–74 (Grade B).",
    pt:"A mammogram every 2 years — the best tool we have to catch breast cancer early.",
    applies:c=>c.sex==="F" && c.age>=40 && c.age<=74 },
  { id:"osteo", topic:"Osteoporosis to Prevent Fractures: Screening", grade:"B", year:2025,
    pop:"Women 65+ / postmenopausal at risk", cat:"Musculoskeletal",
    clin:"Screen women ≥65, and postmenopausal women <65 at increased fracture risk, with bone density testing.",
    pt:"A painless bone-density scan that helps prevent fractures as you age.",
    applies:c=>c.sex==="F" && (c.age>=65 || c.postmenopausal) },
  { id:"ipv", topic:"Intimate Partner Violence & Caregiver Abuse of Older/Vulnerable Adults: Screening", grade:"B", year:2025,
    pop:"Adolescents, Adults, Seniors", cat:"Mental Health / Safety",
    clin:"Screen women of reproductive age for IPV; provide or refer to support services.",
    pt:"A private, judgment-free check on your safety at home — you can always ask to speak alone.",
    applies:c=>c.sex==="F" && c.age>=18 },
  { id:"colorectal", topic:"Colorectal Cancer: Screening", grade:"A", year:2021,
    pop:"Adults 45–75", cat:"Cancer", ev:"uspstfCrc",
    clin:"Screen all adults 45–75 (Grade A 50–75, Grade B 45–49). Colonoscopy, FIT, or other approved modality.",
    pt:"Colon cancer screening — you're due; several easy options exist.",
    applies:c=>c.age>=45 && c.age<=75 },
  { id:"hypertension", topic:"Hypertension in Adults: Screening", grade:"A", year:2021,
    pop:"Adults 18+", cat:"Cardiovascular",
    clin:"Screen adults ≥18 with office BP, confirmed outside the clinical setting before diagnosis (Grade A).",
    pt:"Regular blood-pressure checks — you're already managing this well.",
    applies:c=>c.age>=18 },
  { id:"lung", topic:"Lung Cancer: Screening", grade:"B", year:2021,
    pop:"Adults 50–80, ≥20 pack-years", cat:"Cancer", risk:true,
    clin:"Annual low-dose CT for adults 50–80 with ≥20 pack-year history who smoke now or quit within 15 years.",
    pt:"If your past smoking qualifies, a yearly low-dose CT scan can catch lung cancer early.",
    applies:c=>c.age>=50 && c.age<=80 && c.formerSmoker },
  { id:"prediabetes", topic:"Prediabetes & Type 2 Diabetes: Screening", grade:"B", year:2021,
    pop:"Adults 35–70 w/ overweight", cat:"Metabolic",
    clin:"Screen adults 35–70 who are overweight/obese; offer or refer to preventive interventions (Grade B).",
    pt:"Blood-sugar monitoring — central to your care and already underway.",
    applies:c=>c.age>=35 && c.age<=70 },
  // Risk- or population-specific A/B recs (offered based on individual risk / life stage)
  { id:"prep", topic:"HIV Preexposure Prophylaxis (PrEP)", grade:"A", year:2023, pop:"Adolescents & adults at risk", cat:"Infectious Disease", risk:true,
    clin:"Offer PrEP to persons at increased risk of HIV acquisition (Grade A).", pt:"A medicine that prevents HIV, for anyone at risk.", applies:()=>false },
  { id:"tb", topic:"Latent Tuberculosis Infection in Adults: Screening", grade:"B", year:2023, pop:"At-risk adults", cat:"Infectious Disease", risk:true,
    clin:"Screen adults at increased risk for latent TB infection (Grade B).", pt:"A simple test if you have TB risk factors.", applies:()=>false },
  { id:"syphilis", topic:"Syphilis in Nonpregnant Adolescents & Adults: Screening", grade:"A", year:2022, pop:"At increased risk", cat:"Infectious Disease", risk:true,
    clin:"Screen persons at increased risk for syphilis infection (Grade A).", pt:"An STI screen recommended when there's increased risk.", applies:()=>false },
  { id:"chlamydia", topic:"Chlamydia & Gonorrhea: Screening", grade:"B", year:2021, pop:"Sexually active women at risk", cat:"Infectious Disease", risk:true,
    clin:"Screen sexually active women ≤24, and older women at increased risk (Grade B).", pt:"A routine STI screen when risk factors are present.", applies:()=>false },
  { id:"folic", topic:"Folic Acid to Prevent Neural Tube Defects", grade:"A", year:2023, pop:"Persons planning/capable of pregnancy", cat:"Perinatal", risk:true,
    clin:"Recommend 0.4–0.8 mg folic acid daily for those planning or capable of pregnancy (Grade A).", pt:"A daily vitamin before and during early pregnancy.", applies:c=>c.pregnant },
  { id:"aspirinpre", topic:"Aspirin to Prevent Preeclampsia", grade:"B", year:2021, pop:"Pregnant at risk", cat:"Perinatal", risk:true,
    clin:"Low-dose aspirin after 12 weeks for pregnant persons at high risk of preeclampsia (Grade B).", pt:"A low-dose aspirin in pregnancy if you're at higher risk.", applies:c=>c.pregnant },
];

/* ---------- Validated screening instruments (patient-facing, self-report) ----------
   PHQ-9 and GAD-7 are in the public domain (no permission required to reproduce).
   The BDI is © Aaron T. Beck / Pearson — reproduced here only as a STRUCTURE
   (construct labels + generic severity anchors + published score bands); a real
   deployment must license the true instrument. See `license` field. */
const SCALE_0_3 = ["Not at all (0)","Several days (1)","More than half the days (2)","Nearly every day (3)"];
const SCALE_SEV = ["None (0)","Mild (1)","Moderate (2)","Severe (3)"];

const INSTRUMENTS = {
  phq9:{
    name:"PHQ-9 · Depression", short:"PHQ-9", ev:"phq9", uspstf:"depression",
    intro:"Over the last 2 weeks, how often have you been bothered by any of the following problems?",
    scale:SCALE_0_3, safetyItem:8,
    items:[
      "Little interest or pleasure in doing things",
      "Feeling down, depressed, or hopeless",
      "Trouble falling or staying asleep, or sleeping too much",
      "Feeling tired or having little energy",
      "Poor appetite or overeating",
      "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
      "Trouble concentrating on things, such as reading the newspaper or watching television",
      "Moving or speaking so slowly that other people could have noticed — or being so fidgety or restless that you have been moving around a lot more than usual",
      "Thoughts that you would be better off dead, or of hurting yourself in some way",
    ],
    bands:[
      { max:4,  label:"Minimal", tone:"green" },
      { max:9,  label:"Mild", tone:"green" },
      { max:14, label:"Moderate", tone:"amber" },
      { max:19, label:"Moderately severe", tone:"amber" },
      { max:27, label:"Severe", tone:"red" },
    ],
  },
  gad7:{
    name:"GAD-7 · Anxiety", short:"GAD-7", ev:"gad7", uspstf:"anxiety",
    intro:"Over the last 2 weeks, how often have you been bothered by the following problems?",
    scale:SCALE_0_3,
    items:[
      "Feeling nervous, anxious, or on edge",
      "Not being able to stop or control worrying",
      "Worrying too much about different things",
      "Trouble relaxing",
      "Being so restless that it is hard to sit still",
      "Becoming easily annoyed or irritable",
      "Feeling afraid, as if something awful might happen",
    ],
    bands:[
      { max:4,  label:"Minimal", tone:"green" },
      { max:9,  label:"Mild", tone:"green" },
      { max:14, label:"Moderate", tone:"amber" },
      { max:21, label:"Severe", tone:"red" },
    ],
  },
  auditc:{
    name:"AUDIT-C · Alcohol use", short:"AUDIT-C", ev:"auditc", uspstf:"alcohol",
    intro:"Three quick, private questions about drinking over the past year — no judgment, just a way for your care team to support you.",
    itemScales:[
      ["Never (0)","Monthly or less (1)","2–4 times a month (2)","2–3 times a week (3)","4+ times a week (4)"],
      ["1 or 2 (0)","3 or 4 (1)","5 or 6 (2)","7 to 9 (3)","10 or more (4)"],
      ["Never (0)","Less than monthly (1)","Monthly (2)","Weekly (3)","Daily or almost daily (4)"],
    ],
    items:[
      "How often did you have a drink containing alcohol?",
      "How many standard drinks did you have on a typical day when you were drinking?",
      "How often did you have 6 or more drinks on one occasion?",
    ],
    bands:[
      { max:2,  label:"Lower risk", tone:"green" },
      { max:4,  label:"At-risk (≥3 for women, ≥4 for men)", tone:"amber" },
      { max:7,  label:"Increasing risk", tone:"amber" },
      { max:12, label:"Higher risk — worth a conversation", tone:"red" },
    ],
  },
};

/* ---------- Evidence-based self-care domains (all citations verified on PubMed) ----------
   Shown after a screening, targeted to the symptoms the patient endorsed most.
   These COMPLEMENT clinical care; they never replace it. */
const SELFCARE = {
  exercise:{ label:"Move a little every day", ic:"🚶", ev:"scExercise",
    tip:"Even a short daily walk measurably lifts mood. Start with 10 minutes and build up — motion is medicine." },
  sleep:{ label:"Protect your sleep", ic:"😴", ev:"scSleep",
    tip:"A steady wind-down and consistent sleep/wake times help. If sleep stays hard, ask about CBT for insomnia — it works." },
  mind:{ label:"A few mindful minutes", ic:"🫁", ev:"scMind",
    tip:"Brief daily breathing or meditation lowers anxiety and stress. Try one minute now; small doses add up." },
  ba:{ label:"Small steps toward what matters", ic:"🌱", ev:"scBA",
    tip:"Schedule one small, meaningful or pleasant activity each day — doing comes before feeling like it. This is behavioral activation." },
  connect:{ label:"Reach out — you're not alone", ic:"💬", ev:"scConnect",
    tip:"Connection protects health. Text one person you trust, or ask your care team about groups and support." },
  alcohol:{ label:"Cutting back, if you choose", ic:"🍃", ev:"scAlcohol",
    tip:"A brief conversation with your care team meaningfully helps many people drink less. Small changes count." },
};
// Which self-care domains an endorsed item points to, per instrument.
const SELFCARE_MAP = {
  phq9:{ 0:["ba","exercise"], 1:["connect","mind"], 2:["sleep"], 3:["exercise"], 4:["ba"], 5:["mind","connect"], 6:["mind"], 7:["exercise"], 8:[] },
  gad7:{ 0:["mind"], 1:["mind"], 2:["mind"], 3:["mind"], 4:["exercise"], 5:["sleep"], 6:["mind","connect"] },
  auditc:{ 0:["alcohol"], 1:["alcohol"], 2:["alcohol"] },
};

/* ---------- Revenue cycle: coding & claim ----------
   "State every condition — code it all or you get paid less." Complex patients
   carry several diagnoses; each needs an ICD-10 code. The agent suggests CPT
   codes for the visit; the clinician verifies/overrides; the biller submits to
   the clearinghouse. ICD-10-CM / CPT are factual code sets. */
const CODING = {
  demographics: {
    name:"Maria Alvarez", dob:"1968-03-14", sex:"F", mrn:"LC-0042-DEMO",
    address:"128 Calle Luna, San Juan, PR 00901",
    plan:"HealthFirst PPO", memberId:"HF-8842-0042", group:"GRP-5591",
    idUploaded:false,
  },
  // ICD-9 ↔ ICD-10 crosswalk (GEM-based; every ICD-9 code below verified against the
  // NLM ICD-9-CM database). The PR bridge maps to ICD-9 for payers still requiring it.
  icd9SourceUrl: "https://www.icd9data.com/2015/Volume1/default.htm",
  // Patient pre-loads these on the waiting-room iPad (confirm still-active).
  preloaded: [
    { icd:"E11.9",   icd9:"250.00", dx:"Type 2 diabetes mellitus without complications", active:true },
    { icd:"I10",     icd9:"401.9",  dx:"Essential (primary) hypertension", active:true },
    { icd:"E78.5",   icd9:"272.4",  dx:"Hyperlipidemia, unspecified", active:true },
    { icd:"E66.3",   icd9:"278.02", dx:"Overweight", active:true },
    { icd:"Z68.29",  icd9:"V85.25", dx:"Body mass index 29.0–29.9, adult", active:true },
    { icd:"Z87.891", icd9:"V15.82", dx:"Personal history of nicotine dependence", active:true },
    { icd:"Z79.84",  icd9:"V58.69", dx:"Long-term (current) use of oral hypoglycemic drugs", active:true },
    { icd:"Z79.899", icd9:"V58.69", dx:"Other long-term (current) drug therapy (statin)", active:true },
  ],
  // The clinician adds the last two, discussed today.
  discussed: [
    { icd:"R20.2",   icd9:"782.0",  dx:"Paresthesia of skin (nocturnal foot tingling)" },
    { icd:"Z12.11",  icd9:"V76.51", dx:"Encounter for screening for malignant neoplasm of colon" },
  ],
  // Agent-suggested CPT for the visit; provider verifies or overrides each.
  cpt: [
    { code:"99214", desc:"Established patient office visit, moderate complexity", why:"3 stable chronic illnesses + 1 new problem → moderate medical decision-making" },
    { code:"96127", desc:"Brief emotional/behavioral assessment ×2 (PHQ-9, GAD-7)", why:"Two validated screening instruments administered and scored" },
    { code:"36415", desc:"Collection of venous blood by venipuncture", why:"A1c and lipid panel drawn at visit" },
    { code:"G0121", desc:"Colorectal cancer screening; referral placed", why:"USPSTF Grade A screening — colonoscopy ordered" },
  ],
  meds: ["Metformin 500 mg BID","Lisinopril 20 mg daily","Atorvastatin 20 mg nightly"],
  clearinghouse: "HealthFirst PPO clearinghouse (837P professional claim)",
};

/* ---------- CME & licensure ----------
   Requirements vary by state and specialty and change often — the figures below
   are REPRESENTATIVE and must be confirmed with the licensing / specialty board.
   The catalog is a demonstration set of programs (not real course listings). */
const CME = {
  boardNote: "CME requirements vary by state and specialty and change often — these are representative figures. Always confirm with your state medical board and specialty board.",
  specialty: "Family Medicine (ABFM)",
  earnedBase: 22,        // credits already earned this renewal cycle
  cycleEndsDays: 96,     // days remaining in the current cycle
  boardMOC: "ABFM continuous certification — activity due 2027",
  requirements: [        // credits per cycle (years), representative
    { state:"Puerto Rico", credits:40, years:3 },
    { state:"California",  credits:50, years:2 },
    { state:"Florida",     credits:40, years:2 },
    { state:"Texas",       credits:48, years:2, note:"≥24 formal Category 1" },
    { state:"New York",    credits:0,  years:2, note:"No general hour requirement; specific topics (e.g., infection control) required." },
    { state:"Other / not listed", credits:50, years:2 },
  ],
  catalog: [
    { id:"cme-online-1", title:"Evidence-Based Primary Care Update", format:"Online · on-demand", provider:"ACCME-accredited online provider",
      credits:8, cost:0, location:"Anywhere", dates:"Self-paced", kind:"online", tag:"Free" },
    { id:"cme-online-2", title:"Diabetes & Cardiometabolic Care", format:"Online · live webinar", provider:"Accredited online",
      credits:6, cost:99, location:"Virtual", dates:"Aug 20", kind:"online", tag:"Online" },
    { id:"cme-local-1", title:"Regional Family Medicine Conference", format:"Live · local", provider:"State AFP chapter",
      credits:14, cost:295, location:"San Juan, PR", dates:"Sep 12–13", kind:"local", tag:"Local · no travel" },
    { id:"cme-dest-1", title:"Coastal CME Retreat: Primary Care by the Sea", format:"Destination · restorative", provider:"Accredited",
      credits:20, cost:850, location:"Rincón, PR", dates:"Oct 6–10", kind:"destination", tag:"Restorative · family-friendly" },
    { id:"cme-dest-2", title:"Mountain Wellness & Medicine", format:"Destination · cost-effective", provider:"Accredited",
      credits:18, cost:720, location:"Asheville, NC", dates:"Nov 3–6", kind:"destination", tag:"Cost-effective" },
  ],
};

/* ---------- AMA Joy in Medicine — organizational well-being (Chief Wellness Officer) ----------
   Summarized from the AMA Joy in Medicine Health System Recognition Program. EHR8 =
   total EHR time per 8 hours of scheduled patient time; WOW8 = "Work Outside of Work"
   per 8 hours scheduled. Specialty figures are the AMA methodology's example values. */
const AMA = {
  program: "AMA Joy in Medicine™ Health System Recognition Program",
  sourceUrl: "https://www.ama-assn.org/system/files/joy-in-medicine-guidelines.pdf",
  tiers: ["Bronze","Silver","Gold"],
  currentTier: "Silver",
  nextTierNeeds: "Sustained EHR8/WOW8 reduction + documented action in all competencies earns Gold.",
  cwo: { title:"Chief Wellness Officer / Director, Resiliency Center", reportsTo:"SVP & Chief Medical Officer" },
  // application context (org-level; the program is applied for on behalf of a health system)
  orgName: "Luma Health System",
  orgHQ: "San Juan, PR",
  contact: "Dr. A. Chen, Chief Wellness Officer",
  applyingFor: "Silver",
  assessmentTool: "AMA Organizational Biopsy (no-cost) — physician well-being survey",
  assessmentDate: "2025-11",
  // The program's "8" metrics: minutes per 8 hours of SCHEDULED patient time (not clock time),
  // normalized for part-time FTE. EHR8 total EHR time · WOW8 Work Outside of Work · IB-Time8 inbox.
  // IB-Time8 shown here is illustrative (~24% of EHR8; Arndt, inbox share of EHR time).
  metrics: [
    { specialty:"Internal Medicine", n:78, ehr8:134, wow8:87, ibt8:32 },
    { specialty:"OB-GYN",            n:32, ehr8:178, wow8:65, ibt8:43 },
    { specialty:"Cardiology",        n:30, ehr8:78,  wow8:34, ibt8:19 },
    { specialty:"Surgery",           n:67, ehr8:65,  wow8:21, ibt8:16 },
  ],
  // Six recognition domains — must meet 5 of 6. Evidence auto-drawn from LumaChart.
  domains: [
    { key:"Assessment", met:true,  evidence:"Physician well-being measured within 3 years (validated MBI/ProQOL self-checks + AMA Organizational Biopsy)." },
    { key:"Commitment", met:true,  evidence:"Leadership named clinician well-being a system priority; well-being metrics reviewed at the C-suite/Board." },
    { key:"Efficiency of Practice Environment", met:true, evidence:"EHR8, WOW8 and IB-Time8 measured and actively reduced (lean notes decoupled from billing, team delegation, Canary)." },
    { key:"Leadership", met:true,  evidence:"Chief Wellness Officer with a direct reporting line to SVP & CMO." },
    { key:"Teamwork",   met:true,  evidence:"Team-based 'care choreography' — shared inbox, standing orders, scribe-assisted documentation." },
    { key:"Support",    met:false, evidence:"Wellness Center + peer support in place; formal peer-support program build in progress." },
  ],
  // Evidence trail: the program credits EXECUTED interventions only. Each links a
  // metric/domain to a concrete action.
  interventions: [
    { t:"Lean clinical notes decoupled from billing", domain:"Efficiency of Practice Environment", metric:"EHR8", status:"executed", impact:"Notes ~38% shorter than the national average" },
    { t:"Inbox pooling & protocol-based delegation", domain:"Efficiency of Practice Environment", metric:"IB-Time8", status:"executed", impact:"Protocol items routed off the physician inbox" },
    { t:"Team documentation (APEX-style) & scribes", domain:"Teamwork", metric:"WOW8", status:"executed", impact:"Cuts after-hours 'pajama time'" },
    { t:"Canary private after-hours monitoring & nudges", domain:"Assessment", metric:"WOW8", status:"executed", impact:"De-identified early warning; never used for productivity" },
    { t:"Annual well-being assessment (Organizational Biopsy)", domain:"Assessment", metric:"—", status:"executed", impact:"Meets the within-3-years assessment entry criterion" },
    { t:"Formal peer-support program", domain:"Support", metric:"—", status:"planned", key:"support", impact:"Executing this completes the Support domain (6 of 6)" },
  ],
};

/* ---------- Enterprise integration & nationwide record exchange ----------
   One longitudinal record across every care setting, one portal, and query/
   retrieve to virtually any site nationwide via TEFCA. Standards are factual. */
const ENTERPRISE = {
  settings: [
    { t:"Outpatient / ambulatory", std:"FHIR R4 + US Core", status:"proto",   note:"the clinic workflow built today" },
    { t:"Inpatient",               std:"HL7 v2 ADT / ORM / ORU", status:"plan", note:"admit-discharge-transfer, orders, results, flowsheets" },
    { t:"Emergency department",    std:"HL7 v2 + FHIR Encounter", status:"plan", note:"" },
    { t:"Pharmacy / eMAR",         std:"NCPDP SCRIPT",           status:"partner", note:"DrFirst / MDToolbox" },
    { t:"Laboratory",              std:"HL7 v2 ORU / FHIR Observation", status:"partner", note:"Health Gorilla network" },
    { t:"Imaging",                 std:"DICOM + FHIR ImagingStudy", status:"plan", note:"" },
  ],
  engine: [
    { t:"HL7 v2 interfaces", d:"ADT, orders (ORM/OMG), results (ORU), scheduling (SIU) through an interface engine (Mirth/Rhapsody-class)" },
    { t:"FHIR R4 APIs", d:"US Core, SMART App Launch, Bulk Data — the §170.315(g)(10) surface" },
    { t:"X12 EDI (billing)", d:"837 claims, 835 remittance, 270/271 eligibility, 278 prior auth — the revenue cycle you already build" },
    { t:"IHE profiles", d:"XCPD / XCA / XDS.b for cross-community patient discovery & document exchange" },
    { t:"Enterprise Master Patient Index", d:"one patient identity across every setting and every site" },
  ],
  exchange: [
    { t:"TEFCA / QHIN", d:"Connect once to a Qualified Health Information Network — the national on-ramp to virtually any participating site." },
    { t:"Carequality", d:"Query-based document exchange framework (converging under TEFCA)." },
    { t:"CommonWell Health Alliance", d:"Record locator + retrieval across members." },
    { t:"eHealth Exchange", d:"Large federal + private query network." },
    { t:"Direct secure messaging", d:"Push transitions-of-care documents point to point (§170.315(h)(1))." },
  ],
  scheduling: "Enterprise scheduling across settings on FHIR Appointment / Schedule / Slot + HL7 v2 SIU — ties directly into the iPad check-in.",
  portal: "One patient portal spanning every setting: view-download-transmit, secure messaging, patient-reported data, and SMART-on-FHIR patient apps (incl. Apple / Google Health).",
};

/* ---------- Competitive positioning ----------
   Vendor market positions are approximate, factual industry facts. LumaChart's
   differentiator: evidence-based research in the record, not just AI on top. */
const COMPETE = {
  thesis: "LumaChart's idea isn't \"add AI to the EHR.\" It's add evidence-based research to the EHR — every recommendation carries its citation, every screen is a validated instrument, prevention is USPSTF-graded, and consented data feeds a learning health system.",
  rows: [
    { v:"Epic", market:"Large health systems, academic centers", standout:"Deep integrated enterprise suite, the MyChart patient portal, and a broad app ecosystem.", take:"Match the integrated enterprise + portal — but organize the record around health and evidence, not billing." },
    { v:"Oracle Health (Cerner)", market:"Hospitals, government (VA, DoD)", standout:"Enterprise scale and large-scale interoperability; major government deployments.", take:"Interoperate at scale via TEFCA — and make every decision-support intervention transparent and cited (§170.315(b)(11))." },
    { v:"athenahealth", market:"Ambulatory network, data analytics", standout:"A connected network sharing rules, knowledge and billing intelligence across all practices.", take:"Turn the network effect toward public health: consented, de-identified data → a learning health system, not just a billing engine." },
    { v:"eClinicalWorks", market:"Private practices, community health centers", standout:"Affordable full-featured ambulatory suite with patient engagement and an AI scribe.", take:"Add an evidence layer to the scribe/assistant — outputs link to their source, and screening is validated." },
    { v:"NextGen Healthcare", market:"Specialty practices, FQHCs", standout:"Configurable specialty content and population-health / FQHC tooling.", take:"Ship USPSTF-graded prevention + SDOH + validated instruments as the content, evidence-linked by default." },
    { v:"MEDITECH", market:"Community hospitals", standout:"Broad hospital functionality (Expanse) at a lower price point.", take:"Cost-effective breadth on an open FHIR core — plus a well-being layer the incumbents don't have." },
    { v:"TruBridge (CPSI / Evident)", market:"Rural & critical-access hospitals", standout:"Focus on rural / critical-access hospitals plus revenue-cycle services.", take:"Serve the under-resourced too — the Puerto Rico clearinghouse bridge + an agent-assisted revenue cycle." },
    { v:"Veradigm (Allscripts)", market:"Independent ambulatory practices", standout:"A data & analytics business built on real-world evidence from de-identified records.", take:"Do research with consent and transparency, for public benefit — the patient opts in and can see the studies." },
    { v:"Practice Fusion", market:"Independent physicians, small practices", standout:"Low-cost, cloud, fast onboarding for small practices.", take:"Low barrier to start, cloud-native — with evidence-based care built in from day one, not bolted on." },
    { v:"DrChrono", market:"Solo & very small practices", standout:"iPad-native, mobile-first; patient check-in on a tablet.", take:"We built the iPad check-in — and made it pre-load the chart, the claim, and evidence-based prevention." },
  ],
};

/* ---------- Helix Hub — the vetted app store for the health record ----------
   A secondary market: developers publish SMART-on-FHIR apps/APIs; LumaChart
   vets each for safety + HIPAA before listing. App entries are illustrative. */
const HELIX = {
  brand: "Helix Hub",
  tagline: "The vetted app store for the health record.",
  model: "Developers publish SMART-on-FHIR apps and APIs; LumaChart vets each for clinical safety and HIPAA compliance before it is listed. Open-source ideas from the community, hardened into trustworthy health-IT — a secondary market built on top of the record.",
  vetting: [
    { t:"Safety review", d:"Clinical-safety assessment against the ONC SAFER practices." },
    { t:"HIPAA & security", d:"Signed BAA, encryption, least-privilege scopes, independent security review." },
    { t:"SMART on FHIR conformance", d:"Standards-based launch & scopes (§170.315(g)(10)) — no proprietary lock-in." },
    { t:"Source & data review", d:"Open-source provenance checked; data flows disclosed; DSI transparency where AI is used." },
  ],
  apps: [
    { name:"OpenPrecision Genomics", dev:"Community · MIT", cat:"Genomics", price:"Free", oss:true, desc:"Visualize genomic risk on the chart with pharmacogenomic alerts.", scopes:"patient/*.read" },
    { name:"CommunityRx SDOH", dev:"OpenSDOH", cat:"Social needs", price:"Free", oss:true, desc:"Screen social needs and refer to local resources." },
    { name:"EyeScreen Retina AI", dev:"RetinaLabs", cat:"AI screening", price:"$", oss:false, desc:"Diabetic-retinopathy screening from fundus photos (DSI-transparent)." },
    { name:"MedRec Reconcile", dev:"Community · Apache-2", cat:"Medications", price:"Free", oss:true, desc:"Open-source medication reconciliation with interaction checks." },
    { name:"CardioRisk (ASCVD)", dev:"HeartMath OSS", cat:"Calculators", price:"Free", oss:true, desc:"Evidence-based 10-year cardiovascular risk, fully cited." },
    { name:"VaxBridge IIS", dev:"PublicHealth.io", cat:"Public health", price:"Free", oss:true, desc:"Two-way immunization-registry (IIS) connector." },
    { name:"OpenNotes Companion", dev:"Community", cat:"Patient engagement", price:"Free", oss:true, desc:"Plain-language explanations of visit notes for patients." },
    { name:"Scribe Assist (ambient)", dev:"NoteAI", cat:"Documentation", price:"$$", oss:false, desc:"Ambient note drafting; outputs link to source (DSI-transparent)." },
  ],
};

/* ---------- Framingham-modeled consent + registration documents ---------- */
const FRAMINGHAM = {
  note: "Modeled on the Framingham Heart Study — 78 years of consented, multi-generational cohort research. Consent is informed, tiered, revocable, and stewarded for the long term.",
  url: "https://www.framinghamheartstudy.org/fhs-for-researchers/",
  tiers: [
    { t:"Core health data", d:"Diagnoses, labs, vitals, prevention — de-identified for research.", on:true },
    { t:"Genetic & biospecimen", d:"Optional: contribute genetic data / biospecimens under separate explicit consent.", on:false },
    { t:"Re-contact for future studies", d:"Optional: let researchers invite you to studies you can always decline.", on:false },
    { t:"Long-term stewardship", d:"Your data supports longitudinal research across years — revoke any time.", on:true },
  ],
};
const REGDOCS = [
  { t:"IRB approval letter", d:"Institutional Review Board authorization for the active protocol.", status:"on file", url:"https://www.hhs.gov/ohrp/", src:"OHRP" },
  { t:"FDA registration letter", d:"IRB / IND / IDE registration acknowledgment where FDA-regulated (drugs, devices).", status:"placeholder", url:"https://www.fda.gov/about-fda/cder-offices-and-divisions/institutional-review-boards-irbs-and-protection-human-subjects-clinical-trials", src:"FDA" },
  { t:"Federalwide Assurance (FWA)", d:"OHRP assurance for the protection of human subjects — the institutional unlock for federally-regulated research.", status:"on file", url:"https://www.hhs.gov/ohrp/register-irbs-and-obtain-fwas/index.html", src:"OHRP" },
  { t:"Data Use Agreement (DUA)", d:"Terms governing de-identified data access.", status:"on file" },
];

/* ---------- IRB of record (realistic options) ----------
   Human-subjects research needs IRB oversight. Institutions review under a
   Federalwide Assurance (FWA) with OHRP; independent/commercial IRBs (e.g.,
   BRANY, WCG, Advarra) are common, especially as the single IRB for multi-site
   studies. Factual concepts; URLs point to OHRP. */
const IRB = {
  fwa: "FWA00006790",   // illustrative Federalwide Assurance number
  options: [
    { id:"institutional", name:"Institutional IRB", d:"Your organization's own board, operating under a Federalwide Assurance (FWA) registered with OHRP.", turnaround:"4–8 weeks" },
    { id:"central", name:"Commercial / central IRB", d:"An independent IRB (e.g., BRANY, WCG, Advarra). Often faster, and serves as the single IRB (sIRB) for multi-site studies.", turnaround:"1–3 weeks" },
  ],
  note: "NIH-funded multi-site human-subjects research generally requires a single IRB of record. Many IRB options exist — your institution's own board, or a commercial/central IRB such as BRANY, WCG, or Advarra.",
  ohrpUrl: "https://www.hhs.gov/ohrp/register-irbs-and-obtain-fwas/index.html",
};

/* ---------- Research directory (real, publicly-funded projects) ----------
   Shown to illustrate the equity / precision-medicine research the consented
   public-health layer is designed to support. These teams do NOT use this
   prototype; titles are public and attributed to their institutions. */
const RESEARCH_PROJECTS = [
  { pi:"Deborah Adeyemi", org:"UC San Francisco", t:"Characterizing variation in postpartum readmission risk among Black women using intersectional and Bayesian approaches" },
  { pi:"Isaac Bouchard", org:"UC San Diego", t:"Chronic-disease disparities via representative generative AI and culturally responsive, whole-person precision-medicine tools" },
  { pi:"Fanying Chen", org:"UC Irvine", t:"PROACTIVE — patient-reported-outcome- and AI-informed proactive screening to reduce disparities in a majority-minority cancer population" },
  { pi:"Tracy Chidyausiku", org:"Stanford University", t:"Integrating citizen-generated lived-experience data with EHRs for representative precision diabetes prevention in low-income older adults" },
  { pi:"Amber Keith", org:"UC Riverside", t:"Data-driven immune biomarkers to diagnose and prevent pancreatic cancer in African Americans" },
  { pi:"Nikita Mohapatra", org:"UC Davis", t:"How cumulative social and environmental stress shapes recovery after traumatic brain injury" },
  { pi:"Joseph Morrison", org:"UC Davis", t:"After the Break — X-rays and machine learning to catch bone-healing problems sooner" },
  { pi:"Sima Naderi", org:"UC San Francisco", t:"Improving cervical-cancer prevention and screening through precision medicine for Afghan adolescent girls and women in California" },
  { pi:"Sujin Park", org:"UC San Diego", t:"Precision-fMRI-guided biomarkers of Tourette syndrome in youth" },
  { pi:"Nanase Toda", org:"UC San Francisco", t:"Contributors to drug-induced angioedema via genomics, transcriptomics, and social determinants" },
  { pi:"Julia Ellen Trudeau", org:"UC Irvine", t:"PRECISION-COG — precision biomarkers of cancer-related cognitive impairment in racially/ethnically diverse breast-cancer patients" },
];

/* ---------- Security, SAFER, cloud vs local, readiness, contracts ----------
   Summarized from ONC/ASTP healthit.gov guidance (SAFER Guides; API privacy &
   security; "EHR Contracts Untangled"). Sources listed in each view. */
const TRUST = {
  hipaa: [
    { t:"Encryption", d:"PHI encrypted in transit (TLS) and at rest." },
    { t:"Access control (RBAC)", d:"Least-privilege roles; unique user IDs." },
    { t:"Multi-factor authentication", d:"MFA for clinician and admin access." },
    { t:"Audit trails & Provenance", d:"Every access and change logged and attributable." },
    { t:"Automatic time-out", d:"Sessions lock after inactivity (Canary already models session awareness)." },
    { t:"Break-the-glass", d:"Emergency access with heightened logging." },
    { t:"Business Associate Agreement", d:"Signed BAA with every vendor touching PHI." },
    { t:"Breach response", d:"Documented detection, notification (HIPAA Breach Rule), and remediation plan." },
  ],
  saferGuides: [
    "High Priority Practices", "Organizational Responsibilities",
    "Contingency Planning", "System Configuration", "System Interfaces",
    "Patient Identification", "CPOE with Decision Support",
    "Test Results Reporting & Follow-up", "Clinician Communication",
  ],
  saferHighPriority: [
    "Reliable test-result reporting with tracked follow-up (no result falls through the cracks)",
    "Accurate patient identification to prevent wrong-patient errors",
    "Safe CPOE with active drug-drug / drug-allergy decision support",
    "Downtime & contingency plans so care continues if the system is unavailable",
    "Feedback & reporting channels for clinicians to flag EHR safety hazards",
  ],
  saferUrl: "https://www.healthit.gov/topic/safety/safer-guides",
  apiPrivacyUrl: "https://www.healthit.gov/sites/default/files/page/2021-04/Privacy-and-Security-Guide.pdf",
  cloud: {
    benefits: ["Lower upfront hardware & software cost","Lower ongoing maintenance","Start small, scale IT as you grow","Higher service availability than in-house IT","Fewer run-time failures (freezes, slowness)"],
    challenges: ["Data-security responsibility is shared with the vendor","Less direct data access/control than local hosting"],
  },
  local: {
    benefits: ["Less dependence on high-speed internet","No outside org holds your patients' data"],
    challenges: ["You secure the servers physically","You run regular backups","You buy & maintain the equipment"],
  },
  readiness: [
    { k:"Readiness", q:"Our organization is ready to change workflows for an EHR." },
    { k:"Personnel eagerness", q:"Our staff are eager (not resistant) to adopt new tools." },
    { k:"A champion", q:"We have someone to champion the rollout day-to-day." },
    { k:"Stakeholder buy-in", q:"Leaders and clinicians see the EHR as genuinely useful." },
    { k:"Teamwork", q:"We work well as a team through change." },
  ],
  contractsUrl: "https://www.healthit.gov/sites/default/files/2025-03/EHR_Contracts_Untangled.pdf",
  contracts: [
    { t:"Service level agreement (SLA)", d:"Uptime %, support response times, and remedies in writing." },
    { t:"Data ownership & export", d:"You own your data; guaranteed export in standard formats (EHI export / FHIR) at any time and at exit." },
    { t:"Business Associate Agreement", d:"HIPAA BAA covering the vendor and its subcontractors." },
    { t:"Security & breach obligations", d:"Vendor's safeguards, breach-notification timelines, and audit rights." },
    { t:"Pricing & fees", d:"All-in pricing: implementation, interfaces, support, and any per-transaction fees named up front." },
    { t:"Interoperability & no information-blocking", d:"Standards-based interfaces; no practices that would constitute information blocking." },
    { t:"Termination & transition", d:"Exit terms, data migration assistance, and no hostage data." },
  ],
};

/* ---------- Broader healthcare ecosystem: payers · labs · telehealth ---------- */
const ECOSYSTEM = {
  payers: [
    { t:"Real-time eligibility & benefits", d:"Instant coverage, copay and deductible at check-in — no phone calls.", std:"X12 270/271 · FHIR CoverageEligibility" },
    { t:"Electronic prior authorization", d:"Auto-filled from the chart and submitted in seconds; most approvals return same-day.", std:"Da Vinci CRD · DTR · PAS" },
    { t:"Payer ↔ provider data sharing", d:"Pull the plan's record — claims history and gaps in care — into the chart; close quality gaps together.", std:"Da Vinci PDex · USCDI" },
    { t:"Clean-claim submission", d:"The coded claim goes straight to the plan's clearinghouse — fewer denials, faster payment.", std:"X12 837P" },
  ],
  labs: {
    network: "Health Gorilla national lab network + direct genetics-lab connections",
    tests: [
      { id:"lab-brca",  name:"Hereditary cancer panel (BRCA1/2+)", kind:"Genetic",   tat:"10–14 days", lab:"National genetics lab",  cpt:"81432" },
      { id:"lab-pgx",   name:"Pharmacogenomics (CYP2D6 / CYP2C19)", kind:"Genetic",   tat:"7 days",     lab:"PGx reference lab",      cpt:"81418" },
      { id:"lab-ctdna", name:"Circulating tumor DNA (liquid biopsy)", kind:"Specialty", tat:"7–10 days", lab:"Oncology specialty lab", cpt:"81462" },
      { id:"lab-ana",   name:"Autoimmune ANA reflex panel", kind:"Specialty", tat:"3–5 days", lab:"Reference lab", cpt:"86038" },
    ],
  },
  telehealth: [
    { t:"On-demand urgent telehealth", d:"Connect patients to a licensed clinician 24/7, across state lines where permitted." },
    { t:"Specialist e-consults & video referrals", d:"Refer to specialty telehealth (derm, psych, genetic counseling) without a long wait." },
    { t:"Remote patient monitoring", d:"Home device data (BP, glucose, weight) streams into the chart for between-visit care." },
  ],
};

/* ---------- Unified care timeline (fragmentation → one record) ---------- */
const TIMELINE = [
  { date:"2026-07-01", setting:"Primary care", icon:"🩺", title:"Diabetes & BP follow-up — Dr. Chen", detail:"A1c 6.9 (↓ from 7.4), BP 132/81. Colonoscopy referral placed.", src:"LumaChart" },
  { date:"2026-06-18", setting:"Laboratory",   icon:"🧪", title:"A1c, lipid panel, CMP", detail:"Results filed automatically to the chart.", src:"Health Gorilla" },
  { date:"2026-05-02", setting:"Emergency Dept",icon:"🚑", title:"ED visit — chest pain, r/o ACS", detail:"Troponin negative; discharged. Summary reconciled into the record.", src:"Regional Hospital · C-CDA" },
  { date:"2026-04-15", setting:"Cardiology",   icon:"❤️", title:"Cardiology e-consult (telehealth)", detail:"Low ASCVD risk; statin continued. Note received.", src:"Telehealth network · FHIR" },
  { date:"2026-03-10", setting:"Pharmacy",     icon:"℞",  title:"Metformin & lisinopril refills", detail:"Fill status synced from the pharmacy.", src:"DrFirst" },
  { date:"2026-02-20", setting:"Imaging",      icon:"🎗️", title:"Screening mammogram — normal (BI-RADS 1)", detail:"Imaging report reconciled into the record.", src:"Imaging Center · C-CDA" },
  { date:"2025-11-08", setting:"Hospital",     icon:"🏥", title:"Inpatient — pneumonia, 3-day stay", detail:"Discharge summary + med changes reconciled on return to PCP.", src:"Regional Hospital · C-CDA" },
];

/* ---------- Luma Ambient — point-of-care documentation (demo simulation) ---------- */
const AMBIENT = {
  questions: [
    "Ask how the nocturnal foot tingling has changed since last visit",
    "Confirm statin adherence and any muscle aches",
    "Two-question mood check (PHQ-2): low interest, or feeling down?",
    "Confirm colonoscopy scheduling preference",
  ],
  note: "58F with T2DM and HTN, both improving. A1c 6.9 (from 7.4), BP 132/81 on lisinopril 20. Reports nocturnal foot tingling — monofilament exam normal today; will surveil. Discussed Mediterranean diet (patient-raised) and shared the evidence. Plan: continue current meds; colonoscopy referral placed; recheck A1c in 3 months.",
  icd: ["E11.9","I10","E78.5","R20.2","Z12.11"],
  cpt: ["99214","96127"],
};

/* ---------- Suggested delegation steps (interview: "VERY HELPFUL") ---------- */
const DELEGATION = [
  { item:"Metformin, lisinopril & albuterol renewals", to:"PharmD · standing order", how:"Pharmacist verifies labs and adherence, renews for 12 months; you co-sign one weekly summary instead of three tickets.", min:6 },
  { item:"Normal TSH — Linh Nguyen", to:"RN · result protocol", how:"RN releases the “normal, no change” letter. Anything out of range routes back to you automatically.", min:3 },
  { item:"Diet question — M. Alvarez", to:"RN / health coach", how:"Answered from the care-team playbook (Mediterranean-diet handout), with a dietitian visit offered.", min:4 },
  { item:"Work note — J. Tran", to:"Front desk", how:"Template note prepared for one-tap signature at checkout.", min:1 },
];

/* ---------- Clinic pacing — run on time, protect the afternoon ---------- */
const PACING = {
  status:"on time through visit 2 of 6", drift:"+4 min", onTimePct:86,
  defer: [
    { pt:"Maria Alvarez", item:"New knee pain (non-urgent) raised at the door", action:"Give it its own visit — Tue 2:10 open" },
    { pt:"Earl Bishop",   item:"Advance-care-planning conversation",            action:"Book a dedicated ACP visit (99497 — reimbursed time)" },
  ],
  exits: [
    "“That deserves its own visit so we can give it real time — let's book it before you leave.”",
    "Summarize the plan out loud — a spoken close signals the visit is wrapping up.",
    "Stand, hand over the after-visit summary, and schedule the follow-up in the room.",
  ],
};

/* ---------- CME suggested from the doctor's actual case mix ---------- */
const CME_CASEMIX = [
  { share:31, cond:"Type 2 diabetes",      topic:"Modern T2DM: GLP-1s, SGLT2 inhibitors & deprescribing", credits:3   },
  { share:24, cond:"Hypertension",         topic:"BP targets & intensive control in older adults",        credits:2   },
  { share:18, cond:"COPD",                 topic:"COPD action plans & inhaler technique coaching",        credits:2   },
  { share:12, cond:"Perinatal mood",       topic:"Postpartum depression: screening to first-line care",   credits:1.5 },
];

/* ---------- One route per task — the redundancy killer ---------- */
const ROUTES = {
  example:"Ravi Kapoor's lipid panel",
  before:["Result message to physician","Auto-email copy","Separate result note","Staff task to call patient"],
  after:"One actionable result. The chart view, the patient release and the staff call-back all hang off the same item — close it once and it is closed everywhere.",
};

/* ---------- Readmission predictive analytics (demo cohort) ----------
   Risk = validated clinical model (LACE) + social determinants. High/moderate
   risk triggers a community health worker follow-up — an RCT-proven intervention. */
const READMIT = {
  patients: [
    { name:"Earl Bishop", age:71, dx:"COPD exacerbation", lace:13, risk:"High", pct:38,
      clinical:["2 admissions in 6 months","COPD + heart failure","7 active medications"],
      social:["Lives alone","No reliable transport","Food insecurity"] },
    { name:"Denise Whitfield", age:67, dx:"Heart failure (EF 35%)", lace:11, risk:"High", pct:29,
      clinical:["ED visit 8 days ago","Diuretic adjustment","Renal impairment"],
      social:["Medication-cost concern","Lives alone"] },
    { name:"Maria Alvarez", age:58, dx:"Diabetes + hypertension", lace:8, risk:"Moderate", pct:17,
      clinical:["A1c improving","BP near goal"],
      social:["Strong family support","Stable housing"] },
    { name:"Ravi Kapoor", age:52, dx:"Post-MI", lace:6, risk:"Low", pct:9,
      clinical:["Stable","Enrolled in cardiac rehab"],
      social:["Employed, insured"] },
  ],
};

/* ---------- Practice revenue & analytics (demo figures) ---------- */
const ANALYTICS = {
  kpis: [
    { t:"Payments collected (MTD)", v:"$184,320", d:"+8% vs last month", tone:"green" },
    { t:"Clean-claim rate", v:"96.4%", d:"first-pass acceptance", tone:"green" },
    { t:"Denial rate", v:"4.1%", d:"down from 7.8% with agent-assisted coding", tone:"green" },
    { t:"Days in A/R", v:"29", d:"target < 35", tone:"green" },
  ],
  claims: { submitted:428, paid:391, pending:22, denied:15 },
  arAging: [ { b:"0–30", pct:62 }, { b:"31–60", pct:23 }, { b:"61–90", pct:9 }, { b:"90+", pct:6 } ],
  office: [ { t:"Visits (MTD)", v:"1,284" }, { t:"No-show rate", v:"6.2%" }, { t:"Avg reimbursement / visit", v:"$143" }, { t:"Prevention gaps closed", v:"312" } ],
  revenue12: [120,128,132,141,138,150,146,158,162,170,176,184], // $k/month collected
  automations: [
    { t:"Claim tracking", d:"Every claim is auto-tracked from submit → 835 remittance; exceptions surface as tasks." },
    { t:"Follow-up tasks", d:"Denials and no-shows auto-generate worklist tasks with an owner and due date." },
    { t:"Charting & intake", d:"iPad check-in pre-loads the chart; the agent drafts codes for one-tap sign-off." },
  ],
};

/* ---------- Patient digital payments (demo) ---------- */
const PAYMENTS = {
  balance: 42.00,
  methods: "Card, HSA/FSA, Apple Pay / Google Pay",
  statements: [
    { date:"Jul 2", desc:"Office visit 07/01 — patient responsibility after insurance", amt:42.00, status:"due" },
    { date:"May 8", desc:"Lab work — patient responsibility after insurance", amt:18.00, status:"paid" },
  ],
};

/* ---------- Plans & long-term value ----------
   Pricing MODEL only (free-to-start / trial / custom) — no fabricated dollar
   figures. Long-term value, not a feature checklist, is the buying decision. */
const PLANS = {
  tiers: [
    { name:"Solo", price:"$0", per:"free to start", for:"Solo & very small practices",
      feats:["Cloud EHR + patient portal","Evidence-based prevention & screening","Agent-assisted coding","Community support"], cta:"Start free" },
    { name:"Practice", price:"30-day", per:"free trial, then flexible per-provider pricing", for:"Small–mid practices", featured:true,
      feats:["Everything in Solo","Revenue analytics & reporting","Digital patient payments","Interoperability: labs, e-Rx, eligibility","Priority support"], cta:"Start free trial" },
    { name:"Enterprise", price:"Custom", per:"per site", for:"Health systems & hospitals",
      feats:["Everything in Practice","Inpatient + enterprise integration","TEFCA / QHIN nationwide exchange","CWO well-being suite","Dedicated success + signed BAA"], cta:"Talk to us" },
  ],
  value: [
    { t:"Free trial & flexible pricing", d:"$0 to start for small practices, a 30-day trial on Practice, and transparent per-provider pricing that scales with you — not a big up-front license." },
    { t:"Cloud-based access", d:"Secure access from any location, any device; no servers to buy or maintain — lower total cost of ownership over the life of the practice." },
    { t:"Compliance & security", d:"HIPAA-aligned by design: encryption in transit & at rest, audit trails, role-based access, MFA, and a signed Business Associate Agreement. (Formal SOC 2 + ONC certification are on the roadmap.)" },
    { t:"Future-ready technology", d:"Evidence-linked decision support, workflow automation, and revenue analytics that get more valuable as guidelines update and the consented research network grows." },
  ],
};
