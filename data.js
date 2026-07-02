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

const LONGEVITY = [
  { m:"Blood pressure", now:"132/81", target:"<130/80", pct:78, ev:"sprint" },
  { m:"A1c",            now:"6.9%",   target:"<7.0%",   pct:96, ev:null },
  { m:"LDL cholesterol",now:"96",     target:"<100",    pct:100,ev:null },
  { m:"Activity",       now:"95 min/wk", target:"150 min/wk", pct:63, ev:"activity" },
  { m:"Sleep",          now:"6.4 h",  target:"7–8 h",   pct:80, ev:null },
];

const PAJAMA_14D = [62,55,71,48,66,58,80,74,52,60,45,49,38,31]; // after-hours EHR minutes, last 14 days (demo)

const THANK_YOUS = [
  { from:"Denise W.", note:"You listened. Thank you for taking my knee seriously." },
  { from:"Earl B.",   note:"First doctor who explained my inhalers so I understood." },
  { from:"Linh N.",   note:"You made me feel safe through the whole pregnancy." },
];

const RESEARCH = {
  consented:12847, total:18203,
  studies:[
    { t:"Clinician workload signals & well-being", d:"Prospective cohort linking de-identified EHR event-log patterns (after-hours time, inbox load) to validated well-being measures — the linkage the National Academy of Medicine has called for.", n:"412 clinicians · 24 months", status:"Enrolling" },
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
