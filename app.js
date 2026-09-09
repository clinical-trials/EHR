/* ==========================================================================
   LumaChart prototype v2 — app logic
   Roles: clinician / patient / researcher · Themes: restore / classic / modern
   Canary early-warning engine · structured CarePlan · scheduling · roadmap ·
   customizable metrics · Luma assistant · clickable PMIDs · mobile-friendly
   ========================================================================== */

const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];

const store = {
  get(k, fallback){ try{ const v = localStorage.getItem("luma."+k); return v ? JSON.parse(v) : fallback; }catch(e){ return fallback; } },
  set(k, v){ try{ localStorage.setItem("luma."+k, JSON.stringify(v)); }catch(e){} },
};

const state = {
  role:"clinician", view:"dashboard",
  canary:{ sessionMin:0, snoozedUntil:0, fired:{} },
  scheduled: store.get("scheduled", {}),
  tasksDone: store.get("tasksDone", {}),
  metrics:   store.get("metrics", ["facetime","afterhrs","prevgaps"]),
  interop:   {},   // synthesis view toggles (in-memory; start all off = "legacy" state)
  screens:   store.get("screens", {}),   // completed patient-reported screening results
  activeInstrument: null,                // instrument currently being taken
  activeResult: null,                    // instrument result being shown
  wellness:  store.get("wellness", true),// well-being features on/off (provider preference)
  focus:     store.get("focus", false),  // Focus mode — minimal display for maximum concentration
  scribeOn:  store.get("scribeOn", true),// digital scribe on/off — the physician's call, per encounter
  fhirLog:   [],                         // real FHIR sandbox round-trips this session (resource, id, ms)
  burnoutSelf: store.get("burnoutSelf", {}), // single-item burnout measure: {baseline, followup}
  taskTimer: null,                       // ⏲ time-to-task measurement in progress {id, start, clicks} — session only
  taskResults: [],                       // ⏲ measured time-to-task results this session (real seconds + clicks)
  equityDept: "all",                     // CWO equity drill-down department (session only)
  gross:     store.get("gross", GROSS_SEED), // "kill a stupid task" nominations
  grossVoted: store.get("grossVoted", {}),
  buddy:     store.get("buddy", false),  // Battle Buddy peer-support opt-in
  practice:  store.get("practice", {}),  // own-your-practice startup checklist
  scribeSigned: false,                  // Luma Scribe draft note signed this session
  scribeSent:   false,                  // Scribe draft codes sent to Encounter & claim
  delegated: {},                         // delegation steps run this session (by index)
  checkin:   store.get("checkin", null), // patient iPad pre-visit intake
  claim:     { dxAdded:false, verified:{}, stage:"code" }, // encounter/claim workflow
  myrecord:  store.get("myrecord", { step:0 }),  // patient-mediated record request (right of access)
  deterDismissed: false,                 // deterioration early-warning alert acted/dismissed this session
  _idUploaded: false,
  cmeReqIdx: store.get("cmeReqIdx", 0),  // selected state requirement (default Puerto Rico)
  cmeBooked: store.get("cmeBooked", {}), // booked CME programs
  supportExecuted: store.get("supportExecuted", false), // AMA Support-domain intervention executed
  chwAssigned: store.get("chwAssigned", {}),            // readmission CHW follow-up assignments
  lang: store.get("lang", "en"),                        // patient-portal language (multilingual)
  labOrders: store.get("labOrders", {}),                // ecosystem specialty/genetic lab orders
  billPaid:  store.get("billPaid", false),   // patient digital payment
  irb:       store.get("irb", {}),           // research study IRB status: 'review' | 'approved'
  irbBoard:  store.get("irbBoard", "institutional"), // selected IRB of record
  helixInstalled: store.get("helixInstalled", {}),   // installed Helix Hub apps
  helixSuggestions: store.get("helixSuggestions", [  // clinician-requested tools / research questions
    { id:"seed1", type:"question", title:"Which post-discharge patients benefit most from CHW follow-up?", desc:"Stratify readmission risk against social needs to target community health workers.", votes:14, by:"Dr. Okafor, Hospitalist" },
    { id:"seed2", type:"tool", title:"One-tap sepsis + CURB-65 screen at triage", desc:"Auto-pull vitals and labs to flag sepsis and pneumonia severity in the ED.", votes:9, by:"Dr. Reyes, Emergency Medicine" },
    { id:"seed3", type:"question", title:"Does embedding a pharmacist speed A1c improvement?", desc:"Compare diabetic panels with vs. without a co-visiting pharmacist.", votes:7, by:"Dr. Chen, Internal Medicine" },
  ]),
  helixVoted: store.get("helixVoted", {}),            // suggestions this user has upvoted
  consentTiers: null,                                 // Framingham-modeled consent tiers (lazy-init)
  readiness: {},                             // implementation readiness self-assessment
};

/* ---------- evidence helpers — every PMID links straight to PubMed ---------- */
const pubmed = pmid => `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
const ev = key => {
  if (!key || !EVIDENCE[key]) return "";
  const e = EVIDENCE[key];
  return ` <a class="pmid" href="${pubmed(e.pmid)}" target="_blank" rel="noopener" title="${e.cite} — click to open on PubMed">PMID ${e.pmid}</a>`;
};
/* authority chips — cite official reports (SG Advisory, NAM, ONC, 25×5) like PMIDs */
const aut = key => {
  if (!key || !AUTHORITIES[key]) return "";
  const a = AUTHORITIES[key];
  return ` <a class="pmid" href="${a.url}" target="_blank" rel="noopener" title="${a.cite} — click to open the source">${a.label}</a>`;
};
/* regulatory-basis chips — cite the §170.315 criterion a feature satisfies, like a PMID */
const reg = (...keys) => keys.filter(k => REG170_MAP[k]).map(k => {
  const r = REG170_MAP[k];
  return ` <a class="reg" href="${REG170_URL}" target="_blank" rel="noopener" title="${r.code} — ${r.title} (45 CFR Part 170; click to open the regulation)">${r.code}</a>`;
}).join("");
const evidenceCard = key => {
  if (!key || !EVIDENCE[key]) return "";
  const e = EVIDENCE[key];
  return `<div class="evidence"><b>Why we recommend this:</b> ${e.cite}${ev(key)}</div>`;
};

/* ---------- USPSTF: dynamically loaded, refreshable ---------- */
let USPSTF = USPSTF_FALLBACK;
let USPSTF_META = { updated:null, source:"embedded fallback", sourceUrl:USPSTF_URL, toolsUrl:USPSTF_TOOLS_URL };

function matchRule(rule, c){
  if (!rule) return false;
  if (rule.risk) return false;                        // risk-based handled separately
  if (rule.sex && c.sex !== rule.sex) return false;
  if (rule.pregnant != null && c.pregnant !== rule.pregnant) return false;
  const ageOk = (rule.minAge == null || c.age >= rule.minAge) && (rule.maxAge == null || c.age <= rule.maxAge);
  if (!ageOk && !(rule.orPostmenopausal && c.postmenopausal)) return false;
  if (rule.requireAny && !rule.requireAny.some(k => c[k])) return false;
  if (rule.requireAll && !rule.requireAll.every(k => c[k])) return false;
  return true;
}
const recApplies = (r, c) => typeof r.applies === "function" ? r.applies(c) : matchRule(r.applies, c);
const isRiskRec = r => r.risk === true || (r.applies && typeof r.applies === "object" && r.applies.risk === true);

function uspstfApplicable(ctx){
  return {
    primary: USPSTF.filter(r => !isRiskRec(r) && recApplies(r, ctx)),
    risk:    USPSTF.filter(r => isRiskRec(r)),
  };
}
const gradeChip = g => `<span class="chip ${g==="A"?"green":"accent"}">Grade ${g}</span>`;

async function loadUSPSTF(announce){
  try{
    const res = await fetch("data/uspstf-ab.json", { cache:"no-store" });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    if (Array.isArray(data.recommendations) && data.recommendations.length){
      USPSTF = data.recommendations;
      USPSTF_META = { updated:data.updated, source:data.source, sourceUrl:data.sourceUrl||USPSTF_URL, toolsUrl:data.toolsUrl||USPSTF_TOOLS_URL };
      if (["chart","plan"].includes(state.view)) render();
      if (announce) toast("USPSTF recommendations synced", `Loaded ${USPSTF.length} Grade A/B recommendations (updated ${data.updated}). The EHR stays current as evidence changes.`, "green");
    }
  }catch(e){ if (announce) toast("Couldn't sync USPSTF", "Showing the embedded set. Live sync needs the app served over http.", "amber"); }
}

/* ==========================================================================
   THEME SWITCHING
   ========================================================================== */
$$(".theme-btn[data-themepick]").forEach(btn => btn.addEventListener("click", () => {
  document.documentElement.dataset.theme = btn.dataset.themepick;
  $$(".theme-btn[data-themepick]").forEach(b => b.classList.toggle("active", b === btn));
  if (btn.dataset.themepick !== "restore" && !state.canary.fired.themeNote) {
    state.canary.fired.themeNote = true;
    toast("Theme changed", `Restore Mode (low-glare dark) is LumaChart's default — dark mode reduced visual fatigue vs light mode in a 2025 study.${ev("eyestrain")} Switch back any time.`, "green");
  }
}));

/* ==========================================================================
   ROLES + NAVIGATION
   ========================================================================== */
const NAVS = {
  clinician: [
    { label:"Care", items:[
      { id:"dashboard", ic:"▦", t:"Today" },
      { id:"chart",     ic:"▤", t:"Patient chart" },
      { id:"scribe",   ic:"🎙️", t:"Luma Scribe", badge:() => state.scribeSigned ? null : 1 },
      { id:"inbox",     ic:"✉", t:"Inbox", badge:() => INBOX.length },
      { id:"readmit",   ic:"⤾", t:"Risk & early warning", badge:() => state.deterDismissed ? null : "!" },
      { id:"billing",   ic:"⛁", t:"Encounter & claim" },
      { id:"analytics", ic:"📊", t:"Revenue & analytics" },
    ]},
    { label:"Professional", items:[
      { id:"cme",       ic:"🎓", t:"CME & licensure", badge:() => cmeDueBadge() },
    ]},
    { label:"You", items:[
      { id:"wellness",  ic:"❦", t:"Wellness Center", ph:true },
      { id:"canary",    ic:"🐦", t:"Canary", ph:true },
    ]},
    { label:"Platform", items:[
      { id:"fhir",       ic:"⚡", t:"FHIR sandbox" },
      { id:"practice",   ic:"🏠", t:"Own your practice" },
      { id:"synthesis",  ic:"◎", t:"Physician health × Interop" },
      { id:"enterprise", ic:"🏛", t:"Enterprise & exchange" },
      { id:"ecosystem",  ic:"🔌", t:"Ecosystem connections" },
      { id:"helix",      ic:"🧬", t:"Helix Hub (app store)" },
      { id:"compete",    ic:"◆", t:"Best ideas, improved" },
      { id:"plans",      ic:"◈", t:"Plans & value" },
      { id:"cert",       ic:"📜", t:"Certification (Part 170)" },
      { id:"roadmap",    ic:"⛭", t:"Roadmap & gates" },
    ]},
    { label:"Trust & deploy", items:[
      { id:"security",   ic:"🔒", t:"Security & SAFER" },
      { id:"readiness",  ic:"✓", t:"Readiness & contracts" },
    ]},
  ],
  patient: [
    { label:"My health", items:[
      { id:"checkin",   ic:"▤", t:"Check-in" },
      { id:"home",      ic:"✚", t:"Healthspan home" },
      { id:"plan",      ic:"◷", t:"Prevention plan", badge:() => PREVENTION_PLAN.filter(p=>p.status==="due" && !state.scheduled[p.t]).length || null },
      { id:"screenings",ic:"✎", t:"Screenings & questionnaires" },
      { id:"payments",  ic:"💳", t:"Billing & payments" },
      { id:"myplan",    ic:"☑", t:"My care plan" },
      { id:"myrecord",  ic:"🔗", t:"My record" },
      { id:"longevity", ic:"↗", t:"Longevity tracker" },
      { id:"consent",   ic:"✔", t:"Research & consent" },
    ]},
    { label:"Community & mind", items:[
      { id:"community", ic:"🏘", t:"Community health" },
      { id:"mental",    ic:"🧠", t:"Mental health" },
    ]},
  ],
  researcher: [
    { label:"Public health", items:[
      { id:"console",   ic:"◫", t:"Research console" },
      { id:"systems",   ic:"🏛", t:"Systems & policy" },
      { id:"synthesis", ic:"◎", t:"Physician health × Interop" },
      { id:"roadmap",   ic:"⛭", t:"Roadmap & gates" },
    ]},
  ],
  cwo: [
    { label:"Well-being program", items:[
      { id:"joy",     ic:"🏅", t:"Joy in Medicine" },
      { id:"ehr8",    ic:"⏱", t:"EHR8 · WOW8 · Inbox" },
      { id:"burden",  ic:"🧪", t:"Burden lab" },
      { id:"actions", ic:"🎯", t:"Action plan" },
      { id:"report",  ic:"📄", t:"Data extract report" },
      { id:"biblio",  ic:"📚", t:"Bibliography" },
    ]},
  ],
};

$$(".role-btn").forEach(btn => btn.addEventListener("click", () => {
  state.role = btn.dataset.role;
  state.view = NAVS[state.role][0].items[0].id;
  $$(".role-btn").forEach(b => b.classList.toggle("active", b === btn));
  updateFocusUI();                 // Focus is clinician-only — leave/re-enter it with the role
  render();
}));

// Focus mode: the nav trims to today's clinical work — everything else is one toggle away.
const FOCUS_CORE = new Set(["dashboard","chart","scribe","inbox","billing"]);

function renderNav(){
  if (state.focus && state.role === "clinician"){
    // Focus: a quiet icon rail — five essentials, nothing else
    const core = NAVS.clinician.flatMap(g => g.items).filter(i => FOCUS_CORE.has(i.id));
    $("#sidenav").innerHTML = core.map(i => {
      const b = i.badge ? i.badge() : null;
      return `<button class="nav-item focus-ic ${state.view===i.id?"active":""}" data-nav="${i.id}" title="${i.t}" aria-label="${i.t}">
        <span class="ic">${i.ic}</span>${b ? `<span class="badge">${b}</span>` : ""}
      </button>`;
    }).join("");
  } else {
    $("#sidenav").innerHTML = NAVS[state.role].map(group => {
      const items = group.items.filter(i => !(i.ph && !state.wellness));   // hide well-being items when off
      if (!items.length) return "";
      return `<div class="nav-label">${group.label}</div>` + items.map(i => {
        const b = i.badge ? i.badge() : null;
        return `<button class="nav-item ${state.view===i.id?"active":""}" data-nav="${i.id}">
          <span class="ic">${i.ic}</span>${i.t}${b ? `<span class="badge">${b}</span>` : ""}
        </button>`;
      }).join("");
    }).join("");
  }
  $$("[data-nav]").forEach(b => b.addEventListener("click", () => { state.view = b.dataset.nav; render(); }));
}

/* ==========================================================================
   CLINICIAN VIEWS
   ========================================================================== */
function metricTile(m){
  return `<div class="rowitem"><div style="flex:1">
    <div class="t small">${m.t} — <span style="color:var(--${m.tone==="green"?"green":"amber"})">${m.v}</span></div>
    <div class="d">${m.d}</div>
    <div class="bar" style="margin-top:5px"><i class="${m.tone}" style="width:${m.bar}%"></i></div>
  </div></div>`;
}

/* --- point-of-care charting: fit EHR work between patients, not after hours --- */
function chartNowCard(){
  const open = state.scribeSigned ? 0 : 1;
  return `<div class="card">
    <h3><span class="spark">✍</span> Chart between patients ${open?`<span class="chip amber">${open} note open</span>`:`<span class="chip green">all caught up</span>`}</h3>
    ${open?`<div class="small">Maria Alvarez's draft note is ready — <b>~90 seconds</b> to review and sign while it's fresh.</div>
    <button class="btn primary small" style="margin-top:10px" data-nav-inline="scribe">Chart now → nothing left for tonight</button>`
    :`<div class="small muted">Every note signed. Tonight belongs to you.</div>`}
    <div class="evidence">Closing the note in the moment beats end-of-day catch-up — it's a healthy habit that prevents the "pajama time" that drives burnout.${ev("arndt")}</div>
  </div>`;
}

/* --- run-on-time coach: protect the schedule, defer what can wait --- */
function pacingCard(){
  return `<div class="card">
    <h3><span class="spark">⏱</span> Run on time <span class="chip green">${PACING.status}</span></h3>
    <div class="tiny" style="margin-bottom:8px">Drift ${PACING.drift} · ${PACING.onTimePct}% of your visits started on time this month. Late mornings snowball into late afternoons — for you <i>and</i> your patients.</div>
    <div class="rowlist">
      ${PACING.defer.map((d,i)=>`<div class="rowitem">
        <div style="flex:1"><div class="t small">${d.pt} — ${d.item}</div><div class="d">${d.action}</div></div>
        ${state.tasksDone["defer"+i]?`<span class="chip green">booked ✓</span>`:`<button class="btn ghost small" data-defer="${i}">Defer &amp; book</button>`}
      </div>`).join("")}
    </div>
    <details style="margin-top:8px"><summary class="small" style="cursor:pointer">Three graceful exits</summary>
      <ul class="small muted" style="margin:6px 0 0 18px">${PACING.exits.map(x=>`<li style="margin-bottom:4px">${x}</li>`).join("")}</ul>
    </details>
    <div class="tiny" style="margin-top:8px">Don't tackle everything in one visit — a booked follow-up is better care than a rushed add-on.</div>
    <div class="tiny" style="margin-top:8px; padding-top:8px; border-top:1px solid var(--line-strong)">⚖ Fairness: late-clinic load this month — you 22% · practice range 18–31% <span class="chip plain">synthetic demo</span><br>
    Fair distribution of late clinics and call is a well-being lever — schedules should be optimized for fairness, not just coverage.${aut("natPlan")}</div>
  </div>`;
}

function vDashboard(){
  const pinned = METRIC_LIBRARY.filter(m => state.metrics.includes(m.id));
  if (state.focus){
    // The dramatic minimal display — one patient, the single most important action,
    // and what's clinically due. Everything else is silence.
    const i = Math.max(SCHEDULE.findIndex(p => p.status === "roomed"), 0);
    const now = SCHEDULE[i], next = SCHEDULE[i+1];
    const due = PREVENTION_PLAN.filter(p => p.status === "due" && !state.scheduled[p.t]).map(p => p.t).slice(0,2);
    // Priority order for the doctor's next action: unsigned note first (the
    // chart-between-patients habit), then the chart of the patient in the room.
    const actions = state.scribeSigned
      ? `<button class="btn primary" data-nav-inline="chart">Open chart</button>`
      : `<button class="btn primary" data-nav-inline="scribe">Sign draft note · 90 s</button>
         <button class="btn ghost" data-nav-inline="chart">Open chart</button>`;
    return `
    <div class="focus-stage">
      <div class="focus-kicker">now seeing</div>
      <div class="focus-now">${now.name}</div>
      <div class="focus-meta">${now.time} · ${now.reason}</div>
      ${due.length ? `<div class="focus-due">due this visit — ${due.join(" · ")}</div>` : ""}
      <div class="focus-actions">${actions}</div>
      ${next ? `<div class="focus-next">next · ${next.time} — ${next.name}</div>` : ""}
      <div class="focus-status">${PACING.status} · inbox batch 12:15 pm · urgent always breaks through</div>
    </div>`;
  }
  return `
  <h1 class="page-title">Good morning, Dr. Chen</h1>
  <p class="page-sub">Thursday · 6 visits scheduled · your day is designed to end on time.</p>

  <div class="grid g23">
    <div class="card">
      <h3><span class="spark">▦</span> Today's schedule</h3>
      <div class="rowlist">
        ${SCHEDULE.map(p => `
          <div class="rowitem">
            <div class="avatar">${p.initials}</div>
            <div style="flex:1">
              <div class="t">${p.time} — ${p.name} <span class="tiny">(${p.age}${p.sex})</span></div>
              <div class="d">${p.reason} ${p.preVisit ? `· <span class="chip accent">pre-visit ✓</span>` : ""}</div>
            </div>
            <span class="chip ${p.status==="roomed"?"green":p.status==="arrived"?"amber":"plain"}">${p.status}</span>
          </div>`).join("")}
      </div>
      <div class="evidence">Pre-visit questionnaires flow patient concerns straight into your note — patients contributing to the record increases efficiency and engagement.${ev("mafi")}</div>
    </div>

    <div style="display:flex; flex-direction:column; gap:16px">
      <div class="card">
        <h3><span class="spark">🌙</span> After-hours EHR load</h3>
        <div class="metric"><div class="v">1.4 <span style="font-size:15px">hr/day</span></div><div class="l">national average "pajama time" in the EHR for primary care${ev("arndt")}</div></div>
        <div class="tiny" style="margin-top:8px">Your last 14 days: <b>${Math.round(PAJAMA_14D.reduce((a,b)=>a+b,0)/PAJAMA_14D.length)} min/day</b> average · yesterday <b>${PAJAMA_14D[PAJAMA_14D.length-1]} min</b> <span style="color:var(--green)">↓ trending down</span></div>
      </div>
      <div class="card">
        <h3><span class="spark">◈</span> Your pinned metrics
          <button class="btn ghost small" id="customize-metrics" style="margin-left:auto">⚙ Customize</button></h3>
        ${pinned.length ? pinned.map(metricTile).join("") : `<div class="small muted">No metrics pinned — hit Customize.</div>`}
        <div class="tiny" style="margin-top:8px">You choose what matters most — LumaChart adapts to your practice, not the reverse.</div>
      </div>
      ${state.wellness?`<div class="card">
        <h3><span class="spark">🐦</span> Canary</h3>
        <div id="canary-mini" class="small muted">Watching over your session…</div>
        <div class="tiny" style="margin-top:8px">Private to you. Never used for productivity review.</div>
        <button class="btn ghost small" style="margin-top:10px" data-nav-inline="canary">Open Canary panel →</button>
      </div>`:""}
    </div>
  </div>

  <div class="grid g2" style="margin-top:16px">
    ${chartNowCard()}
    ${pacingCard()}
  </div>`;
}

/* ==========================================================================
   LUMA SCRIBE — the encounter documents itself (demo simulation)
   ========================================================================== */
function vScribe(){
  const on = state.scribeOn;
  const head = `
  <h1 class="page-title">🎙️ Luma Scribe <span class="chip accent">demo simulation</span></h1>
  <p class="page-sub">The encounter documents itself: with the patient's consent, Scribe listens, drafts the note, suggests questions, and pre-codes the visit — so charting fits <b>between</b> patients. No homework. No after-hours catch-up.${ev("arndt")}</p>

  <div class="card" style="margin-bottom:16px">
    <h3><span class="spark">${on?"●":"○"}</span> This encounter — Maria Alvarez
      ${on?'<span class="chip green">scribe on · patient consented · 14 min</span>':'<span class="chip plain">scribe off — nothing captured</span>'}
      <button class="btn ${on?"ghost":"primary"} small" style="margin-left:auto" data-scribe-toggle>${on?"Turn scribe off":"Turn scribe on"}</button>
    </h3>
    <div class="tiny">The scribe is <b>your call, per encounter</b> — turn it on or off at any moment, and the patient consents at check-in. Audio is processed in the room and discarded; only the structured draft persists. A production version is a decision-support intervention under §170.315(b)(11), with full source &amp; logic transparency.</div>
  </div>`;
  if (!on) return head + `
  <div class="card">
    <h3>○ Scribe is off</h3>
    <div class="small muted">Nothing is being listened to or drafted. Prefer to chart by hand today, or seeing a patient who'd rather not be recorded? That's exactly what this switch is for. Turn it back on whenever you like — per visit, per room, per patient.</div>
  </div>`;
  return head + `
  <div class="grid g23">
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="card">
        <h3>✍ First-draft note ${state.scribeSigned?'<span class="chip green">signed ✓</span>':'<span class="chip amber">awaiting your review</span>'}</h3>
        <textarea id="scribe-note" class="scribe-note" rows="7" ${state.scribeSigned?"disabled":""}>${SCRIBE.note}</textarea>
        ${state.scribeSigned?'<div class="small muted" style="margin-top:8px">Signed and filed while it was fresh. Nothing left for tonight.</div>':`<button class="btn primary" style="margin-top:10px" data-scribe-sign>Review &amp; sign — ~90 seconds</button>`}
        <div class="evidence">Scribe writes the first pass; the physician stays the author. This is a <b>patient note — nothing else</b>: billing justification lives in the claim layer, so the doctor is never the data clerk.${ev("sinskyTM")}</div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="card">
        <h3>❓ Suggested questions</h3>
        <div class="rowlist">${SCRIBE.questions.map(q=>`<div class="rowitem"><span class="chip accent">ask</span><div class="d" style="flex:1">${q}</div></div>`).join("")}</div>
        <div class="tiny" style="margin-top:8px">Surfaced live from the conversation plus the chart — nothing gets missed while you stay face-to-face with the patient.</div>
      </div>
      <div class="card">
        <h3>⛁ Drafted codes ${state.scribeSent?'<span class="chip green">sent ✓</span>':""}</h3>
        <div class="small" style="margin-bottom:6px">ICD-10 ${SCRIBE.icd.map(c=>`<span class="chip plain">${c}</span>`).join(" ")}</div>
        <div class="small">CPT ${SCRIBE.cpt.map(c=>`<span class="chip plain">${c}</span>`).join(" ")}</div>
        ${state.scribeSent?`<div class="small muted" style="margin-top:8px">Queued in Encounter &amp; claim for one-tap verification.</div>`:`<button class="btn primary small" style="margin-top:10px" data-scribe-send>Send to Encounter &amp; claim →</button>`}
        <div class="tiny" style="margin-top:8px">Diagnosis and billing codes drop out of the visit itself — the revenue cycle starts complete instead of being reconstructed at 9 PM.</div>
      </div>
    </div>
  </div>`;
}

/* --- Wave 1: measurement-based care — scores drawn over time (Osmind-inspired) --- */
function sparkline(pts, max, w=190, h=46){
  if (!pts || !pts.length) return "";
  const xs = pts.map((p,i)=> pts.length===1 ? w/2 : 8 + i*(w-16)/(pts.length-1));
  const ys = pts.map(p => h-8 - (p.s/max)*(h-16));
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="overflow:visible" aria-hidden="true">
    <polyline points="${xs.map((x,i)=>`${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ")}" fill="none" stroke="var(--accent)" stroke-width="2"/>
    ${xs.map((x,i)=>`<circle cx="${x.toFixed(1)}" cy="${ys[i].toFixed(1)}" r="3" fill="var(--accent)"/>`).join("")}
  </svg>`;
}
function scoreSeries(id){
  const hist = (SCORE_HISTORY[id] || []).slice();
  const live = state.screens[id];
  if (live) hist.push({ d:live.date, s:live.score });
  return hist;
}

function vChart(){
  const c = CHART;
  return `
  <h1 class="page-title">${c.name} <span class="muted" style="font-size:15px">${c.age}${c.sex} · MRN ${c.mrn} · ${c.allergies}</span></h1>
  <p class="page-sub">Lean chart — the clinical story first; coding &amp; compliance handled in a separate automated layer.${ev("downing")}</p>

  <div class="grid g3">
    <div class="card"><h3>Problems</h3>${c.problems.map(p=>`<div class="rowitem"><span class="t small">${p}</span></div>`).join("")}</div>
    <div class="card"><h3>Medications</h3>${c.meds.map(m=>`<div class="rowitem"><span class="small">${m}</span></div>`).join("")}</div>
    <div class="card"><h3>Prevention</h3>${c.prevention.map(p=>`
      <div class="rowitem"><span class="small" style="flex:1">${p.t}</span>
      ${p.due?`<span class="chip amber">due</span>`:`<span class="chip green">${p.done||"done"}</span>`}</div>`).join("")}
    </div>
  </div>
  <div class="section-gap"></div>

  <div class="grid g2">
    <div class="card">
      <h3>Vitals &amp; trends</h3>
      <table class="vitals"><tr><th>Measure</th><th>Latest</th><th>Trend</th></tr>
      ${c.vitals.map(v=>`<tr><td>${v.m}</td><td><b>${v.v}</b></td><td><span class="chip ${v.flag}">${v.trend}</span></td></tr>`).join("")}
      </table>
    </div>
    <div class="card">
      <h3>Patient's pre-visit voice <span class="chip accent">flows into note</span></h3>
      <div class="small"><b>Concerns:</b> ${c.preVisit.concerns}</div>
      <div class="small" style="margin-top:6px"><b>Goals:</b> ${c.preVisit.goals}</div>
      <div class="small" style="margin-top:6px"><b>Life context:</b> ${c.preVisit.sdoh}</div>
      <div class="evidence">Captured before the visit so the room stays a conversation, not an interview.${ev("mafi")}</div>
    </div>
  </div>
  <div class="section-gap"></div>

  <div class="card">
    <h3>Assessment <span class="chip green">billing decoupled — handled automatically</span></h3>
    <div class="small" style="margin-bottom:8px"><b>This is a patient note — nothing else.</b> Doctors are not data clerks: the codes, the claim, and the quality reporting all fall out of the visit in background layers, never typed into the story of the patient.</div>
    <textarea class="note-editor" id="lean-note" style="min-height:110px">${CARE_PLAN.assessment}</textarea>
    <div class="tiny" style="margin-top:8px"><span id="note-count"></span> — U.S. notes average ~4× the length of the same EHR abroad because billing data bloats them. LumaChart keeps the note clinical.${ev("downing")} Clerical burden is the system's #1 named driver of burnout — ~2 hours of EHR/desk work per hour of patient care.${ev("sinskyTM")}${aut("nam2019")}</div>
  </div>
  <div class="section-gap"></div>

  <div class="card">
    <h3>📈 Scores over time <span class="chip accent">measurement-based care</span></h3>
    <div class="grid g2">
      ${["phq9","gad7"].map(id => { const ins = INSTRUMENTS[id], pts = scoreSeries(id); const last = pts[pts.length-1];
        return `<div>
          <div class="small"><b>${ins.name}</b> · latest <b>${last.s}</b>/${instrumentMax(ins)} <span class="tiny">(${last.d})</span></div>
          ${sparkline(pts, instrumentMax(ins))}
          <div class="tiny">${pts.length} measurements · lower is better ${ins.ev ? ev(ins.ev) : ""}</div>
        </div>`; }).join("")}
    </div>
    <div class="tiny" style="margin-top:8px">The trend is the treatment response — scores drawn over time turn every visit into evidence, not a buried table. Live results from the patient's own check-ins join this line automatically.</div>
  </div>
  <div class="section-gap"></div>

  <div class="card">
    <h3>Plan — the record's future tense <span class="chip accent">FHIR CarePlan + Task</span></h3>
    <p class="small muted" style="margin:0 0 6px">Every item is specific, time-bound and owned: <b>what · why · when · who</b>. The plan is what <i>should</i> happen next — the most valuable structure in the record.</p>
    ${CARE_PLAN.plan.map(p=>`
      <div class="plan-item">
        <div class="pi-body">
          <div class="pi-what">${p.what}</div>
          <div class="pi-why">${p.why}${p.ev?ev(p.ev):""}</div>
          <div class="plan-meta">
            <span class="chip plain">⏱ ${p.when}</span>
            <span class="chip plain">👤 ${p.who}</span>
            <span class="chip ${p.status==="ordered"?"amber":p.status==="active"?"accent":"plain"}">${p.status}</span>
          </div>
        </div>
      </div>`).join("")}
    <div class="divider"></div>
    <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center">
      <button class="btn primary" id="gen-patient-plan">Publish patient-friendly plan → portal</button>
      <span class="tiny">Exports as FHIR <b>CarePlan</b> resources over the §170.315(g)(10) standardized API, with companion <b>Task</b> resources. See docs/INTEROPERABILITY-PLAN.md.</span>
    </div>
  </div>
  <div class="section-gap"></div>

  <div class="card">
    <h3>USPSTF preventive care <span class="chip accent">${c.age}${c.sex}</span>
      <span style="margin-left:auto; display:flex; gap:8px; align-items:center">
        <span class="tiny">${USPSTF_META.updated?`updated ${USPSTF_META.updated}`:"embedded set"}</span>
        <button class="btn ghost small" id="uspstf-refresh" title="Re-sync the latest Grade A/B recommendations">⟳ Refresh</button>
        <a class="pmid" href="${USPSTF_META.sourceUrl}" target="_blank" rel="noopener" style="text-indent:0">USPSTF ↗</a>
      </span></h3>
    <p class="small muted" style="margin:0 0 6px">Grade A/B recommendations that apply to this patient, loaded from a refreshable feed so the EHR stays current as evidence changes. Screening is not diagnosis — a positive screen routes to clinical assessment.</p>
    ${uspstfApplicable(PATIENT_CTX).primary.map(r=>`
      <div class="plan-item">
        ${gradeChip(r.grade)}
        <div class="pi-body">
          <div class="pi-what">${r.topic} <span class="tiny">· USPSTF ${r.year}</span></div>
          <div class="pi-why">${r.clin}${r.ev?ev(r.ev):""}</div>
        </div>
        ${r.instrument?`<button class="btn small" data-order-screen="${r.instrument}">Send ${INSTRUMENTS[r.instrument].short}</button>`:`<button class="btn small">Order</button>`}
      </div>`).join("")}
    <div class="divider"></div>
    <div class="tiny">Also offer per individual risk: ${uspstfApplicable(PATIENT_CTX).risk.map(r=>r.topic.split(":")[0].split("(")[0].trim()).join(" · ")}. <a class="pmid" href="${USPSTF_TOOLS_URL}" target="_blank" rel="noopener" style="text-indent:0">Clinician tools &amp; resources ↗</a></div>
  </div>
  <div class="section-gap"></div>

  <div class="card">
    <h3>Patient-reported screenings <span class="chip plain">inbound</span></h3>
    ${Object.keys(state.screens).length ? Object.entries(state.screens).map(([id,r])=>{
      const ins = INSTRUMENTS[id];
      return `<div class="rowitem">
        <div style="flex:1"><div class="t small">${ins.short} — ${r.date}</div>
        <div class="d">Score ${r.score}/${r.max}${ins.ev?ev(ins.ev):""}${r.safety?` · <span style="color:var(--red); font-weight:700">⚠ self-harm item endorsed — review urgently</span>`:""}</div></div>
        <span class="chip ${r.tone}">${r.band}</span></div>`;
    }).join("") : `<div class="small muted">None returned yet. Send a questionnaire above, or the patient completes one in their portal (Screenings & questionnaires).</div>`}
  </div>`;
}

function vInbox(){
  const delegable = INBOX.filter(i=>i.delegable).length;
  const batchRow = i => `
    <div class="rowitem">
      <div style="flex:1"><div class="t small">${i.t} ${i.gratitude?"💛":""}</div>
      <div class="d">${i.d} · <span class="tiny">earmarked by ${i.by}</span></div></div>
      ${i.delegable?`<span class="chip green">delegable</span>`:`<span class="chip plain">physician</span>`}
    </div>`;
  return `
  <h1 class="page-title">Inbox <span class="chip amber">${INBOX.length} items</span></h1>
  <p class="page-sub">Inbox work is ~24% of physicians' EHR time.${ev("arndt")} Here, every message lands with staff first — and reaches you in two daily batches, not thirty interruptions.</p>

  <div class="card" style="margin-bottom:16px">
    <h3>✉ Batched delivery <span class="chip green">on</span></h3>
    <div class="small">Staff receive everything, resolve what they can, and <b>earmark</b> the rest for you. Earmarked items arrive twice a day — <b>8:00 AM</b> and <b>12:15 PM</b> — so your attention stays with the patient in front of you.</div>
    <div class="tiny" style="margin-top:8px">⚠ Emergencies are never batched — anything urgent breaks through instantly, 24/7.</div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <h3>Inbox burden</h3>
    <div class="gauge-wrap">
      <div class="metric"><div class="v">${INBOX.length}</div><div class="l">open items</div></div>
      <div class="metric"><div class="v" style="color:var(--green)">${delegable}</div><div class="l">team-delegable (standing orders / protocol)</div></div>
      <div class="metric"><div class="v" style="color:var(--accent)">~14<span style="font-size:15px">min</span></div><div class="l">est. time returned if delegated</div></div>
      <button class="btn primary" id="delegate-all">Delegate ${delegable} to care team</button>
    </div>
    <div class="evidence">Team-based models (APEX) that delegate protocol work cut burnout from 53% → 13% in 6 months — while improving vaccination &amp; screening rates.${ev("wright")}</div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <h3>🤝 Suggested delegation steps <span class="chip accent">you're part of a team</span></h3>
    <div class="rowlist">
      ${DELEGATION.map((s,i)=>`<div class="rowitem">
        <div style="flex:1">
          <div class="t small">${s.item} <span class="chip plain">${s.to}</span></div>
          <div class="d">${s.how}</div>
        </div>
        ${state.delegated[i]?`<span class="chip green">running ✓</span>`:`<button class="btn ghost small" data-delegate-step="${i}">Run step · ~${s.min} min back</button>`}
      </div>`).join("")}
    </div>
    <div class="tiny" style="margin-top:8px">Concrete steps, not vague advice — each one names who takes the work and how it stays safe (protocol + automatic route-back).</div>
  </div>

  <div class="card" style="margin-bottom:14px">
    <h3>🌅 Morning batch <span class="chip green">delivered 8:00 AM</span></h3>
    <div class="rowlist">${INBOX.filter(i=>i.batch==="AM").map(batchRow).join("")}</div>
  </div>

  <div class="card batch-queued" style="margin-bottom:14px">
    <h3>🕛 Afternoon batch <span class="chip plain">arrives 12:15 PM</span></h3>
    <div class="rowlist">${INBOX.filter(i=>i.batch==="PM").map(batchRow).join("")}</div>
    <div class="tiny" style="margin-top:8px">Queued with your staff — out of sight until batch time.</div>
  </div>

  <div class="card">
    <h3>1️⃣ One route per task</h3>
    <div class="small" style="margin-bottom:8px">Legacy EHRs deliver <b>${ROUTES.example}</b> four different ways:</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">${ROUTES.before.map(r=>`<span class="chip plain" style="text-decoration:line-through;opacity:.6">${r}</span>`).join("")}</div>
    <div class="small"><span class="chip green">LumaChart</span> ${ROUTES.after}</div>
    <div class="tiny" style="margin-top:8px">Redundant routes are how things get double-handled <i>and</i> missed. One canonical route per task is a design rule across LumaChart.</div>
  </div>

  <div class="card" style="margin-top:14px">
    <h3>🗑 Kill a stupid task</h3>
    <div class="small" style="margin-bottom:10px">Nominate any EHR task that is unnecessary or badly designed — the care team votes, leadership must answer. Hawaii Pacific Health's version of this returned <b>1,700 nursing hours a month</b>.${ev("ashton")}${aut("sgAdvisory")}</div>
    <div style="display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap">
      <input id="gross-input" type="text" placeholder="What task should die? e.g. “re-entering allergies at every visit”" style="flex:1; min-width:220px; background:var(--surface2); color:var(--text); border:1px solid var(--line-strong); border-radius:10px; padding:8px 12px; font:inherit; font-size:13px">
      <button class="btn primary small" id="gross-nominate">Nominate</button>
    </div>
    <div class="rowlist">
      ${state.gross.map(g=>`<div class="rowitem">
        <button class="btn ghost small" data-gross-vote="${g.id}" ${state.grossVoted[g.id]?"disabled":""}>▲ ${g.votes}</button>
        <div style="flex:1"><div class="t small">${g.title}</div><div class="d">${g.by}${g.saved?` · returned ${g.saved}`:""}</div></div>
        <span class="chip ${g.status==="eliminated"?"green":"amber"}">${g.status}</span>
      </div>`).join("")}
    </div>
  </div>`;
}

function vWellness(){
  return `
  <h1 class="page-title">Wellness Center</h1>
  <p class="page-sub">Evidence-based practices, built into the workday — because individual <i>and</i> organizational interventions both work.${ev("west")}</p>

  <div class="grid g2">
    <div class="card">
      <h3>🫁 One-minute breathing break</h3>
      <div class="breath-stage">
        <div class="breath-circle" id="breath-circle">Press start</div>
        <button class="btn primary" id="breath-btn" style="margin-top:16px">Start breathing</button>
      </div>
      <div class="tiny" style="text-align:center">Box breathing · 4s in — hold — 4s out</div>
    </div>

    <div style="display:flex; flex-direction:column; gap:16px">
      <div class="card">
        <h3>🧘 Practice library</h3>
        <div class="rowitem"><div style="flex:1"><div class="t small">Loving-kindness meditation · 10 min</div>
          <div class="d">RCT: builds positive emotion &amp; resilience ${ev("lovingKind")}</div></div><button class="btn small">Play</button></div>
        <div class="rowitem"><div style="flex:1"><div class="t small">8-week mindfulness track · day 12 of 56</div>
          <div class="d">Changes measurable in brain gray matter ${ev("holzel")}</div></div><button class="btn small">Continue</button></div>
      </div>
      <div class="card">
        <h3>💛 Gratitude — from your patients</h3>
        ${THANK_YOUS.map(t=>`<div class="rowitem"><div><div class="t small">“${t.note}”</div><div class="d">— ${t.from}</div></div></div>`).join("")}
        <div class="tiny" style="margin-top:6px">Positive daily experiences buffer stress and build resilience.${ev("lovingKind")}</div>
      </div>
    </div>
  </div>
  <div class="section-gap"></div>

  <div class="card">
    <h3>Well-being pulse <span class="chip plain">private to you</span></h3>
    <p class="small muted">A quick weekly self-check using validated-style items (full instruments: MBI, ProQOL${ev("proqol")}). Your history stays on your device in this demo.</p>
    <div class="grid g3">
      <div><div class="small" style="margin-bottom:5px">I feel emotionally drained by my work</div>
        <input type="range" min="0" max="6" value="2" style="width:100%"></div>
      <div><div class="small" style="margin-bottom:5px">I feel I make a difference for my patients</div>
        <input type="range" min="0" max="6" value="5" style="width:100%"></div>
      <div style="display:flex; align-items:flex-end"><button class="btn primary">Log this week</button></div>
    </div>
  </div>

  <div class="grid g2" style="margin-top:16px">
    <div class="card">
      <h3>☎ Confidential help — one tap, zero paper trail</h3>
      <div class="rowlist">
        ${HELP_LINES.map(h=>`<div class="rowitem">
          <div style="flex:1"><div class="t small"><a href="${h.url}" target="_blank" rel="noopener">${h.name}</a></div><div class="d">${h.how}</div></div>
        </div>`).join("")}
      </div>
      <div class="evidence">Eliminating the fear around seeking care is the Surgeon General's second call to action — and licensure boards are moving to ask only about current impairment, not history.${aut("sgAdvisory")}${ev("dyrbyeLic")}${aut("breenAct")} Nothing you do on this card touches your record or your employer.</div>
    </div>
    <div class="card">
      <h3>🤝 Peer support — Battle Buddy</h3>
      <div class="small">Pair with one colleague for a standing 5-minute check-in. Not therapy, not a committee — a buddy. Rapid peer-support pairing was deployed for health workers in 2020 and is a recognized model for mitigating isolation and distress.${ev("albott")}${aut("sgAdvisory")}</div>
      ${state.buddy
        ? `<div class="small" style="margin-top:10px"><span class="chip green">opted in ✓</span> You'll be paired within your department this week. Opt out any time.</div>`
        : `<button class="btn primary small" style="margin-top:10px" data-buddy-optin>Opt in to pairing</button>`}
      <div class="tiny" style="margin-top:8px">Decreased social support is linked to higher burnout — connection is a clinical tool, not a perk.${ev("west")}</div>
    </div>
  </div>`;
}

function vCanary(){
  const m = state.canary.sessionMin;
  const backlog = INBOX.length;
  return `
  <h1 class="page-title">🐦 Canary <span class="chip green">private to you</span></h1>
  <p class="page-sub">Your early-warning companion. Canary reads your own workload signals against your baseline and speaks up gently — like a canary in a coal mine, it warns before harm. Built as a transparent Decision Support Intervention.${reg("b11")}</p>

  <div class="grid g3">
    <div class="card"><div class="metric"><div class="v" id="canary-session">${fmtMin(m)}</div><div class="l">this session (demo clock: 1 s = 1 min)</div></div>
      <div class="bar" style="margin-top:10px"><i class="${m>120?"red":m>60?"amber":"green"}" id="canary-session-bar" style="width:${Math.min(m/180*100,100)}%"></i></div>
      <div class="tiny" style="margin-top:6px">Extended-login warning at 2 h continuous.</div></div>
    <div class="card"><div class="metric"><div class="v">${backlog}</div><div class="l">inbox backlog</div></div>
      <div class="bar" style="margin-top:10px"><i class="amber" style="width:${Math.min(backlog/20*100,100)}%"></i></div>
      <div class="tiny" style="margin-top:6px">Inbox is ~24% of EHR time nationally.${ev("arndt")}</div></div>
    <div class="card"><div class="metric"><div class="v">31<span style="font-size:15px"> min</span></div><div class="l">after-hours EHR yesterday</div></div>
      <div class="bar" style="margin-top:10px"><i class="green" style="width:37%"></i></div>
      <div class="tiny" style="margin-top:6px">Your 14-day trend is falling — nice.</div></div>
  </div>
  <div class="section-gap"></div>

  <div class="card">
    <h3>After-hours "pajama time" — last 14 days</h3>
    <div class="sparkrow">${PAJAMA_14D.map(v=>`<i style="height:${v/85*100}%" class="${v>65?"hot":""}"></i>`).join("")}</div>
    <div class="tiny" style="margin-top:8px">National average: 1.4 h/day of after-hours EHR work.${ev("arndt")} Canary flags rising trends before they become the norm.</div>
  </div>
  <div class="section-gap"></div>

  <div class="grid g2">
    <div class="card">
      <h3>How Canary escalates</h3>
      <div class="rowitem"><span class="chip green">25 min</span><div class="d">Gentle micro-break nudge (20-20-20 eye rest)</div></div>
      <div class="rowitem"><span class="chip accent">60 min</span><div class="d">Offer a one-minute breathing break</div></div>
      <div class="rowitem"><span class="chip amber">120 min</span><div class="d">Extended-login warning with evidence</div></div>
      <div class="rowitem"><span class="chip red">trend</span><div class="d">Rising after-hours pattern → suggest workflow &amp; delegation review</div></div>
    </div>
    <div class="card">
      <h3>Canary's promises</h3>
      <div class="rowitem"><div class="d">✅ Private to you by default — managers see only de-identified aggregates</div></div>
      <div class="rowitem"><div class="d">✅ Non-punitive — never wired to productivity or employment decisions</div></div>
      <div class="rowitem"><div class="d">✅ Evidence-grounded — signals come from the measured drivers of burnout${ev("arndt")}</div></div>
      <div class="rowitem"><div class="d">✅ Thresholds ship as demo defaults — production values require prospective clinical validation (see Roadmap)</div></div>
    </div>
  </div>`;
}

/* ==========================================================================
   ROADMAP — gates, ONC §170.315 tracker, build-vs-buy, plan thesis
   ========================================================================== */
/* ---------- Certification (45 CFR Part 170) — the full program, honestly mapped ---------- */
function certChip(st){
  const m = { proto:["green","✓ proto"], "designed-in":["green","designed-in"], partial:["amber","partial"],
    planned:["amber","planned"], partner:["accent","partner"], gap:["plain","gap"] };
  const [tone,label] = m[st] || ["plain", st];
  return `<span class="chip ${tone}">${label}</span>`;
}
function vCert(){
  const c = CERT170;
  return `
  <h1 class="page-title">Certification — built to 45 CFR Part 170</h1>
  <p class="page-sub">The ONC Health IT Certification Program in full: Subpart B standards, Subpart C §170.315 criteria, and Subpart D Conditions of Certification. Honest status throughout — proto, partial, partner, or gap — because naming the gap is part of building to the standard.${aut("cfr170")}</p>

  <div class="card" style="margin-bottom:16px">
    <h3>📜 The rules that shape Part 170 today</h3>
    <div class="rowlist">
      ${c.rules.map(r=>`<div class="rowitem"><span class="chip accent">${r.r}</span><div style="flex:1"><div class="t small">${r.date}</div><div class="d">${r.d}</div></div></div>`).join("")}
    </div>
    <div class="tiny" style="margin-top:8px">Current through HTI-4 (Aug 2025).${aut("hti1")} The certification data model is <b>USCDI v3</b> (baseline effective Jan 1, 2026), with v4–v6 adoptable via SVAP.</div>
  </div>

  <div class="grid g2" style="margin-bottom:16px">
    <div class="card">
      <h3>Subpart B — standards adopted</h3>
      <div class="rowlist">${c.standardsB.map(x=>`<div class="rowitem">${certChip(x.st)}<div class="d" style="flex:1"><b>${x.s}</b> — ${x.d}</div></div>`).join("")}</div>
    </div>
    <div class="card">
      <h3>Subpart D — Conditions of Certification</h3>
      <div class="rowlist">${c.conditions.map(x=>`<div class="rowitem">${certChip(x.st)}<div class="d" style="flex:1"><b>${x.s}</b> — ${x.d}${x.nav?` <a data-nav-inline="${x.nav}" style="cursor:pointer">→</a>`:""}</div></div>`).join("")}</div>
    </div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <h3>Subpart C — §170.315 certification criteria</h3>
    <div class="rowlist">
      ${c.criteria.map(x=>`<div class="rowitem">${certChip(x.st)}
        <div class="d" style="flex:1"><b>${x.g}</b>${x.base?` <span class="chip plain">Base EHR</span>`:""} — ${x.d}</div></div>`).join("")}
    </div>
    <div class="evidence">Certification is achieved by <b>composition</b> — one or more Certified Health IT Modules, most on a FHIR-native backend (Medplum/Aidbox) with certified modules bought for the specialized pieces. The full criterion-by-criterion map is in docs/ONC-CERTIFICATION-ROADMAP.md; the live <a data-nav-inline="fhir" style="cursor:pointer">FHIR sandbox</a> exercises the (g)(10) API, and the ONC conformance tools (Inferno) are the gate.${aut("oncTestTools")}</div>
  </div>

  <div class="card">
    <h3>Where it connects</h3>
    <div class="small">The Conditions of Certification aren't abstract here — <a data-nav-inline="security" style="cursor:pointer">Security &amp; SAFER</a> carries information blocking (§170.401), the API Conditions (§170.404), and the regulatory architecture; the <a data-nav-inline="fhir" style="cursor:pointer">FHIR sandbox</a> is the (g)(10) surface; and the whole program exists in service of the mission — less clinician burden, a real patient note, quiet successful billing.</div>
  </div>`;
}

function vRoadmap(){
  return `
  <h1 class="page-title">Roadmap — gates before real-world use</h1>
  <p class="page-sub">An honest path from prototype to production. Naming the gap is part of the design.</p>

  <div class="card" style="margin-bottom:16px">
    <h3>The four gates</h3>
    ${GATES.map((g,i)=>`
      <div class="gate"><div class="g-num">${i+1}</div>
        <div style="flex:1"><div class="t small" style="font-weight:700">${g.t}
          <span class="chip ${g.status==="in design"?"accent":g.status==="study designed"?"green":"plain"}">${g.status}</span></div>
        <div class="d">${g.d}</div></div>
      </div>`).join("")}
  </div>

  <div class="card" style="margin-bottom:16px">
    <h3>ONC Base EHR certification tracker <span class="chip plain">§170.315 · CY2026</span></h3>
    <div class="tablewrap"><table class="reg">
      <tr><th>Base EHR capability</th><th>Certification criteria</th><th>Timing</th><th>LumaChart strategy</th></tr>
      ${ONC_CRITERIA.map(c=>`
        <tr><td class="cap">${c.cap}</td><td>${c.crit}</td><td>${c.timing}</td>
        <td>${c.strategy} <span class="chip ${c.kind==="buy"?"amber":c.kind==="build-on"?"accent":"green"}">${c.kind}</span></td></tr>`).join("")}
    </table></div>
    <div class="tiny" style="margin-top:8px">Base EHR Definition may be met by one Certified Health IT Module or a combination. Criteria timing per ONC (updated May 2026).</div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <h3>Buy the certified pieces, build the difference</h3>
    <p class="small muted" style="margin:0 0 8px">LumaChart's differentiators are the workflow, Canary, and the prevention/research layers — not X12 plumbing. Everything else is partnered:</p>
    ${BUY_BUILD.map(b=>`
      <div class="rowitem"><div style="flex:1">
        <div class="t small">${b.area} — <span style="color:var(--accent)">${b.partner}</span></div>
        <div class="d">${b.why}</div></div>
        <span class="chip ${b.kind==="buy"?"amber":"accent"}">${b.kind}</span>
      </div>`).join("")}
  </div>

  <div class="card">
    <h3>Why the Plan is the most valuable structure in the record</h3>
    <p class="small muted" style="margin:0 0 8px">The Assessment justifies and motivates the Plan — who/what/why, therefore how/what next/when/with whom. A structured, time-bound Plan (FHIR CarePlan as the start) serves every HHS jurisdiction at once:</p>
    ${PLAN_THESIS.map(p=>`
      <div class="rowitem"><span class="chip accent" style="min-width:132px; text-align:center">${p.who}</span>
      <div class="d" style="flex:1">${p.d}</div></div>`).join("")}
    <div class="evidence">The 21st Century Cures Act begins: "To <b>accelerate the discovery, development, and delivery</b> of 21st century cures…" — a record that speaks Plan natively serves discovery and development, not delivery alone. See the structured Plan in the patient chart.</div>
  </div>`;
}

/* ==========================================================================
   SYNTHESIS — physician health × interoperability (the unifying thesis)
   ========================================================================== */
function synthProjection(){
  const saved = INTEROP_RELIEF.reduce((s,r,i)=> s + (state.interop[i] ? r.mins : 0), 0);
  const projected = Math.max(AH_BASELINE - saved, AH_FLOOR);
  return { saved, projected };
}
function synthCanaryMsg(saved){
  return saved>=50 ? "🐦 Canary's after-hours trend falls sharply — fewer late nights in the record."
       : saved>0  ? "🐦 Canary registers the after-hours load starting to ease."
       : "🐦 Legacy state: the full after-hours burden lands on the clinician.";
}
function updateSynth(){
  const el = $("#synth-projected"); if (!el) return;
  const { saved, projected } = synthProjection();
  el.textContent = projected;
  const bar = $("#synth-bar");
  bar.style.width = (projected/AH_BASELINE*100) + "%";
  bar.className = projected>60 ? "red" : projected>36 ? "amber" : "green";
  $("#synth-saved").textContent = saved;
  $("#synth-canary").textContent = synthCanaryMsg(saved);
}
function vSynthesis(){
  const { saved, projected } = synthProjection();
  return `
  <h1 class="page-title">Physician health × Interoperability</h1>
  <p class="page-sub">The whole project in one idea — and it's interactive.</p>

  <div class="banner" style="background:linear-gradient(100deg,var(--accent-soft),var(--surface2)); border:1px solid var(--line-strong); color:var(--text)">
    <h3 style="color:var(--text)">Clinician-centered interoperability <i>is</i> physician-health infrastructure.</h3>
    <p style="color:var(--text-2)">Burnout traces to EHR <b>burden</b>; burden traces to documentation the clinician re-enters by hand. Every USCDI data class that flows in cleanly is a task they don't do at 9pm — and the same lean, structured data is what makes the public-health research layer possible. One architecture, the whole Quadruple Aim.${ev("quadAim")}</p>
  </div>

  <div class="grid g32" style="align-items:start">
    <div class="card">
      <h3>Turn on the interoperable feeds ↓</h3>
      <p class="small muted" style="margin:0 0 6px">Each feed replaces re-entry. Watch the projected after-hours "pajama time" fall.</p>
      ${INTEROP_RELIEF.map((r,i)=>`
        <label class="plan-item" style="cursor:pointer; align-items:flex-start">
          <input type="checkbox" class="task-check synth-toggle" data-feed="${i}" ${state.interop[i]?"checked":""}>
          <div class="pi-body">
            <div class="pi-what">${r.cap} <span class="chip green" style="font-weight:800">−${r.mins} min</span></div>
            <div class="pi-why"><b>Flows in:</b> ${r.flows} <span class="tiny">· ${r.how}${r.uscdi!=="—"?` · USCDI: ${r.uscdi}`:""}</span></div>
            <div class="pi-why" style="color:var(--text-3)"><b>Eliminates:</b> ${r.saves}</div>
            <div class="plan-meta"><span class="chip plain">driver: ${r.driver}${ev(r.ev)}</span></div>
          </div>
        </label>`).join("")}
      <div class="tiny" style="margin-top:8px">Minute values are <b>illustrative</b> demo estimates. The PMIDs support the burnout <i>driver</i> (e.g., inbox ≈ 24% of EHR time), not the specific minutes.</div>
    </div>

    <div style="position:sticky; top:80px; display:flex; flex-direction:column; gap:16px">
      <div class="card" style="text-align:center">
        <h3 style="justify-content:center">Projected after-hours EHR</h3>
        <div style="font-size:44px; font-weight:800; letter-spacing:-.03em; color:var(--accent)"><span id="synth-projected">${projected}</span> <span style="font-size:18px">min/day</span></div>
        <div class="bar" style="margin:10px 0 6px"><i id="synth-bar" class="${projected>60?"red":projected>36?"amber":"green"}" style="width:${projected/AH_BASELINE*100}%"></i></div>
        <div class="tiny">Legacy baseline: <b>${AH_BASELINE} min/day</b> of after-hours work${ev("arndt")}</div>
        <div class="divider"></div>
        <div class="metric" style="align-items:center"><div class="v" style="color:var(--green)"><span id="synth-saved">${saved}</span> min</div><div class="l">reclaimed from the clinician's day</div></div>
        <div class="small muted" id="synth-canary" style="margin-top:8px">${synthCanaryMsg(saved)}</div>
      </div>
      <div class="card">
        <h3>The pivot: the Assessment &amp; Plan</h3>
        <p class="small muted" style="margin:0">The structured A&amp;P (FHIR CarePlan) is the hinge — simultaneously the <b>least-bloated way to document</b> (physician health) and the <b>highest-value interoperable artifact</b> (public health): the record's future tense, serving CMS, FDA, NIH, CDC and the patient at once.${ev("downing")}</p>
      </div>
    </div>
  </div>
  <div class="section-gap"></div>

  <h3 style="margin:0 0 10px">One architecture, three wins</h3>
  <div class="grid g3">
    ${THREE_WINS.map(w=>`
      <div class="card"><h3><span class="chip ${w.tone}" style="font-size:15px">${w.ic}</span> ${w.win}</h3>
      <p class="small muted" style="margin:0">${w.d}</p></div>`).join("")}
  </div>
  <div class="section-gap"></div>

  <div class="card">
    <h3>Where this lives</h3>
    <div class="rowitem"><div style="flex:1"><div class="t small">Roadmap &amp; gates</div><div class="d">ONC §170.315 Base-EHR tracker + build-vs-buy map</div></div>
      <button class="btn small" data-nav-inline="roadmap">Open</button></div>
    <div class="rowitem"><div style="flex:1"><div class="t small">🐦 Canary</div><div class="d">Watches the after-hours trend these feeds move</div></div>
      <button class="btn small" data-nav-inline="canary">Open</button></div>
    <div class="rowitem"><div style="flex:1"><div class="t small">docs/INTEROPERABILITY-PLAN.md</div><div class="d">USCDI v3.1 mapping · US Core · phased gap plan</div></div>
      <span class="chip plain">in repo</span></div>
  </div>`;
}

/* ==========================================================================
   PATIENT VIEWS
   ========================================================================== */
function dueCount(){ return PREVENTION_PLAN.filter(p=>p.status==="due" && !state.scheduled[p.t]).length; }

function vHome(){
  const done = PREVENTION_PLAN.filter(p=>p.status!=="due" || state.scheduled[p.t]).length;
  const pct = Math.round(done/PREVENTION_PLAN.length*100);
  const tasks = CARE_PLAN.plan;
  const doneCountTasks = tasks.filter((t,i)=>state.tasksDone[i]).length;
  return `
  <h1 class="page-title">Welcome back, Maria</h1>
  <p class="page-sub">Your record is organized around one question: <b>how do you stay well and live longer?</b></p>

  <div class="grid g32">
    <div class="card" style="display:flex; align-items:center; gap:22px">
      <div class="ring" style="--p:${pct}; --ring-color:var(--green)"><div><b>${done}/${PREVENTION_PLAN.length}</b><span>prevention</span></div></div>
      <div>
        <h3 style="margin-bottom:6px">Health maintenance</h3>
        <p class="small muted" style="margin:0 0 10px">You're covered on ${done} of ${PREVENTION_PLAN.length} evidence-based prevention items${dueCount()?` — ${dueCount()} ready to schedule`:""}.</p>
        <button class="btn primary" data-nav-inline="plan">See my prevention plan →</button>
      </div>
    </div>
    <div class="card">
      <h3>What's due now</h3>
      ${PREVENTION_PLAN.filter(p=>p.status==="due").map(p=>{
        const s = state.scheduled[p.t];
        return `<div class="rowitem"><div style="flex:1"><div class="t small">${p.t}</div>
          ${s?`<div class="d" style="color:var(--green)">scheduled — ${s.d}, ${s.t}</div>`:""}</div>
          ${s?`<span class="chip green">✓</span>`:`<button class="btn small" data-schedule="${p.t}">Schedule</button>`}</div>`;
      }).join("")}
    </div>
  </div>
  <div class="section-gap"></div>

  <div class="card" style="margin-bottom:16px">
    <h3>☑ Your plan from today's visit <span class="chip accent">${doneCountTasks}/${tasks.length} done</span></h3>
    <p class="small muted" style="margin:0 0 4px">Not just a summary of what happened — a plan for what happens <b>next</b>, and why.</p>
    ${tasks.map((t,i)=>`
      <div class="plan-item">
        <input type="checkbox" class="task-check" data-task="${i}" ${state.tasksDone[i]?"checked":""}>
        <div class="pi-body">
          <div class="pi-what" style="${state.tasksDone[i]?"opacity:.55; text-decoration:line-through":""}">${t.patient}</div>
          <div class="plan-meta"><span class="chip plain">⏱ ${t.due}</span>${t.ev?`<span class="chip plain">evidence${ev(t.ev)}</span>`:""}</div>
        </div>
      </div>`).join("")}
  </div>

  <div class="grid g3">
    <div class="card"><div class="metric"><div class="v" style="color:var(--green)">6.9%</div><div class="l">Your 3-month blood-sugar average <span class="code-light">(A1c)</span> — down from 7.4. Your work is paying off.</div></div></div>
    <div class="card"><div class="metric"><div class="v">132/81</div><div class="l">Blood pressure — close to your &lt;130 goal${ev("sprint")}</div></div></div>
    <div class="card"><div class="metric"><div class="v" style="color:var(--accent)">95<span style="font-size:15px"> min/wk</span></div><div class="l">Activity — every 15 min/day adds up${ev("activity")}</div></div></div>
  </div>
  <div class="section-gap"></div>
  <div class="card" style="display:flex; align-items:center; gap:16px; flex-wrap:wrap">
    <div style="flex:1; min-width:220px"><h3 style="margin-bottom:4px">💚 Mental health is health</h3>
      <p class="small muted" style="margin:0">A 2-minute private check-in on mood, worry, or drinking — with proven steps that help. Recommended for all adults by the national panel of prevention experts <span class="code-light">(USPSTF)</span>.</p></div>
    <button class="btn primary" data-nav-inline="screenings">Check in</button>
  </div>`;
}

function vPlan(){
  return `
  <h1 class="page-title">Your prevention plan</h1>
  <p class="page-sub">Every recommendation comes with the actual evidence — click any PMID to read the study on PubMed.</p>

  <div class="card" style="margin-bottom:16px">
    <h3>Recommended for you by national prevention experts <span class="code-light">(USPSTF)</span>
      <a class="pmid" href="${USPSTF_URL}" target="_blank" rel="noopener" style="margin-left:auto; text-indent:0">Learn more ↗</a></h3>
    <p class="small muted" style="margin:0 0 4px">National experts review the evidence and grade what actually helps prevent illness. These apply to you:</p>
    ${uspstfApplicable(PATIENT_CTX).primary.map(r=>`
      <div class="rowitem">
        ${gradeChip(r.grade)}
        <div style="flex:1"><div class="t small">${r.topic.split(":")[0]}</div><div class="d">${r.pt}${r.ev?ev(r.ev):""}</div></div>
        ${r.instrument?`<button class="btn small" data-nav-inline="screenings">Take questionnaire</button>`:""}
      </div>`).join("")}
  </div>

  ${PREVENTION_PLAN.map(p=>{
    const s = state.scheduled[p.t];
    return `
    <div class="card" style="margin-bottom:14px">
      <h3>${p.t}
        ${s?`<span class="chip green">scheduled — ${s.d}, ${s.t}</span>`
          :p.status==="due"?`<span class="chip amber">due — schedule now</span>`
          :p.status==="done"?`<span class="chip green">complete</span>`:`<span class="chip accent">active</span>`}
      </h3>
      <p class="small" style="margin:0 0 4px">${p.detail}</p>
      <p class="small muted" style="margin:0"><b>What it buys you:</b> ${p.benefit}</p>
      ${p.ev ? evidenceCard(p.ev) : `<div class="evidence"><b>Why we recommend this:</b> it's the official national guidance for someone your age <span class="code-light">(USPSTF / CDC)</span>.</div>`}
      ${p.status==="due" ? `<div style="margin-top:11px; display:flex; gap:9px; flex-wrap:wrap">
          ${s?`<button class="btn" data-ics="${p.t}">📅 Add to calendar (.ics)</button>
               <button class="btn ghost" data-schedule="${p.t}">Change time</button>`
            :`<button class="btn primary" data-schedule="${p.t}">Schedule this</button>`}
        </div>`:""}
    </div>`;}).join("")}`;
}

function vMyPlan(){
  const tasks = CARE_PLAN.plan;
  return `
  <h1 class="page-title">My care plan</h1>
  <p class="page-sub">From your visit with Dr. Chen — each step says what to do, by when, and the reason behind it.</p>
  <div class="card">
    ${tasks.map((t,i)=>`
      <div class="plan-item">
        <input type="checkbox" class="task-check" data-task="${i}" ${state.tasksDone[i]?"checked":""}>
        <div class="pi-body">
          <div class="pi-what" style="${state.tasksDone[i]?"opacity:.55; text-decoration:line-through":""}">${t.patient}</div>
          <div class="pi-why">${t.why}${t.ev?ev(t.ev):""}</div>
          <div class="plan-meta"><span class="chip plain">⏱ ${t.due}</span><span class="chip plain">with: ${t.who}</span></div>
        </div>
      </div>`).join("")}
    <div class="divider"></div>
    <div class="tiny">Your progress is visible to your care team. Questions? Message us — or ask Luma ✨ below.</div>
  </div>`;
}

/* ---------- My record — patient-mediated unified timeline (right of access) ---------- */
function vMyRecord(){
  const step = state.myrecord.step;
  const stepNames = ["Why you can","Verify it's you","Authorize","Your one record"];
  const stepper = `<div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:16px">
    ${stepNames.map((t,i)=>`<span class="chip ${i<step?"green":i===step?"accent":"plain"}">${i<step?"✓ ":""}${t}</span>`).join("")}
    ${step>0?`<button class="btn ghost small" data-myrecord-reset style="margin-left:auto">start over</button>`:""}
  </div>`;
  let body = "";
  if (step===0) body = `
  <div class="card">
    <h3>🔗 One record, gathered by YOUR right</h3>
    <p class="small">Federal law (HIPAA) gives you the right to a copy of your records from every clinic, hospital, and lab you've ever visited <span class="code-light">(individual right of access)</span>. LumaChart helps you use that right — and blocking it is illegal for providers and EHR vendors.${aut("infoBlocking")}</p>
    <button class="btn primary" data-myrecord-next>Start my request</button>
  </div>`;
  else if (step===1) body = `
  <div class="card">
    <h3>Verify it's really you</h3>
    <p class="small">Your records go to you and no one else — so first, a government ID plus a selfie check <span class="code-light">(NIST IAL2)</span>.</p>
    <p class="tiny muted" style="margin:0 0 10px">Demo simulation — no real ID is collected.</p>
    <button class="btn primary" data-myrecord-next>I've verified (demo)</button>
  </div>`;
  else if (step===2) body = `
  <div class="card">
    <h3>Authorize your request</h3>
    <div class="evidence" style="font-family:var(--font)">"I direct every clinic, hospital, lab, and pharmacy that holds records about me to provide a copy to my LumaChart. I make this request under my federal right of access <span class="code-light">(HIPAA, 45 CFR 164.524)</span>."</div>
    <p class="small muted" style="margin:8px 0 10px">In plain words: you're asking for what is already yours. Providers must answer, and blocking your request is illegal.${aut("infoBlocking")}</p>
    <button class="btn primary" data-myrecord-next>Authorize my request</button>
  </div>`;
  else body = `
  <div class="card" style="margin-bottom:16px">
    <h3>Your one record <span class="chip green">✓ assembled</span></h3>
    <p class="small muted" style="margin:0 0 6px">Assembled from every system you've touched — this is the antidote to the fragmented patient experience.</p>
    <div class="rowlist">
      ${TIMELINE.map(t=>`
      <div class="rowitem">
        <span style="font-size:18px">${t.icon}</span>
        <div style="flex:1"><div class="t small">${t.title}</div><div class="d">${t.detail}</div><div class="tiny muted" style="margin-top:2px">from: ${t.src}</div></div>
        <div style="text-align:right"><span class="chip plain">${t.setting}</span><div class="tiny muted" style="margin-top:4px">${t.date}</div></div>
      </div>`).join("")}
    </div>
  </div>
  <div class="card">
    <h3>Where should it go?</h3>
    <div style="display:flex; gap:9px; flex-wrap:wrap">
      <button class="btn primary" data-myrecord-dest="keep">Keep in my LumaChart</button>
      <button class="btn" data-myrecord-dest="send">Send to a new doctor</button>
      <button class="btn" data-myrecord-dest="download">Download a copy</button>
    </div>
    <div class="tiny" style="margin-top:8px">Demo simulation — a real request goes out to each provider with your authorization attached.</div>
  </div>`;
  return `
  <h1 class="page-title">My record</h1>
  <p class="page-sub">Every visit, lab, and hospital stay you've ever had — gathered into one place, by your legal right. Standards-based patient access.${reg("e1","g10")}</p>
  ${stepper}${body}`;
}

function vScreenings(){
  if (state.activeInstrument) return vInstrument(state.activeInstrument);
  if (state.activeResult) return vResultView(state.activeResult);
  return `
  <h1 class="page-title">Mental health is health</h1>
  <p class="page-sub">Private questionnaires — the same ones doctors use everywhere, recommended by national prevention experts <span class="code-light">(USPSTF)</span>. You answer in a few minutes; your care team reviews the results; you get proven steps that help. Social, psychological &amp; behavioral data, structured.${reg("a15")}</p>

  <div class="card" style="margin-bottom:16px">
    <h3>📈 Your progress <span class="chip green">headed the right way</span></h3>
    <div class="grid g2">
      ${["phq9","gad7"].map(id => { const ins = INSTRUMENTS[id], pts = scoreSeries(id); const first = pts[0], last = pts[pts.length-1];
        return `<div>
          <div class="small"><b>${ins.short}</b> — your score went from <b>${first.s}</b> to <b>${last.s}</b> <span class="tiny">(lower is better)</span></div>
          ${sparkline(pts, instrumentMax(ins))}
        </div>`; }).join("")}
    </div>
    <div class="tiny" style="margin-top:8px">Every check-in you complete joins this picture — it's how you and your care team see that the plan is working, visit by visit.</div>
  </div>
  <div class="note">These are <b>screening tools, not diagnoses.</b> If you're ever in crisis, call or text <b>988</b> (Suicide &amp; Crisis Lifeline, US) — free, confidential, any time.</div>
  <div class="grid g3" style="margin-top:16px">
    ${["phq9","gad7","auditc"].map(id=>{
      const ins = INSTRUMENTS[id], done = state.screens[id];
      const rec = USPSTF.find(r=>r.id===ins.uspstf);
      return `<div class="card">
        <h3>${ins.name}</h3>
        <div class="small muted">${ins.items.length} questions${rec?` · USPSTF ${rec.topic.split(":")[0]} (Grade ${rec.grade})`:""}${ev(ins.ev)}</div>
        ${done?`<div class="evidence" style="margin-top:10px">${done.date}: <b>${done.band}</b> (${done.score}/${done.max})</div>`:""}
        <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap">
          <button class="btn primary" data-start-screen="${id}">${done?"Retake":"Start"}</button>
          ${done?`<button class="btn ghost" data-view-result="${id}">See result &amp; tips</button>`:""}
        </div>
      </div>`;
    }).join("")}
  </div>`;
}

function vInstrument(id){
  const ins = INSTRUMENTS[id];
  return `
  <h1 class="page-title">${ins.name}</h1>
  <p class="page-sub">${ins.intro}</p>
  ${ins.license?`<div class="note">⚠️ ${ins.license}</div>`:""}
  <div class="card">
    ${ins.items.map((it,i)=>`
      <div class="q-item">
        <div class="q-text">${i+1}. ${it}</div>
        <div class="q-opts">${(ins.itemScales?ins.itemScales[i]:ins.scale).map((s,v)=>`<label class="q-opt"><input type="radio" name="q_${i}" value="${v}"><span>${s}</span></label>`).join("")}</div>
      </div>`).join("")}
    <div class="modal-actions" style="justify-content:space-between; margin-top:6px">
      <button class="btn" data-screen-cancel="1">← Back</button>
      <button class="btn primary" data-screen-submit="${id}">Score &amp; share with my care team</button>
    </div>
    <div class="tiny" style="margin-top:8px">A screening tool, not a diagnosis — your care team reviews it with you. In crisis? Call or text <b>988</b> (US), any time.${ev(ins.ev)}</div>
  </div>`;
}

const instrumentMax = ins => ins.itemScales ? ins.itemScales.reduce((a,s)=>a+(s.length-1),0) : ins.items.length*3;

function scoreInstrument(id){
  const ins = INSTRUMENTS[id];
  const vals = ins.items.map((_,i)=>{ const el = $(`input[name="q_${i}"]:checked`); return el ? +el.value : null; });
  if (vals.some(v=>v===null)){ toast("Almost there", "Please answer every item before scoring.", "amber"); return; }
  const score = vals.reduce((a,b)=>a+b,0);
  const band = ins.bands.find(b=>score<=b.max) || ins.bands[ins.bands.length-1];
  const safety = ins.safetyItem!=null && vals[ins.safetyItem]>0;
  // targeted self-care: tally endorsed items toward domains, keep the top 3
  const map = SELFCARE_MAP[id] || {};
  const tally = {};
  vals.forEach((v,i)=>{ const thr = ins.itemScales ? 1 : 2; if (v>=thr) (map[i]||[]).forEach(d=>{ tally[d]=(tally[d]||0)+v; }); });
  const domains = Object.keys(tally).sort((a,b)=>tally[b]-tally[a]).slice(0,3);
  state.screens[id] = { score, band:band.label, tone:band.tone, date:new Date().toISOString().slice(0,10), safety, max:instrumentMax(ins), domains };
  store.set("screens", state.screens);
  state.activeInstrument = null;
  state.activeResult = id;
  render();
  if (safety) safetyModal();
}

function vResultView(id){
  const ins = INSTRUMENTS[id], r = state.screens[id];
  if (!r){ state.activeResult = null; return vScreenings(); }
  const pct = Math.round(r.score / r.max * 100);
  const ringColor = r.tone==="red" ? "var(--red)" : r.tone==="amber" ? "var(--amber)" : "var(--green)";
  const domains = (r.domains||[]).map(d=>SELFCARE[d]).filter(Boolean);
  return `
  <h1 class="page-title">${ins.short} — your result</h1>
  <p class="page-sub">Mental health is health. Thank you for checking in — here's what your answers suggest, and small, evidence-based steps that help.</p>

  <div class="grid g32">
    <div class="card" style="display:flex; align-items:center; gap:20px">
      <div class="ring" style="--p:${pct}; --ring-color:${ringColor}"><div><b>${r.score}</b><span>of ${r.max}</span></div></div>
      <div>
        <div class="chip ${r.tone}" style="font-size:14px">${r.band}</div>
        <p class="small muted" style="margin:8px 0 0">A screening result, not a diagnosis. Your care team can see it and will follow up with you.${ins.ev?ev(ins.ev):""}</p>
      </div>
    </div>
    <div class="card">
      <h3>What happens next</h3>
      <div class="small muted">✓ Saved to your record<br>✓ Shared with your care team<br>✓ Retake it any time to see how you're doing</div>
    </div>
  </div>
  ${r.safety?`<div class="note" style="border-style:solid; border-color:var(--red)"><b>You matter.</b> Because you mentioned thoughts of self-harm, please reach out now — call or text <b>988</b> (Suicide &amp; Crisis Lifeline, US), any time. Your care team has been alerted.</div>`:""}
  <div class="section-gap"></div>

  <h3 style="margin:0 0 10px">Evidence-based steps for what you're feeling most</h3>
  ${domains.length ? `<div class="grid g2">${domains.map(d=>`
    <div class="card"><h3><span class="chip accent" style="font-size:15px">${d.ic}</span> ${d.label}</h3>
    <p class="small muted" style="margin:0">${d.tip}${ev(d.ev)}</p></div>`).join("")}</div>`
    : `<div class="card"><p class="small muted" style="margin:0">Your answers didn't point to specific concerns today — keep up what's working. General supports always help: regular movement, steady sleep, and staying connected.${ev("scConnect")}</p></div>`}
  <div class="tiny" style="margin-top:10px">These are self-care ideas that <b>complement</b> professional care — never a replacement. Talk with your care team about what fits you.</div>
  <div style="margin-top:16px; display:flex; gap:10px"><button class="btn primary" data-result-done="1">Done</button><button class="btn ghost" data-start-screen="${id}">Retake</button></div>`;
}

function safetyModal(){
  const layer = $("#modal-layer"); layer.classList.remove("hidden");
  layer.innerHTML = `<div class="modal">
    <h2>💛 You're not alone</h2>
    <p class="small">Your answers mention thoughts of self-harm — thank you for being honest. Please reach out right now; it's free, confidential, and available 24/7:</p>
    <p class="small"><b>Call or text 988</b> — Suicide &amp; Crisis Lifeline (US)<br><b>Text HOME to 741741</b> — Crisis Text Line</p>
    <p class="small muted">Your care team has been alerted and will follow up. If you are in immediate danger, call 911.</p>
    <div class="modal-actions"><button class="btn primary" id="safety-ok">I understand</button></div>
  </div>`;
  $("#safety-ok").addEventListener("click", ()=>layer.classList.add("hidden"));
}

function vLongevity(){
  return `
  <h1 class="page-title">Longevity tracker</h1>
  <p class="page-sub">Five modifiable numbers, one goal: more healthy years.</p>
  ${LONGEVITY.map(l=>`
    <div class="card" style="margin-bottom:13px">
      <div style="display:flex; align-items:center; gap:14px; flex-wrap:wrap">
        <div style="flex:1; min-width:200px"><b>${l.m}</b>
          <div class="small muted">now <b>${l.now}</b> · target <b>${l.target}</b>${l.ev?ev(l.ev):""}</div></div>
        <div style="width:220px; max-width:100%"><div class="bar"><i class="${l.pct>=90?"green":l.pct>=65?"":"amber"}" style="width:${l.pct}%"></i></div></div>
        <div class="chip ${l.pct>=90?"green":l.pct>=65?"accent":"amber"}">${l.pct}%</div>
      </div>
    </div>`).join("")}
  <div class="card"><h3>Why these five?</h3>
    <p class="small muted" style="margin:0">Blood pressure, blood sugar, cholesterol, movement and sleep are the levers with the strongest proof for adding healthy years — keeping blood pressure well-controlled reduced deaths in a landmark trial${ev("sprint")}, and even 15 minutes of daily activity added about 3 years of life expectancy in a study of 416,000 people${ev("activity")}.</p></div>`;
}

function vConsent(){
  const r = RESEARCH;
  return `
  <h1 class="page-title">Research &amp; consent</h1>
  <p class="page-sub">Your data can help everyone live longer — but only if <b>you</b> say so, and you can change your mind any time.</p>

  <div class="card" style="margin-bottom:16px">
    <div style="display:flex; align-items:center; gap:16px">
      <label class="switch"><input type="checkbox" id="consent-toggle" checked><i></i></label>
      <div style="flex:1">
        <b>Contribute my data to public-health research — with my name and anything that could identify me removed <span class="code-light">(de-identified)</span></b>
        <div class="small muted">Currently: <span id="consent-state" style="color:var(--green); font-weight:700">ON</span> · revocable instantly, no questions asked</div>
      </div>
    </div>
    <div class="divider"></div>
    <div class="grid g2 small muted">
      <div><b style="color:var(--text)">What is shared</b><br>Diagnoses, labs, vitals, prevention status — with your name, birthdate, address and record numbers removed.</div>
      <div><b style="color:var(--text)">What is never shared</b><br>Your notes, your free text, anything re-identifiable.</div>
    </div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <h3>How your consent works <span class="chip plain">modeled on the Framingham Heart Study</span></h3>
    <p class="small muted" style="margin:0 0 8px">${FRAMINGHAM.note} <a class="pmid" href="${FRAMINGHAM.url}" target="_blank" rel="noopener" style="text-indent:0">Framingham for researchers ↗</a></p>
    ${FRAMINGHAM.tiers.map((t,i)=>{ const on = state.consentTiers ? !!state.consentTiers[i] : t.on;
      return `<label class="rowitem" style="cursor:pointer"><input type="checkbox" class="task-check consent-tier" data-i="${i}" ${on?'checked':''}><div style="flex:1"><div class="t small">${t.t}</div><div class="d">${t.d}</div></div></label>`; }).join('')}
    <div class="tiny" style="margin-top:6px">Tiered &amp; granular: opt into exactly what you're comfortable with, and revoke any tier any time — the hallmark of long-term cohort consent.</div>
  </div>

  <div class="card">
    <h3>What consented data like yours is helping discover</h3>
    ${r.studies.map(s=>`
      <div class="rowitem"><div style="flex:1"><div class="t small">${s.t}</div><div class="d">${s.d}</div></div>
      <span class="chip accent">${s.status}</span></div>`).join("")}
    <div class="tiny" style="margin-top:8px">You are one of <b>${r.consented.toLocaleString()}</b> consented participants (${(r.consented/r.total*100).toFixed(1)}% of patients here).</div>
  </div>`;
}

/* ==========================================================================
   RESEARCHER VIEW
   ========================================================================== */
function vConsole(){
  const r = RESEARCH;
  const irbOk = i => state.irb[i] === "approved";
  const board = IRB.options.find(o=>o.id===state.irbBoard) || IRB.options[0];
  const approved = r.studies.filter((_,i)=>irbOk(i)).length;
  const anyApproved = approved > 0;
  return `
  <h1 class="page-title">Public-health research console</h1>
  <p class="page-sub">Prospective, consented, de-identified — the population layer the National Academy of Medicine called for. Nothing leaves without IRB approval.</p>

  <div class="grid g3">
    <div class="card"><div class="metric"><div class="v">${r.consented.toLocaleString()}</div><div class="l">consented participants</div></div>
      <div class="bar" style="margin-top:10px"><i class="green" style="width:${r.consented/r.total*100}%"></i></div>
      <div class="tiny" style="margin-top:6px">${(r.consented/r.total*100).toFixed(1)}% of ${r.total.toLocaleString()} patients — consent is explicit &amp; revocable.</div></div>
    <div class="card"><div class="metric"><div class="v">${approved}/${r.studies.length}</div><div class="l">studies IRB-approved</div></div>
      <div class="tiny" style="margin-top:10px">Cohort export unlocks only after Institutional Review Board approval.</div></div>
    <div class="card"><div class="metric"><div class="v">100%</div><div class="l">queries audit-logged</div></div>
      <div class="tiny" style="margin-top:10px">Every cohort query is recorded, attributable, and reviewable.</div></div>
  </div>
  <div class="section-gap"></div>

  <div class="card" style="margin-bottom:16px">
    <h3>IRB of record <span class="chip accent">${board.name}</span></h3>
    <div style="display:flex; gap:8px; flex-wrap:wrap; margin:8px 0">
      ${IRB.options.map(o=>`<button class="btn small ${o.id===state.irbBoard?'primary':''}" data-irb-board="${o.id}">${o.name}</button>`).join('')}
    </div>
    <div class="small muted">${board.d} ${board.id==='institutional'?`<b>FWA ${IRB.fwa}</b> · `:''}typical turnaround ${board.turnaround}.</div>
    <div class="tiny" style="margin-top:6px">${IRB.note} <a class="pmid" href="${IRB.ohrpUrl}" target="_blank" rel="noopener" style="text-indent:0">OHRP: register IRB / obtain FWA ↗</a></div>
    <div class="tiny" style="margin-top:4px">A registered <b>FWA</b> is the institutional unlock for federally-regulated human-subjects research — the critical piece that lets a site participate, alongside its IRB of record.</div>
  </div>

  <div class="grid g2">
    <div class="card">
      <h3>Active studies · IRB status</h3>
      ${r.studies.map((s,i)=>{
        const st = state.irb[i];
        const right = st==='approved' ? `<span class="chip green">✓ Approved · ${board.name}</span>`
          : st==='review' ? `<button class="btn small" data-irb-decide="${i}">Record decision</button>`
          : `<button class="btn small" data-irb="${i}">Submit to ${board.name}</button>`;
        const sub = st==='review' ? ` · <span style="color:var(--amber)">under review at ${board.name}</span>`
          : st==='approved' ? ` · <span style="color:var(--green)">approved · continuing review in 12 mo</span>` : '';
        return `<div class="rowitem"><div style="flex:1"><div class="t small">${s.t}</div><div class="d">${s.d}</div>
          <div class="tiny" style="margin-top:3px">${s.n}${sub}</div></div>${right}</div>`;
      }).join("")}
      <div class="evidence">IRB approval is an ethics gate for human-subjects research — no cohort is exported without it. The flow is realistic: submit → under review → approved, tracked here against your chosen board of record.</div>
    </div>
    <div class="card">
      <h3>Privacy guardrails <span class="chip green">enforced</span></h3>
      ${r.guardrails.map(g=>`<div class="rowitem"><div class="d">🔒 ${g}</div></div>`).join("")}
      <div class="divider"></div>
      ${anyApproved
        ? `<button class="btn primary" id="export-cohort">Export de-identified cohort ✓ IRB-approved</button>`
        : `<button class="btn" disabled style="opacity:.55; cursor:not-allowed">Export cohort — requires IRB approval</button>`}
      <div class="tiny" style="margin-top:6px">Honest by design: no export path exists without an approved protocol.</div>
    </div>
  </div>
  <div class="section-gap"></div>

  <div class="card">
    <h3>Research directory <span class="chip plain">${RESEARCH_PROJECTS.length} projects</span></h3>
    <p class="small muted" style="margin:0 0 8px">Equity &amp; precision-medicine research the consented public-health layer is built to support. Publicly-funded projects shown for illustration — these teams do not use this prototype.</p>
    ${RESEARCH_PROJECTS.map(p=>`<div class="rowitem"><div style="flex:1"><div class="t small">${p.t}</div><div class="d">${p.pi} · ${p.org}</div></div></div>`).join("")}
  </div>
  <div class="section-gap"></div>

  <div class="card">
    <h3>Regulatory &amp; registration documents</h3>
    <p class="small muted" style="margin:0 0 6px">Every study keeps its authorization paperwork on file — the audit trail regulators and partners expect.</p>
    ${REGDOCS.map(d=>`<div class="rowitem"><span class="chip ${d.status==='on file'?'green':'amber'}">${d.status}</span><div style="flex:1"><div class="t small">${d.t}</div><div class="d">${d.d}${d.url?` · <a class="pmid" href="${d.url}" target="_blank" rel="noopener" style="text-indent:0">${d.src} ↗</a>`:''}</div></div><button class="btn ghost small" data-regdoc="${d.t}">View letter</button></div>`).join("")}
    <div class="tiny" style="margin-top:6px">Consent stewardship is modeled on the 78-year Framingham Heart Study — tiered, revocable, long-term.</div>
  </div>`;
}

/* ==========================================================================
   REVENUE CYCLE — patient check-in (iPad) + encounter/claim (clinician)
   ========================================================================== */
function vCheckin(){
  const d = CODING.demographics, done = state.checkin;
  if (done) return `
  <h1 class="page-title">You're all set, Maria ✓</h1>
  <p class="page-sub">Thanks — your check-in is done. The doctor will see you shortly.</p>
  <div class="card"><h3>What you completed</h3>
    <div class="small muted">✓ Confirmed ${done.conditions.length} active conditions<br>✓ Confirmed your medications<br>✓ ${done.idUploaded?"Photo ID uploaded":"Photo ID — skipped"}<br>✓ Verified your demographics &amp; insurance</div>
    <div class="evidence">This pre-loaded your chart and today's claim, so the clinician only adds what you discuss now — less typing, fewer errors, a faster visit.</div>
    <button class="btn ghost" data-checkin-redo="1" style="margin-top:10px">Redo check-in</button>
  </div>
  <div class="section-gap"></div>

  <div class="card"><h3>📱 Take your record home</h3>
    <div style="display:flex; gap:18px; align-items:center; flex-wrap:wrap">
      <div style="width:112px; flex:none">${QR_SVG}</div>
      <div class="small" style="flex:1; min-width:220px">Point your phone's camera at this square — it opens your LumaChart patient portal: your results, your plan, your coverage helper. Nothing to install, nothing to remember.</div>
    </div>
  </div>`;
  return `
  <h1 class="page-title">Welcome back, Maria 👋</h1>
  <p class="page-sub">Great to see you again! Most of your paperwork is already filled in — just confirm what's changed. (This is the waiting-room iPad.)</p>
  <div class="card">
    <h3>1 · Do you still have these conditions?</h3>
    ${CODING.preloaded.map(p=>`<label class="rowitem" style="cursor:pointer"><input type="checkbox" class="task-check ci-cond" data-icd="${p.icd}" checked><div style="flex:1"><div class="t small">${p.dx}</div><div class="d">${p.icd}</div></div></label>`).join("")}
    <div class="tiny">Uncheck anything that no longer applies.</div>
  </div>
  <div class="section-gap"></div>
  <div class="card"><h3>2 · Still taking these medications?</h3>
    ${CODING.meds.map((m,i)=>`<label class="rowitem" style="cursor:pointer"><input type="checkbox" class="task-check ci-med" data-i="${i}" checked><div style="flex:1"><div class="t small">${m}</div></div></label>`).join("")}
  </div>
  <div class="section-gap"></div>
  <div class="grid g2">
    <div class="card"><h3>3 · Anything new?</h3>
      <textarea class="note-editor" id="ci-new" style="min-height:80px" placeholder="New conditions, medications, allergies, or concerns…"></textarea></div>
    <div class="card"><h3>4 · Photo ID &amp; your details</h3>
      <div class="rowitem"><div style="flex:1"><div class="t small">${d.name} · ${d.sex} · DOB ${d.dob}</div><div class="d">${d.address}</div><div class="d">${d.plan} · Member ${d.memberId}</div></div></div>
      <button class="btn" id="ci-upload">📷 Upload photo ID</button> <span id="ci-upload-state" class="tiny"></span>
    </div>
  </div>
  <div style="margin-top:18px"><button class="btn primary" id="ci-submit">Finish check-in</button>
    <span class="tiny">&nbsp;You're completing the demographics &amp; history the front desk used to type for you.</span></div>`;
}

function claimPipeline(ready){
  const c = state.claim;
  const steps = [
    { k:"code",      t:"Code the visit",  d:"ICD-10 for every condition + verified CPT" },
    { k:"agent",     t:"🤖 Billing agent", d:"Assembles the 837P claim from codes + demographics" },
    { k:"biller",    t:"Biller review",   d:"Double-checks demographics, codes, payer" },
    { k:"submitted", t:"Clearinghouse",   d:CODING.clearinghouse },
    { k:"ar",        t:"🤖 AR agent",     d:"Follows the claim to its outcome — payment or a won appeal" },
  ];
  const idx = steps.findIndex(s=>s.k===c.stage);
  const rows = steps.map((s,i)=>`<div class="rowitem"><span class="chip ${i<idx?'green':i===idx?'accent':'plain'}">${i<idx?'✓':i+1}</span>
    <div style="flex:1"><div class="t small">${s.t}</div><div class="d">${s.d}</div></div></div>`).join("");
  let action = "";
  if (c.stage==="code") action = ready
    ? `<button class="btn primary" id="claim-assemble">🤖 Agent: assemble 837P claim</button>`
    : `<div class="tiny">Finish coding — every diagnosis added and every CPT verified — to let the agent assemble the claim.</div>`;
  else if (c.stage==="agent")  action = `<div class="evidence">Agent assembled the claim — demographics + all ICD-10 diagnoses + verified CPT, formatted as an 837P professional claim. Handed to the biller.</div><button class="btn primary" id="claim-biller">Biller: review &amp; double-check</button>`;
  else if (c.stage==="biller") action = `<div class="evidence">Biller verified patient demographics, diagnosis &amp; procedure codes, and payer eligibility. Ready to submit.</div><button class="btn primary" id="claim-submit">Submit to clearinghouse</button>`;
  else if (c.stage==="submitted") action = `<div class="evidence" style="border-style:solid; border-color:var(--green)">✓ Submitted to ${CODING.clearinghouse}. Claim #LC-${String(Date.now()).slice(-6)}.</div>
    <div class="note" style="border-style:solid"><b>Puerto Rico bridge:</b> this member's plan is a PR payer. Mainland EHR claim formats aren't natively accepted by PR clearinghouses — and some PR payers still require <b>ICD-9</b> — so LumaChart routed the claim through the PR bridge connector, mapping each ICD-10 diagnosis to its ICD-9 crosswalk. See <b>docs/BILLING-AND-CLEARINGHOUSE-PLAN.md</b>.</div>
    <button class="btn primary" id="claim-ar">🤖 AR agent: watch this claim</button>
    <button class="btn ghost" id="claim-reset">Start a new claim</button>`;
  else if (c.stage==="ar") action = `
    <div class="t small" style="font-weight:700; margin-bottom:6px">Outcomes — not statuses <span class="chip amber">simulated</span></div>
    <div class="rowlist">
      <div class="rowitem"><span class="chip green">✓</span><div style="flex:1"><div class="t small">Outcome: PAID $412.80 in 11 days</div><div class="d">The agent checked the payer portal 3× and called once — you saw none of that.</div></div></div>
      <div class="rowitem"><span class="chip green">✓</span><div style="flex:1"><div class="t small">Outcome: appeal WON on CO-197 denial</div><div class="d">The agent drafted the appeal from the chart — the biller approved it in one click.</div></div></div>
    </div>
    <div class="evidence">The team reviews <b>outcomes and decisions — never status updates</b>. Watching a claim is not a job for a human.</div>
    <div class="tiny" style="margin:8px 0 10px">Simulated demo — a production AR agent posts references to the audit log.</div>
    <button class="btn ghost" id="claim-reset">Start a new claim</button>`;
  return `<div class="rowlist">${rows}</div><div style="margin-top:12px">${action}</div>`;
}

function vBilling(){
  const c = state.claim, d = CODING.demographics;
  const activePre = CODING.preloaded.filter(p => state.checkin ? state.checkin.conditions.includes(p.icd) : p.active);
  const dxCount = activePre.length + (c.dxAdded ? CODING.discussed.length : 0);
  const totalDx = activePre.length + CODING.discussed.length;
  const cptDone = CODING.cpt.filter((_,i)=>c.verified[i]).length;
  const ready = dxCount===totalDx && cptDone===CODING.cpt.length;
  return `
  <h1 class="page-title">Encounter &amp; claim <span class="muted" style="font-size:15px">${d.name} · ${d.plan}</span></h1>
  <p class="page-sub">Code every condition — complete coding reflects the true complexity of the visit. Undercoding leaves both care and revenue on the table.</p>

  <div class="card" style="margin-bottom:16px">
    <div class="gauge-wrap">
      <div class="metric"><div class="v">${dxCount}/${totalDx}</div><div class="l">diagnoses coded (ICD-10)</div></div>
      <div class="metric"><div class="v" style="color:var(--accent)">${cptDone}/${CODING.cpt.length}</div><div class="l">CPT codes verified</div></div>
      <div style="flex:1; min-width:180px"><div class="bar"><i class="${ready?'green':'amber'}" style="width:${Math.round((dxCount+cptDone)/(totalDx+CODING.cpt.length)*100)}%"></i></div>
        <div class="tiny" style="margin-top:6px">${dxCount<totalDx?`${totalDx-dxCount} discussed diagnosis(es) not yet coded.`:cptDone<CODING.cpt.length?`${CODING.cpt.length-cptDone} CPT code(s) awaiting verification.`:"Full complexity captured — coded and verified."}</div></div>
    </div>
    ${state.checkin?`<div class="tiny" style="margin-top:8px">✓ Patient pre-loaded ${activePre.length} conditions and demographics at check-in — you only add what you discussed today.</div>`:`<div class="tiny" style="margin-top:8px">Patient hasn't checked in yet — the Patient role → Check-in pre-loads these conditions and demographics for you.</div>`}
  </div>

  <div class="grid g2">
    <div class="card">
      <h3>Diagnoses — ICD-10 <span class="chip green">patient pre-loaded ${activePre.length}</span></h3>
      ${activePre.map(p=>`<div class="rowitem"><span class="chip plain">${p.icd}</span>${p.icd9?`<span class="chip plain" style="opacity:.65" title="ICD-9 crosswalk (for PR payers still on ICD-9)">≈ ${p.icd9}</span>`:""}<div style="flex:1"><div class="t small">${p.dx}</div></div><span class="chip green">✓</span></div>`).join("")}
      <div class="divider"></div>
      <div class="small muted" style="margin-bottom:6px">Discussed today — add the last two:</div>
      ${c.dxAdded
        ? CODING.discussed.map(p=>`<div class="rowitem"><span class="chip plain">${p.icd}</span>${p.icd9?`<span class="chip plain" style="opacity:.65" title="ICD-9 crosswalk">≈ ${p.icd9}</span>`:""}<div style="flex:1"><div class="t small">${p.dx}</div></div><span class="chip accent">added</span></div>`).join("")
        : `${CODING.discussed.map(p=>`<div class="rowitem"><span class="chip plain">${p.icd}</span>${p.icd9?`<span class="chip plain" style="opacity:.65" title="ICD-9 crosswalk">≈ ${p.icd9}</span>`:""}<div style="flex:1"><div class="t small">${p.dx}</div></div></div>`).join("")}<button class="btn small" id="add-dx" style="margin-top:8px">+ Add both to the claim</button>`}
      <div class="tiny" style="margin-top:10px">Each diagnosis carries its <b>ICD-9 crosswalk</b> (≈) — the Puerto Rico bridge maps to ICD-9 for payers still requiring it. <a class="pmid" href="${CODING.icd9SourceUrl}" target="_blank" rel="noopener" style="text-indent:0">ICD-9 reference ↗</a></div>
    </div>

    <div class="card">
      <h3>CPT for this visit <span class="chip accent">🤖 agent-suggested</span></h3>
      <p class="small muted" style="margin:0 0 6px">The agent proposes; you verify or override each — it never bills without your sign-off.</p>
      ${CODING.cpt.map((p,i)=>`<div class="rowitem"><span class="chip plain">${p.code}</span>
        <div style="flex:1"><div class="t small">${p.desc}</div><div class="d">${p.why}</div></div>
        ${c.verified[i]?`<span class="chip green">✓ verified</span>`:`<button class="btn small" data-verify-cpt="${i}">Verify</button>`}</div>`).join("")}
    </div>
  </div>
  <div class="section-gap"></div>

  <div class="card"><h3>Claim → biller → clearinghouse</h3>${claimPipeline(ready)}</div>`;
}

/* ==========================================================================
   CME & LICENSURE
   ========================================================================== */
function cmeBookedCredits(){ return CME.catalog.filter(c=>state.cmeBooked[c.id]).reduce((a,c)=>a+c.credits,0); }
function cmeDueBadge(){
  const req = CME.requirements[state.cmeReqIdx] || {};
  const earned = CME.earnedBase + cmeBookedCredits();
  return (req.credits>0 && earned<req.credits && CME.cycleEndsDays<=120) ? "due" : null;
}
function cmeCard(c){
  const booked = state.cmeBooked[c.id];
  return `<div class="card">
    <h3 style="font-size:14px">${c.title}</h3>
    <div class="small muted">${c.format} · ${c.location}<br>${c.dates}</div>
    <div style="margin:8px 0"><span class="chip accent">${c.credits} credits</span> <span class="chip plain">${c.cost===0?"Free":"$"+c.cost}</span> ${c.tag?`<span class="chip plain">${c.tag}</span>`:""}</div>
    ${booked?`<button class="btn" disabled style="opacity:.6">✓ Booked</button>`:`<button class="btn primary" data-cme-book="${c.id}">Book — 1 tap</button>`}
  </div>`;
}
function vCME(){
  const req = CME.requirements[state.cmeReqIdx];
  const booked = CME.catalog.filter(c=>state.cmeBooked[c.id]);
  const bookedCredits = booked.reduce((a,c)=>a+c.credits,0);
  const bookedCost = booked.reduce((a,c)=>a+c.cost,0);
  const earned = CME.earnedBase + bookedCredits;
  const required = req.credits;
  const pct = required>0 ? Math.min(Math.round(earned/required*100),100) : 100;
  const remaining = Math.max(required - earned, 0);
  const ring = pct>=100 ? "var(--green)" : pct>=60 ? "var(--amber)" : "var(--red)";
  const section = (kind, label) => `<h3 style="margin:18px 0 8px">${label}</h3><div class="grid g3">${CME.catalog.filter(c=>c.kind===kind).map(cmeCard).join("")}</div>`;
  return `
  <h1 class="page-title">CME &amp; licensure</h1>
  <p class="page-sub">Stay ahead of your credits, and book CME as easily as a weekend away — not a bureaucratic chore.</p>

  <div class="grid g32">
    <div class="card" style="display:flex; align-items:center; gap:20px">
      <div class="ring" style="--p:${pct}; --ring-color:${ring}"><div><b>${earned}</b><span>of ${required||"—"}</span></div></div>
      <div>
        <div class="chip ${pct>=100?'green':remaining>0&&CME.cycleEndsDays<=120?'amber':'accent'}" style="font-size:14px">${pct>=100?"Requirement met":remaining+" credits to go"}</div>
        <p class="small muted" style="margin:8px 0 0">Cycle ends in <b>${CME.cycleEndsDays} days</b> · ${CME.specialty} · ${CME.boardMOC}.</p>
      </div>
    </div>
    <div class="card">
      <h3>Your requirement</h3>
      <div class="small" style="margin-bottom:6px">State: <select id="cme-state" class="cme-select">${CME.requirements.map((r,i)=>`<option value="${i}" ${i===state.cmeReqIdx?"selected":""}>${r.state}</option>`).join("")}</select></div>
      <div class="small muted">${required>0?`<b>${required}</b> credits every <b>${req.years}</b> years`:"No general hour requirement"}${req.note?` — ${req.note}`:""}</div>
      <div class="tiny" style="margin-top:8px">${CME.boardNote}</div>
    </div>
  </div>

  <div class="section-gap"></div>
  <div class="card">
    <h3>🎯 Suggested from your case mix <span class="chip accent">reads your panel, not a catalog</span></h3>
    <div class="rowlist">
      ${CME_CASEMIX.map(s=>`<div class="rowitem">
        <div class="avatar" style="font-size:11px">${s.share}%</div>
        <div style="flex:1"><div class="t small">${s.topic}</div><div class="d">${s.share}% of your panel carries ${s.cond} — this keeps your CME aligned with the patients you actually see.</div></div>
        <span class="chip plain">${s.credits} cr</span>
      </div>`).join("")}
    </div>
    <div class="evidence">CME that mirrors your case mix keeps you current where it changes outcomes — and licensure stops being one more thing to hold in your head. Registered in Texas? The state tracks reported credits centrally — LumaChart syncs your log automatically, so compliance takes care of itself.</div>
  </div>

  ${booked.length?`<div class="section-gap"></div><div class="card"><h3>Booked <span class="chip green">${bookedCredits} credits · $${bookedCost}</span></h3>
    ${booked.map(c=>`<div class="rowitem"><span class="chip green">✓</span><div style="flex:1"><div class="t small">${c.title}</div><div class="d">${c.location} · ${c.dates} · ${c.credits} credits</div></div><button class="btn ghost small" data-cme-cancel="${c.id}">Cancel</button></div>`).join("")}</div>`:""}

  ${section("online","💻 Look up online CME")}
  ${section("local","📍 Live CME near you")}
  ${section("destination","✈️ Destination CME — restorative &amp; cost-effective")}
  <div class="tiny" style="margin-top:12px">One tap books the program, holds the dates, logs the credits, and — for a destination program — starts the travel plan. Easier than booking a family trip.</div>

  <div class="section-gap"></div>
  <div class="card">
    <h3>🛡 Licensure &amp; your mental health — know your rights</h3>
    <div class="small">Intrusive licensure questions are a documented reason physicians avoid seeking mental-health care.${ev("dyrbyeLic")} The Joint Commission (2020) and the Federation of State Medical Boards recommend boards ask only about conditions that <b>currently impair</b> your ability to practice — not past diagnoses or treatment. Seeking care is strength, and federal law now funds that culture.${aut("breenAct")}</div>
    <div class="tiny" style="margin-top:8px">LumaChart shows this note here — beside your license renewals — because the moment you think about licensure is the moment this fear appears.${aut("sgAdvisory")}</div>
  </div>`;
}

/* ==========================================================================
   OWN YOUR PRACTICE — the entrepreneur layer: doctors should be able to own
   their clinics and manage healthcare, not be priced into employment
   ========================================================================== */
function vPractice(){
  const done = PRACTICE_STEPS.filter((_,i) => state.practice[i]).length;
  return `
  <h1 class="page-title">🏠 Own your practice</h1>
  <p class="page-sub">Doctors should be able to own their clinics and manage healthcare. The EHR should be the reason that's possible — not the expense that makes it impossible.</p>

  <div class="grid g2" style="margin-bottom:16px">
    <div class="card">
      <h3>The independence crisis</h3>
      <div class="small">Private practice is now a <b>minority</b> of U.S. physicians — and cost plus administrative burden are among the leading reasons doctors give up ownership for hospital employment.${aut("amaBenchmark")} Losing control of your own work is itself a burnout driver the Surgeon General names.${aut("sgAdvisory")}</div>
    </div>
    <div class="card">
      <h3>The EHR expense, named</h3>
      <div class="small">Implementing a traditional EHR cost a five-physician primary-care practice about <b>$162,000</b>, plus ~$85,000 in first-year maintenance — before per-interface fees, per-fax fees, and upgrade charges.${ev("fleming")} LumaChart's pricing principle is the opposite: <b>free to start, transparent tiers, and no interface ransom</b> — open FHIR APIs are included, never sold back to you (see <a data-nav-inline="plans" style="cursor:pointer">Plans &amp; value</a> and the information-blocking design rules in <a data-nav-inline="security" style="cursor:pointer">Security</a>).</div>
    </div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <h3>🧰 A practice in a box — everything a 1–3 physician clinic needs</h3>
    <div class="rowlist">
      <div class="rowitem"><span class="chip green">built</span><div class="d" style="flex:1"><b>The clinical day</b> — <a data-nav-inline="dashboard" style="cursor:pointer">Today</a> + Focus mode + <a data-nav-inline="scribe" style="cursor:pointer">Scribe</a>: run on time, chart between patients, no homework.</div></div>
      <div class="rowitem"><span class="chip green">built</span><div class="d" style="flex:1"><b>The front office</b> — staff-triaged <a data-nav-inline="inbox" style="cursor:pointer">batched inbox</a>, delegation protocols, patient portal with online payments.</div></div>
      <div class="rowitem"><span class="chip green">built</span><div class="d" style="flex:1"><b>The back office</b> — <a data-nav-inline="billing" style="cursor:pointer">Encounter &amp; claim</a> with agent-drafted codes, clearinghouse path, <a data-nav-inline="analytics" style="cursor:pointer">revenue analytics</a>.</div></div>
      <div class="rowitem"><span class="chip green">built</span><div class="d" style="flex:1"><b>The compliance binder</b> — Security Risk Analysis + SAFER templates, information-blocking posture, <a data-nav-inline="cme" style="cursor:pointer">CME &amp; licensure</a> tracking.</div></div>
      <div class="rowitem"><span class="chip green">demoed</span><div class="d" style="flex:1"><b>The connections</b> — <a data-nav-inline="fhir" style="cursor:pointer">FHIR sandbox</a>: eligibility &amp; prior-auth, lab/genetic ordering, telehealth.</div></div>
    </div>
    <div class="evidence">Team-based delegation is what makes a small practice sustainable — the model that cut burnout from 53% to 13% while improving vaccination &amp; screening rates.${ev("wright")}</div>
  </div>

  <div class="card">
    <h3>🚀 Startup copilot <span class="chip ${done===PRACTICE_STEPS.length?"green":"accent"}">${done}/${PRACTICE_STEPS.length} done</span></h3>
    <div class="small" style="margin-bottom:8px">The critical path from employed physician to clinic owner — tracked like a care plan: specific, time-bound, owned.</div>
    <div class="rowlist">
      ${PRACTICE_STEPS.map((s,i)=>`<label class="rowitem" style="cursor:pointer">
        <input type="checkbox" data-practice-step="${i}" ${state.practice[i]?"checked":""} style="margin-right:8px">
        <div style="flex:1"><div class="t small">${s.t}</div><div class="d">${s.d}</div></div>
      </label>`).join("")}
    </div>
    <div class="tiny" style="margin-top:8px">Educational guidance, not legal or financial advice — your attorney, accountant and broker stay on the team. LumaChart's job is making sure the EHR is the cheapest, calmest part of the plan.</div>
  </div>`;
}

/* ==========================================================================
   BIBLIOGRAPHY — generated live from the evidence base, so every citation
   added with a feature appears here automatically (CWO tab)
   ========================================================================== */
function bibliographyHTML(){
  const pm = Object.entries(EVIDENCE).sort((a,b) => a[1].cite.localeCompare(b[1].cite));
  const au = Object.entries(AUTHORITIES);
  return `<!doctype html><html><head><meta charset="utf-8"><title>LumaChart — Bibliography</title>
<style>body{font-family:Georgia,'Times New Roman',serif;max-width:820px;margin:40px auto;padding:0 24px;color:#1a2833;line-height:1.6}
h1{font-size:26px;letter-spacing:-.5px}h2{font-size:18px;margin-top:30px;border-bottom:1px solid #c8d2d8;padding-bottom:5px}
ol{padding-left:22px}li{margin-bottom:10px;font-size:14px}.k{color:#8a9aa4;font-size:11px}a{color:#0a6e86}
.meta{color:#5a6c76;font-size:13px}</style></head><body>
<h1>LumaChart — Bibliography &amp; evidence base</h1>
<p class="meta">Generated live from the running software on ${new Date().toLocaleDateString()} ·
${pm.length} peer-reviewed sources (PMID-linked) + ${au.length} authoritative reports, standards &amp; legislation.
Print this page to PDF for a searchable archive.</p>
<h2>Peer-reviewed literature (PubMed)</h2>
<ol>${pm.map(([k,e]) => `<li>${e.cite} <a href="https://pubmed.ncbi.nlm.nih.gov/${e.pmid}/">PMID ${e.pmid}</a> <span class="k">[used as: ${k}]</span></li>`).join("\n")}</ol>
<h2>Reports, standards &amp; legislation</h2>
<ol>${au.map(([k,a]) => `<li>${a.cite} <a href="${a.url}">${a.url}</a> <span class="k">[used as: ${k}]</span></li>`).join("\n")}</ol>
<p class="meta" style="margin-top:32px">LumaChart demonstration prototype · PMIDs verified against PubMed E-utilities when added · lumaehr.com</p>
</body></html>`;
}

function vBiblio(){
  const pm = Object.entries(EVIDENCE).sort((a,b) => a[1].cite.localeCompare(b[1].cite));
  const au = Object.entries(AUTHORITIES);
  return `
  <h1 class="page-title">📚 Annotated Bibliography <span class="chip accent">${pm.length + au.length} sources · live</span></h1>
  <p class="page-sub">Every source LumaChart cites, each with its key finding — an annotated bibliography pulled straight from the running evidence base. Add a cited feature and it appears here automatically. Download once, search forever.</p>

  <div class="card" style="margin-bottom:16px">
    <h3>One searchable, annotated document</h3>
    <div class="small">Generates the complete annotated bibliography — every entry with its finding — as a formatted, hyperlinked document; open it and print to PDF. Every PMID links to PubMed; every report, standard and regulation links to its official source.</div>
    <button class="btn primary" style="margin-top:10px" id="biblio-download">📚 Download annotated bibliography</button>
  </div>

  <div class="card" style="margin-bottom:16px">
    <h3>Peer-reviewed literature <span class="chip plain">${pm.length} PMID-linked</span></h3>
    <div class="rowlist">
      ${pm.map(([k,e]) => `<div class="rowitem"><div style="flex:1"><div class="d">${e.cite}</div></div>
        <a class="pmid" href="https://pubmed.ncbi.nlm.nih.gov/${e.pmid}/" target="_blank" rel="noopener">PMID ${e.pmid}</a></div>`).join("")}
    </div>
  </div>

  <div class="card">
    <h3>Reports, standards &amp; legislation <span class="chip plain">${au.length}</span></h3>
    <div class="rowlist">
      ${au.map(([k,a]) => `<div class="rowitem"><div style="flex:1"><div class="d">${a.cite}</div></div>
        <a class="pmid" href="${a.url}" target="_blank" rel="noopener">${a.label}</a></div>`).join("")}
    </div>
  </div>`;
}

/* ==========================================================================
   FHIR SANDBOX — real R4 round-trips to a public test server
   ========================================================================== */
async function fhirCall(resource, body){
  const t0 = performance.now();
  const res = await fetch(`${FHIR.base}/${resource}`, {
    method:"POST", headers:{ "Content-Type":"application/fhir+json" }, body:JSON.stringify(body),
  });
  const ms = Math.round(performance.now() - t0);
  const json = await res.json();
  const entry = { resource, id:json.id || "—", status:res.status, ms, at:new Date().toLocaleTimeString() };
  state.fhirLog.push(entry);
  return entry;
}

async function runFhirWorkflow(id){
  const wf = FHIR.workflows.find(w => w.id === id);
  const btn = $(`[data-fhir-run="${id}"]`); if (btn){ btn.disabled = true; btn.textContent = "Running…"; }
  const out = $(`#fhir-out-${id}`); if (out) out.innerHTML = `<div class="tiny">Contacting ${FHIR.base} …</div>`;
  try{
    const results = [];
    for (const s of wf.steps) results.push(await fhirCall(s.res, s.body));
    if (out) out.innerHTML = results.map(r => `
      <div class="rowitem">
        <span class="chip ${r.status < 300 ? "green" : "red"}">${r.status}</span>
        <div style="flex:1"><div class="t small">${r.resource} → server id <a href="${FHIR.base}/${r.resource}/${r.id}" target="_blank" rel="noopener">${r.id}</a></div>
        <div class="d">real round-trip: <b>${r.ms} ms</b> · ${r.at}</div></div>
      </div>`).join("") +
      (wf.simulated ? `
      <div class="rowitem"><span class="chip amber">simulated</span>
        <div class="d" style="flex:1"><b>Agent completed the loop:</b> tracked adjudication → ${wf.simulated}
        You reviewed <b>1 outcome — and 0 status updates</b>. Watching a claim is not a job for a human.</div>
      </div>` : "");
    toast("FHIR round-trip complete ⚡", `${wf.title}: ${results.length} resource(s) created on the public sandbox, ${results.reduce((a,r)=>a+r.ms,0)} ms total. Every call is in the Burden lab audit log.`, "green");
  }catch(e){
    if (out) out.innerHTML = `<div class="small" style="color:var(--amber)">Sandbox unreachable (offline or CORS). The exact request that would be sent is shown above — try again when online.</div>`;
  }
  if (btn){ btn.disabled = false; btn.textContent = "Run live ⚡"; }
}

function vFhir(){
  return `
  <h1 class="page-title">⚡ FHIR sandbox <span class="chip green">live · real server</span> ${reg("g10","g9")}</h1>
  <p class="page-sub">Interoperability you can watch happen: LumaChart posts real FHIR R4 resources to the public HAPI test server and shows the server's response — payer prior-auth, lab &amp; genetic ordering, telehealth.${aut("onc2020")}${aut("nam2019")}</p>

  <div class="card" style="margin-bottom:16px">
    <h3>What's real, what's simulated</h3>
    <div class="small">${FHIR.honesty}</div>
    <div class="tiny" style="margin-top:8px">Endpoint: <b>${FHIR.base}</b> · every call is timed and logged to the <a data-nav-inline="burden" style="cursor:pointer">Burden lab</a>. These are the exchanges the <b>Medicare Promoting Interoperability Program</b> requires of hospitals — certified-EHR interoperability is a payment condition, not a nice-to-have.${aut("cmsPI")}</div>
  </div>

  ${FHIR.workflows.map(w => `
  <div class="card" style="margin-bottom:16px">
    <h3>${w.icon} ${w.title}</h3>
    <div class="small" style="margin-bottom:6px">${w.desc}</div>
    <div class="tiny" style="margin-bottom:10px">Manual baseline: ${w.baseline}${aut(w.baselineAuth)}</div>
    ${w.steps.map(s => `<details style="margin-bottom:6px"><summary class="tiny" style="cursor:pointer">Request JSON — ${s.res}</summary><pre class="json">${JSON.stringify(s.body, null, 1)}</pre></details>`).join("")}
    <button class="btn primary small" data-fhir-run="${w.id}">Run live ⚡</button>
    <div id="fhir-out-${w.id}" class="rowlist" style="margin-top:10px"></div>
  </div>`).join("")}`;
}

/* ==========================================================================
   BURDEN LAB — measure the reduction, don't just claim it
   ========================================================================== */
/* --- Time-to-task harness: the demo measures itself (real seconds + real clicks).
       The floating pill lives on document.body, outside render(), so it survives
       re-renders; its Done handler is attached directly to the node. --- */
let _taskClicksWired = false;
function startTimedTask(id){
  const t = TIMED_TASKS.find(x => x.id === id); if (!t) return;
  if (!_taskClicksWired){
    document.addEventListener("click", e => {
      if (state.taskTimer && !(e.target.closest && e.target.closest("#task-pill"))) state.taskTimer.clicks++;
    }, true);
    _taskClicksWired = true;
  }
  state.taskTimer = { id, start: performance.now(), clicks: 0 };
  const r = Object.keys(VIEWS).find(role => VIEWS[role][t.view]);          // task starts in the clinician role
  if (r && r !== state.role){ state.role = r; $$(".role-btn").forEach(x => x.classList.toggle("active", x.dataset.role === r)); updateFocusUI(); }
  state.view = t.view; render();
  showTaskPill(t);
}
function showTaskPill(t){
  removeTaskPill();
  const pill = document.createElement("div");
  pill.id = "task-pill";
  pill.style.cssText = "position:fixed; left:16px; bottom:16px; z-index:9999; display:flex; gap:10px; align-items:center; background:var(--surface2); border:1px solid var(--line-strong); border-radius:12px; padding:10px 14px; box-shadow:0 8px 24px rgba(0,0,0,.35); font-size:13px; color:var(--text); max-width:min(420px, calc(100vw - 32px))";
  pill.innerHTML = `<span>⏱ timing: <b>${t.name}</b> — click 'Done' when finished</span><button class="btn primary small" data-task-done>Done</button>`;
  pill.querySelector("[data-task-done]").addEventListener("click", finishTimedTask);
  document.body.appendChild(pill);
}
function removeTaskPill(){ const p = $("#task-pill"); if (p) p.remove(); }
function finishTimedTask(){
  const tm = state.taskTimer; if (!tm) return;
  const t = TIMED_TASKS.find(x => x.id === tm.id);
  const secs = Math.round((performance.now() - tm.start) / 100) / 10;
  state.taskResults.push({ task: t.name, secs, clicks: tm.clicks });
  state.taskTimer = null;
  removeTaskPill();
  state.role = "cwo"; $$(".role-btn").forEach(x => x.classList.toggle("active", x.dataset.role === "cwo")); updateFocusUI();
  state.view = "burden"; render();
  toast("Measured ⏲", `${t.name}: ${secs} s · ${tm.clicks} clicks — recorded in the Burden lab. Your numbers, measured live.`, "green");
}

function vBurden(){
  const b = state.burnoutSelf;
  const avgPajama = Math.round(PAJAMA_14D.reduce((a,x)=>a+x,0)/PAJAMA_14D.length);
  const chip = v => v==null ? `<span class="chip plain">not taken</span>`
    : `<span class="chip ${v >= BURNOUT_ITEM.threshold ? "amber" : "green"}">${v}/5 ${v >= BURNOUT_ITEM.threshold ? "· burnout-positive" : ""}</span>`;
  return `
  <h1 class="page-title">⏱ Burden lab</h1>
  <p class="page-sub">The claim isn't “less burden” — the claim is <b>measured</b> less burden: EHR audit-log time metrics against manual baselines, plus a validated burnout instrument, pre and post.${aut("sgAdvisory")}${aut("x25")}</p>

  <div class="card" style="margin-bottom:16px">
    <h3>📐 The measurement protocol</h3>
    <div class="rowlist">
      ${BURDEN_PROTOCOL.map((p,i)=>`<div class="rowitem"><div class="avatar">${i+1}</div>
        <div style="flex:1"><div class="t small">${p.step}</div><div class="d">${p.d}</div></div></div>`).join("")}
    </div>
    <div class="evidence">Audit-log methodology per the landmark time studies: ~2 hr of EHR/desk work per 1 hr of direct care,${ev("sinskyTM")} and ~1.4 hr/day of after-hours “pajama time.”${ev("arndt")} National goal: documentation burden to 25% of current within 5 years.${aut("x25")} Instrument selection follows the NAM well-being program's validated-tools compendium.${aut("namWellbeing")}</div>
  </div>

  <div class="grid g2" style="margin-bottom:16px">
    <div class="card">
      <h3>🌙 Audit-log metrics — this demo panel</h3>
      <div class="metric"><div class="v">${avgPajama} <span style="font-size:15px">min/day</span></div><div class="l">synthetic 14-day after-hours average (vs ~84 min/day national${ev("arndt")})</div></div>
      <div class="bar" style="margin-top:8px"><i class="green" style="width:${Math.min(Math.round(avgPajama/84*100),100)}%"></i></div>
      <div class="tiny" style="margin-top:8px">Demo data, labeled as such. In production these come straight from vendor audit logs — the same source the studies used.</div>
    </div>
    <div class="card">
      <h3>⚡ Measured FHIR transactions — this session</h3>
      ${state.fhirLog.length ? `<div class="rowlist">${state.fhirLog.slice(-6).map(r=>`
        <div class="rowitem"><span class="chip ${r.status<300?"green":"red"}">${r.status}</span>
        <div style="flex:1"><div class="t small">${r.resource} <span class="tiny">#${r.id}</span></div><div class="d">${r.ms} ms · ${r.at}</div></div></div>`).join("")}</div>
        <div class="tiny" style="margin-top:8px">vs. manual prior auth ≈ 21 min — electronic saves ~12 min per transaction (CAQH 2020).${aut("sgAdvisory")}</div>`
      : `<div class="small muted">No calls yet — run a workflow in the <a data-nav-inline="fhir" style="cursor:pointer">FHIR sandbox</a> and real timings appear here.</div>`}
      ${state.fhirLog.length ? `<button class="btn ghost small" style="margin-top:10px" id="audit-download">Download audit log (JSON)</button>` : ""}
    </div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <h3>⏲ Time-to-task — measure this demo yourself <span class="chip green">measured live</span></h3>
    <div class="small muted" style="margin-bottom:8px">Pick a task, do it, hit Done — LumaChart counts your real clicks and seconds in this browser. No reference numbers ship with this table: whatever you measure is the data.</div>
    <div class="rowlist">
      ${TIMED_TASKS.map(t=>`<div class="rowitem">
        <div style="flex:1"><div class="t small">${t.name}</div><div class="d">${t.hint}</div></div>
        ${state.taskTimer && state.taskTimer.id===t.id
          ? `<span class="chip amber">timing…</span>`
          : `<button class="btn ghost small" data-task-start="${t.id}">Start timing</button>`}
      </div>`).join("")}
    </div>
    ${state.taskResults.length ? `<div class="divider"></div>
      ${state.taskResults.map(r=>`<div class="small" style="margin-bottom:4px">${r.task} — <b>${r.secs} s</b> · <b>${r.clicks} click${r.clicks===1?"":"s"}</b> · measured live</div>`).join("")}`
    : `<div class="tiny" style="margin-top:8px">No measurements yet this session.</div>`}
    <div class="evidence">Usability is measurable — click counts and task times vary widely across EHRs and it affects safety.${ev("ratwani")}</div>
  </div>

  <div class="card">
    <h3>🔥 Single-item burnout measure <span class="chip plain">validated · private to you</span></h3>
    <div class="small" style="margin-bottom:8px">${BURNOUT_ITEM.q}${ev("dolan")} A score of ${BURNOUT_ITEM.threshold}+ is burnout-positive. Production studies pair this with the MBI, Mini-Z, or Stanford PFI (licensed instruments, named — not reproduced).</div>
    ${BURNOUT_ITEM.anchors.map((a,i)=>`
      <label class="rowitem" style="cursor:pointer"><input type="radio" name="biq" value="${i+1}" style="margin-right:8px">
      <div class="d" style="flex:1"><b>${i+1}.</b> ${a}</div></label>`).join("")}
    <div style="display:flex; gap:10px; margin-top:12px; flex-wrap:wrap">
      <button class="btn primary small" data-burnout-save="baseline">Save as baseline</button>
      <button class="btn ghost small" data-burnout-save="followup">Save as 90-day follow-up</button>
    </div>
    <div class="small" style="margin-top:12px">Baseline: ${chip(b.baseline)} &nbsp; 90-day: ${chip(b.followup)}
      ${b.baseline!=null && b.followup!=null ? `&nbsp; Δ <b>${b.followup - b.baseline > 0 ? "+" : ""}${b.followup - b.baseline}</b>` : ""}</div>
    <div class="tiny" style="margin-top:8px">Stored only on this device. Same privacy promises as Canary: never wired to productivity or employment decisions.</div>
  </div>`;
}

/* ==========================================================================
   CHIEF WELLNESS OFFICER — AMA Joy in Medicine
   ========================================================================== */
// Domains, with the Support domain flipped to met once its intervention is executed.
function effectiveDomains(){
  return AMA.domains.map(d => (d.key==="Support" && state.supportExecuted)
    ? { ...d, met:true, evidence:"Formal peer-support program launched (executed)." } : d);
}
function domainsMet(){ return effectiveDomains().filter(d=>d.met).length; }

function vJoy(){
  const a = AMA, cur = a.tiers.indexOf(a.currentTier);
  return `
  <h1 class="page-title">Joy in Medicine <span class="muted" style="font-size:15px">organizational well-being</span></h1>
  <p class="page-sub">${a.program} — the system-level program a Chief Wellness Officer runs. LumaChart supplies the measurement.</p>

  <div class="card" style="margin-bottom:16px">
    <h3>🗺 Field notes — what 20 accelerator institutions actually did</h3>
    <div class="small">NAM's inaugural Change Maker cohort published their results. The patterns LumaChart is built around are the ones that worked in the field:${aut("namAccel")}</div>
    <div class="rowlist" style="margin-top:8px">
      <div class="rowitem"><span class="chip green">✓ built</span><div class="d" style="flex:1"><b>Ambient documentation was the #1 measured technology win</b> — ~170 min/week returned and best-in-class “pajama time” at Ochsner; significant after-hours and cognitive-load reductions at Michigan Medicine (n=196). LumaChart: Scribe + Burden lab.</div></div>
      <div class="rowitem"><span class="chip green">✓ built</span><div class="d" style="flex:1"><b>Leader-level well-being data</b> — Utah gives every leader a dashboard linking engagement, burnout, psychological safety, turnover and patient experience. LumaChart: this CWO role + equity-disaggregated extract.</div></div>
      <div class="rowitem"><span class="chip green">✓ built</span><div class="d" style="flex:1"><b>Ease-of-practice committees</b> (MD Anderson) and efficiency as the #1 burnout driver (UNM: 40% faculty burnout) — LumaChart: “kill a stupid task” + the one-way design law.</div></div>
      <div class="rowitem"><span class="chip amber">candidate</span><div class="d" style="flex:1"><b>Crisis &amp; onboarding infrastructure</b> — Code Lavender / Stress First Aid (Utah), same-day mental health (OhioHealth), and Nebraska's “Wellness Welcome” (a psychiatrist personally greets every new physician). On the roadmap.</div></div>
    </div>
    <div class="tiny" style="margin-top:8px">Honest note from the field: UC San Diego measured individual burnout <i>rising</i> 6 points despite real investment — which is exactly why LumaChart measures instead of claims. Full digest: docs/NAM-ACCELERATOR-DIGEST.md.</div>
  </div>

  <div class="grid g2">
    <div class="card">
      <h3>Recognition level</h3>
      <div style="display:flex; gap:8px; align-items:center; margin:10px 0">
        ${a.tiers.map((t,i)=>`<span class="chip ${i===cur?(t==='Gold'?'amber':t==='Silver'?'accent':'plain'):'plain'}" style="font-size:14px; ${i===cur?'font-weight:800':'opacity:.55'}">${i<cur?'✓ ':''}${t}</span>`).join('<span style="color:var(--text-3)">→</span>')}
      </div>
      <div class="small muted">Current: <b>${a.currentTier}</b>. ${a.nextTierNeeds}</div>
      <div class="tiny" style="margin-top:8px">Based on the AMA Joy in Medicine framework. <a class="pmid" href="${a.sourceUrl}" target="_blank" rel="noopener" style="text-indent:0">AMA guidelines ↗</a></div>
    </div>
    <div class="card">
      <h3>Leadership line</h3>
      <div class="rowitem"><div style="flex:1"><div class="t small">${a.cwo.title}</div><div class="d">reports to ${a.cwo.reportsTo}</div></div></div>
      <div class="tiny" style="margin-top:6px">A dedicated wellness executive with a direct line to the C-suite is itself a recognition criterion — and the administrator who runs this tool at each health system.</div>
    </div>
  </div>
  <div class="section-gap"></div>

  <div class="card">
    <h3>Recognition domains <span class="chip ${domainsMet()>=5?'green':'amber'}">${domainsMet()} of 6 met · need 5</span></h3>
    ${effectiveDomains().map(d=>`<div class="rowitem"><span class="chip ${d.met?'green':'plain'}" style="min-width:26px; text-align:center">${d.met?'✓':'…'}</span><div style="flex:1"><div class="t small">${d.key}</div><div class="d">${d.evidence}</div></div></div>`).join('')}
    <div class="evidence">Efficiency of Practice Environment is where LumaChart is strongest — EHR8, WOW8 and IB-Time8 quantify documentation burden, and Canary + team choreography reduce it. Build the evidence trail on the <b>Action plan</b>, then generate the report.</div>
    <div style="display:flex; gap:10px; margin-top:10px; flex-wrap:wrap"><button class="btn" data-nav-inline="actions">Action plan →</button><button class="btn primary" data-nav-inline="report">Request data extract report →</button></div>
  </div>`;
}

function vEhr8(){
  const m = AMA.metrics;
  const maxE = Math.max(...m.map(x=>x.ehr8)), maxW = Math.max(...m.map(x=>x.wow8)), maxI = Math.max(...m.map(x=>x.ibt8));
  return `
  <h1 class="page-title">EHR8 · WOW8 · IB-Time8</h1>
  <p class="page-sub">The AMA program's efficiency metrics: time in the record, work that follows clinicians home, and time buried in the inbox.</p>

  <div class="grid g2" style="margin-bottom:16px">
    <div class="card">
      <h3>💛 Sense of feeling valued <span class="chip plain">quarterly pulse</span></h3>
      <div class="metric"><div class="v">${VALUED.pct}%</div><div class="l">${VALUED.item} agree/strongly agree · <span style="color:var(--green)">${VALUED.delta}</span></div></div>
      <div class="evidence">Feeling valued measurably buffered workload stress in pandemic-era studies, and accreditation guidance now suggests tracking it beside burnout on organizational dashboards.${aut("sgAdvisory")}${aut("nam2019")} Synthetic demo value.</div>
    </div>
    <div class="card">
      <h3>⚖ Well-being, disaggregated <span class="chip plain">aggregate-only · confidential</span></h3>
      <select class="cme-select" data-equity-dept style="margin-bottom:8px">
        ${Object.entries(EQUITY_BY_DEPT).map(([k,d])=>`<option value="${k}" ${state.equityDept===k?"selected":""}>${d.label}</option>`).join("")}
      </select>
      ${(EQUITY_BY_DEPT[state.equityDept]||EQUITY_BY_DEPT.all).rows.map(r=>`<div class="small" style="margin-bottom:6px"><b>${r.group}:</b> ${r.segs.map(s=>`${s[0]} <span class="chip plain">${s[1]}</span>`).join(" ")}</div>`).join("")}
      <div class="evidence">Burnout is not evenly distributed — the Advisory calls for well-being data disaggregated by role, gender, and race/ethnicity so interventions can be targeted, never individual-level.${aut("sgAdvisory")} Per-department view follows the Utah leader-dashboard pattern.${aut("namAccel")} Synthetic demo values (burnout-positive rate by group).</div>
    </div>
  </div>

  <div class="grid g3" style="margin-bottom:16px">
    <div class="card"><h3>EHR8</h3><p class="small muted" style="margin:0">Total <b>EHR time</b> per 8 hours of scheduled patient time.</p></div>
    <div class="card"><h3>WOW8</h3><p class="small muted" style="margin:0"><b>Work Outside of Work</b> ("pajama time") per 8 hours scheduled.</p></div>
    <div class="card"><h3>IB-Time8</h3><p class="small muted" style="margin:0">Time on the <b>inbox</b> per 8 hours scheduled.</p></div>
  </div>

  <div class="card">
    <h3>By specialty <span class="chip plain">minutes per 8 hrs scheduled · not clock time</span></h3>
    ${m.map(x=>`
      <div class="rowitem" style="align-items:flex-start">
        <div style="flex:1">
          <div class="t small">${x.specialty} <span class="tiny">· N=${x.n}</span></div>
          <div class="small muted" style="margin:4px 0 2px">EHR8 <b>${x.ehr8}</b><div class="bar" style="margin-top:3px"><i class="${x.ehr8>=150?'red':x.ehr8>=100?'amber':'green'}" style="width:${Math.round(x.ehr8/maxE*100)}%"></i></div></div>
          <div class="small muted" style="margin-bottom:2px">WOW8 <b>${x.wow8}</b><div class="bar" style="margin-top:3px"><i class="${x.wow8>=80?'red':x.wow8>=50?'amber':'green'}" style="width:${Math.round(x.wow8/maxW*100)}%"></i></div></div>
          <div class="small muted">IB-Time8 <b>${x.ibt8}</b><div class="bar" style="margin-top:3px"><i class="accent" style="width:${Math.round(x.ibt8/maxI*100)}%"></i></div></div>
        </div>
        ${x.ehr8===maxE?'<span class="chip red">highest EHR burden</span>':''}
      </div>`).join('')}
    <div class="tiny" style="margin-top:8px">Normalized for part-time FTE; measured against scheduled patient time. IB-Time8 illustrative (~24% of EHR8). Extraction methods (Epic / Oracle Health) per Appendix C.</div>
    <div class="evidence">OB-GYN and Internal Medicine carry the heaviest load — target them first. These org figures <b>aggregate the same per-clinician signals Canary tracks privately</b>, de-identified: no individual is singled out, and nothing feeds productivity or employment decisions.</div>
  </div>`;
}

function vReport(){
  const a = AMA, met = domainsMet();
  return `
  <h1 class="page-title">Joy in Medicine — data extract report</h1>
  <p class="page-sub">One click assembles your submission for the AMA Joy in Medicine Health System Recognition Program — no manual data pull.</p>

  <div class="grid g32">
    <div class="card">
      <h3>Report contents</h3>
      <div class="rowitem"><span class="chip accent" style="min-width:26px;text-align:center">1</span><div style="flex:1"><div class="t small">Organization &amp; eligibility</div><div class="d">${a.orgName} · ${a.orgHQ} · applying for <b>${a.applyingFor}</b> · assessment ${a.assessmentDate}</div></div></div>
      <div class="rowitem"><span class="chip accent" style="min-width:26px;text-align:center">2</span><div style="flex:1"><div class="t small">Six domains — evidence</div><div class="d">${met} of 6 met (5 required); auto-populated from LumaChart activity</div></div></div>
      <div class="rowitem"><span class="chip accent" style="min-width:26px;text-align:center">3</span><div style="flex:1"><div class="t small">EHR data extraction (Appendix C)</div><div class="d">EHR8 · WOW8 · IB-Time8 by specialty, per 8 hrs scheduled</div></div></div>
    </div>
    <div class="card">
      <h3>Submit</h3>
      <p class="small muted" style="margin:0 0 10px">Generate the report, review it, then submit to the AMA application portal.</p>
      <button class="btn primary" id="gen-joy-report">⬇ Generate &amp; download report</button>
      <div style="margin-top:10px"><button class="btn" id="submit-joy-report">Submit to AMA portal</button></div>
      <div class="tiny" style="margin-top:10px">Confirm current criteria &amp; deadlines at <a class="pmid" href="${a.sourceUrl}" target="_blank" rel="noopener" style="text-indent:0">ama-assn.org ↗</a>. Applied on behalf of the health system; only executed activities count.</div>
    </div>
  </div>
  <div class="section-gap"></div>
  <div class="card">
    <h3>EHR data extract preview <span class="chip plain">min per 8 hrs scheduled</span></h3>
    <div class="tablewrap"><table class="reg">
      <tr><th>Specialty</th><th>N</th><th>EHR8</th><th>WOW8</th><th>IB-Time8</th></tr>
      ${a.metrics.map(m=>`<tr><td class="cap">${m.specialty}</td><td>${m.n}</td><td>${m.ehr8}</td><td>${m.wow8}</td><td>${m.ibt8}</td></tr>`).join('')}
    </table></div>
  </div>`;
}

function generateJoyReport(){
  const a = AMA, met = domainsMet(), today = new Date().toISOString().slice(0,10);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Joy in Medicine Data Extract Report — ${a.orgName}</title>
<style>body{font-family:-apple-system,Arial,sans-serif;max-width:820px;margin:32px auto;color:#18262f;padding:0 20px}
h1{font-size:22px}h2{font-size:15px;margin-top:26px;border-bottom:2px solid #2FB3C6;padding-bottom:4px}
table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}th,td{border:1px solid #dfe6ea;padding:7px 9px;text-align:left}
th{background:#f2f8f9}.muted{color:#5d6e79;font-size:12px}.met{color:#2e8b62;font-weight:700}.pend{color:#b8503c;font-weight:700}</style></head><body>
<h1>Joy in Medicine&reg; Data Extract Report</h1>
<div class="muted">Prepared by LumaChart · ${today} · for submission to the AMA Joy in Medicine Health System Recognition Program</div>
<h2>1 &middot; Organization &amp; eligibility</h2>
<table>
<tr><td>Health system</td><td>${a.orgName}</td></tr>
<tr><td>Headquarters</td><td>${a.orgHQ}</td></tr>
<tr><td>Primary contact</td><td>${a.contact}, reports to ${a.cwo.reportsTo}</td></tr>
<tr><td>Applying for</td><td>${a.applyingFor}</td></tr>
<tr><td>Well-being assessment (within 3 yrs)</td><td>${a.assessmentTool} &mdash; ${a.assessmentDate}</td></tr></table>
<h2>2 &middot; Recognition domains (${met} of 6 met; 5 required)</h2>
<table><tr><th>Domain</th><th>Status</th><th>Evidence</th></tr>
${effectiveDomains().map(d=>`<tr><td>${d.key}</td><td class="${d.met?'met':'pend'}">${d.met?'Met':'In progress'}</td><td>${d.evidence}</td></tr>`).join('')}</table>
<h2>3 &middot; EHR data extraction (Appendix C)</h2>
<p class="muted">Minutes per 8 hours of scheduled patient time (not clock time), normalized for part-time FTE.</p>
<table><tr><th>Specialty</th><th>N</th><th>EHR8</th><th>WOW8</th><th>IB-Time8</th></tr>
${a.metrics.map(m=>`<tr><td>${m.specialty}</td><td>${m.n}</td><td>${m.ehr8}</td><td>${m.wow8}</td><td>${m.ibt8}</td></tr>`).join('')}</table>
<p class="muted">EHR8 = total EHR time; WOW8 = Work Outside of Work; IB-Time8 = inbox time. IB-Time8 illustrative (~24% of EHR8, per Arndt et al. 2017). Extraction methods for Epic / Oracle Health per Appendix C of the AMA guidelines.</p>
<p class="muted" style="margin-top:22px">Demonstration report — synthetic data. Confirm current criteria and deadlines at ama-assn.org. Submitted on behalf of the health system; only executed activities count toward recognition.</p>
</body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type:"text/html" }));
  const link = document.createElement("a"); link.href = url;
  link.download = "Joy-in-Medicine-Data-Extract-Report.html"; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  toast("Report generated 📄", "Joy in Medicine data extract downloaded — open it to review or print to PDF, then submit to the AMA.", "green");
}

function vActions(){
  const iv = AMA.interventions;
  const isExec = x => x.status==="executed" || (x.key==="support" && state.supportExecuted);
  const card = x => `<div class="rowitem">
    <span class="chip ${isExec(x)?'green':x.status==='in-progress'?'amber':'plain'}">${isExec(x)?'✓ executed':x.status}</span>
    <div style="flex:1"><div class="t small">${x.t}</div><div class="d">${x.domain}${x.metric!=='—'?' · targets '+x.metric:''} · ${x.impact}</div></div>
    ${(x.key==="support" && !state.supportExecuted)?`<button class="btn small" id="exec-support">Mark executed</button>`:''}
  </div>`;
  const executed = iv.filter(isExec), pending = iv.filter(x=>!isExec(x));
  return `
  <h1 class="page-title">Well-being action plan</h1>
  <p class="page-sub">Measurement → intervention → recognition. Only <b>executed</b> activities count toward AMA recognition — this is your evidence trail.</p>
  <div class="card"><h3>Executed <span class="chip green">${executed.length}</span></h3>${executed.map(card).join('')}</div>
  ${pending.length?`<div class="section-gap"></div><div class="card"><h3>Planned / in progress</h3>${pending.map(card).join('')}<div class="tiny" style="margin-top:8px">Executing the peer-support program completes the Support domain — moving you from 5 of 6 to 6 of 6.</div></div>`:''}
  <div class="section-gap"></div>
  <div class="card">
    <h3>🚨 Crisis &amp; connection protocols <span class="chip amber">candidate — from the NAM accelerator field results</span></h3>
    <div class="rowlist">
      <div class="rowitem"><span class="chip plain">respond</span><div class="d" style="flex:1"><b>Code Lavender–style rapid response</b> — a unit-level support activation after hard events (a death, an assault, an error), from the Utah field playbook.${aut("namAccel")}</div></div>
      <div class="rowitem"><span class="chip plain">train</span><div class="d" style="flex:1"><b>Stress First Aid training, tracked</b> — peer-delivered psychological first aid for staff, with completion tracked here like any other executed intervention.${aut("namAccel")}</div></div>
      <div class="rowitem"><span class="chip plain">pair</span><div class="d" style="flex:1"><b>Battle-Buddy pairing</b> — rapid peer-support pairing within a department; already live in the <a data-nav-inline="wellness" style="cursor:pointer">Wellness Center</a>.${ev("albott")}</div></div>
      <div class="rowitem"><span class="chip plain">welcome</span><div class="d" style="flex:1">🤝 <b>Wellness Welcome</b> — every new clinician gets a personal 30-minute welcome meeting in year one (a psychiatrist-led model from the field).${aut("namAccel")}</div></div>
    </div>
  </div>
  ${state.supportExecuted?`<div class="evidence" style="margin-top:16px">All six domains now carry executed evidence — you're positioned to apply at a higher level. Regenerate the data extract report to include it.</div>`:''}`;
}

/* ==========================================================================
   ENTERPRISE INTEGRATION & NATIONWIDE EXCHANGE
   ========================================================================== */
function vEnterprise(){
  const e = ENTERPRISE;
  const chip = s => s==="proto" ? '<span class="chip green">prototype</span>'
                  : s==="partner" ? '<span class="chip amber">partner</span>'
                  : '<span class="chip plain">planned</span>';
  return `
  <h1 class="page-title">Enterprise &amp; nationwide exchange</h1>
  <p class="page-sub">One longitudinal record across every care setting, one patient portal, and query/retrieve to virtually any site in the country.</p>

  <div class="banner" style="background:linear-gradient(100deg,var(--accent-soft),var(--surface2)); border:1px solid var(--line-strong); color:var(--text)">
    <h3 style="color:var(--text)">One record, every setting → one FHIR source of truth → nationwide exchange.</h3>
    <p style="color:var(--text-2)">Inpatient, outpatient, ED, pharmacy, lab and imaging feed a single longitudinal record on a FHIR-native core with an enterprise master patient index — then that record joins the national network.</p>
  </div>

  <div class="grid g2">
    <div class="card"><h3>One record, every setting</h3>
      ${e.settings.map(s=>`<div class="rowitem">${chip(s.status)}<div style="flex:1"><div class="t small">${s.t}</div><div class="d">${s.std}${s.note?' · '+s.note:''}</div></div></div>`).join('')}
    </div>
    <div class="card"><h3>Integration engine</h3>
      ${e.engine.map(x=>`<div class="rowitem"><div style="flex:1"><div class="t small">${x.t}</div><div class="d">${x.d}</div></div></div>`).join('')}
    </div>
  </div>
  <div class="section-gap"></div>

  <div class="card"><h3>Nationwide record exchange <span class="chip accent">TEFCA-anchored</span></h3>
    ${e.exchange.map(x=>`<div class="rowitem"><div style="flex:1"><div class="t small">${x.t}</div><div class="d">${x.d}</div></div></div>`).join('')}
    <div class="evidence">Once connected to a QHIN under TEFCA, LumaChart can discover and retrieve a patient's records from any other participating provider nationwide — with Carequality/CommonWell during the transition. Maps to §170.315(b)(1) transitions of care, (h)(1) Direct, and (g)(10) FHIR — see <b>docs/ENTERPRISE-INTEGRATION-PLAN.md</b> and the ONC roadmap.</div>
  </div>
  <div class="section-gap"></div>

  <div class="grid g2">
    <div class="card"><h3>Scheduling</h3><p class="small muted" style="margin:0">${e.scheduling}</p></div>
    <div class="card"><h3>Patient, everywhere</h3><p class="small muted" style="margin:0">${e.portal}</p></div>
  </div>`;
}

/* ==========================================================================
   COMPETITIVE POSITIONING — best ideas, improved with evidence
   ========================================================================== */
function vCompete(){
  const c = COMPETE;
  return `
  <h1 class="page-title">Best ideas, improved</h1>
  <p class="page-sub">The market is crowded and the products look alike. LumaChart takes the strongest idea from each incumbent — and adds the one thing none of them centers.</p>

  <div class="banner" style="background:linear-gradient(100deg,#0f2a33,#1d4a4f); color:#e7f4f6">
    <h3 style="color:#fff">Not "AI on the EHR." Evidence on the EHR.</h3>
    <p style="color:#bcd8de">${c.thesis}</p>
  </div>

  <div class="card" style="margin:16px 0">
    <h3>⚖ The design laws — one way, minimal, nothing redundant</h3>
    <div class="small" style="margin-bottom:8px">Redundant and inefficient health-IT workflows are among the most frequently cited sources of frustration for health workers.${aut("namWellbeing")}${aut("nam2019")} So LumaChart is governed by three laws, enforced on every feature before it ships:</div>
    <div class="rowlist">
      <div class="rowitem"><div class="avatar">1</div><div style="flex:1"><div class="t small">One way to do everything</div><div class="d">Each task has exactly one canonical route. Many doors may lead to it — but there is never a second copy of the task. (See the inbox's one-route rule: a result is one actionable item, not four.)</div></div></div>
      <div class="rowitem"><div class="avatar">2</div><div style="flex:1"><div class="t small">As minimal as possible to get the job done</div><div class="d">Focus mode is this law's interface: one patient, one action, silence around it. Anything that doesn't serve the task in front of the clinician must justify its pixels.</div></div></div>
      <div class="rowitem"><div class="avatar">3</div><div style="flex:1"><div class="t small">Redundancy dies on sight</div><div class="d">“Kill a stupid task” gives every staff member a nomination button; leadership must answer. Duplicate documentation is a defect, not a habit.${ev("ashton")}</div></div></div>
    </div>
    <div class="evidence">These aren't aesthetics — reducing workflow redundancy and cognitive load is the specific health-IT ask of the NAM consensus report, the Surgeon General's advisory, and the ONC burden-reduction strategy.${aut("sgAdvisory")}${aut("onc2020")} It is also Priority Area 5 of the National Plan for Health Workforce Well-Being: health IT that is user-friendly, affordable, and co-designed with its users.${aut("natPlan")}</div>
  </div>

  <div class="card" style="margin:0 0 16px">
    <h3>📉 The usability case — grade F is the incumbent baseline</h3>
    <div class="rowlist">
      <div class="rowitem"><span class="chip red">F</span><div class="d" style="flex:1">Physicians score EHR usability <b>45.9/100</b> on the System Usability Scale — a grade F, in the bottom 9% of all technologies studied. Each 1-point improvement ≈ <b>3% lower odds of burnout</b>.${ev("melnickSUS")}</div></div>
      <div class="rowitem"><span class="chip amber">RN</span><div class="d" style="flex:1">Across 12,004 nurses in 343 hospitals, poorer EHR usability meant higher odds of burnout (<b>OR 1.41</b>), dissatisfaction (1.61), and intent to leave (1.31).${ev("kutneyLee")} Poor usability also tracks with stress and cognitive failures.${ev("kaihlanen")}</div></div>
      <div class="rowitem"><span class="chip amber">⚠</span><div class="d" style="flex:1">Usability is a <b>patient-safety</b> issue: across sites running the same big-vendor products, clicks, task time and error rates vary widely.${ev("ratwani")}</div></div>
      <div class="rowitem"><span class="chip plain">🌍</span><div class="d" style="flex:1">Even flagship implementations struggle: in Finland's national rollout of a leading U.S. EHR, only <b>4.7% of physicians</b> agreed patient information was easy to access, and only 9.3% agreed it improved care quality.${ev("hertzum")} (Measured with a validated national instrument.${ev("kaipio")})</div></div>
    </div>
    <div class="evidence">This is why usability isn't a polish item at LumaChart — it's the product. The Burden lab exists to prove the SUS score and the audit-log minutes move, not just claim it.</div>
  </div>

  <div class="card">
    <h3>Take the best, add the evidence</h3>
    <div class="tablewrap"><table class="reg">
      <tr><th>Incumbent</th><th>Best-fit market</th><th>What makes it stand out</th><th>What LumaChart takes &amp; improves</th></tr>
      ${c.rows.map(r=>`<tr><td class="cap">${r.v}</td><td>${r.market}</td><td>${r.standout}</td><td>${r.take}</td></tr>`).join('')}
    </table></div>
    <div class="tiny" style="margin-top:8px">Market positions are approximate, factual industry facts; the landscape is fluid. LumaChart differentiates on <b>evidence</b>, not vendor branding. See <b>docs/COMPETITIVE-LANDSCAPE.md</b>.</div>
  </div>`;
}

/* ==========================================================================
   ECOSYSTEM CONNECTIONS — payers · specialty/genetic labs · telehealth
   ========================================================================== */
function vEcosystem(){
  const E = ECOSYSTEM;
  return `
  <h1 class="page-title">Ecosystem connections <span class="chip green">connected</span></h1>
  <p class="page-sub">No EHR is an island. LumaChart plugs into the health plans, specialty labs and telehealth networks your patients depend on — on open standards.</p>

  <div class="card" style="margin-bottom:16px">
    <h3>🏦 Health plans / payers</h3>
    <p class="small muted" style="margin:0 0 6px">Share data, cut administrative burden, and get patients to care faster — no faxes, no hold music.</p>
    ${E.payers.map(p=>`<div class="rowitem"><span class="chip green">✓</span><div style="flex:1"><div class="t small">${p.t}</div><div class="d">${p.d}</div></div><span class="chip plain">${p.std}</span></div>`).join("")}
    <div style="display:flex; gap:10px; margin-top:12px; flex-wrap:wrap">
      <button class="btn" data-eco="eligibility">Run eligibility check</button>
      <button class="btn primary" data-eco="priorauth">Submit prior authorization</button>
    </div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <h3>🧬 Specialty &amp; genetic diagnostic labs</h3>
    <p class="small muted" style="margin:0 0 8px">Ordering a genetic or specialty test should be as easy as a basic lab. Pick it, order it — the result returns to the chart. <span class="tiny">${E.labs.network}</span></p>
    ${E.labs.tests.map(t=>`<div class="rowitem">
      <span class="chip ${t.kind==='Genetic'?'accent':'plain'}">${t.kind}</span>
      <div style="flex:1"><div class="t small">${t.name}</div><div class="d">${t.lab} · results ${t.tat} · CPT ${t.cpt}</div></div>
      ${state.labOrders[t.id]?`<span class="chip green">✓ ordered</span>`:`<button class="btn small" data-laborder="${t.id}">Order</button>`}
    </div>`).join("")}
  </div>

  <div class="card">
    <h3>📹 National telehealth network</h3>
    <p class="small muted" style="margin:0 0 6px">Extend the practice beyond its walls — urgent care, specialty e-consults, and remote monitoring.</p>
    ${E.telehealth.map(t=>`<div class="rowitem"><span class="chip accent">live</span><div style="flex:1"><div class="t small">${t.t}</div><div class="d">${t.d}</div></div></div>`).join("")}
    <button class="btn primary" data-eco="telehealth" style="margin-top:12px">Start a telehealth visit</button>
  </div>`;
}

/* ==========================================================================
   COMMUNITY HEALTH · MENTAL HEALTH (patient, multilingual) · SYSTEMS & POLICY
   ========================================================================== */
function L(en, es){ return state.lang === "es" ? es : en; }

function vCommunity(){
  const heatHigh = true, aqi = 138;
  return `
  <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px">
    <h1 class="page-title">${L("Community health","Salud comunitaria")}</h1>
    <select id="lang-select" class="cme-select" title="Language / Idioma">
      <option value="en" ${state.lang==='en'?'selected':''}>English</option>
      <option value="es" ${state.lang==='es'?'selected':''}>Español</option>
    </select>
  </div>
  <p class="page-sub">${L("Health is shaped where you live — food, heat, air, and the people who help you navigate it.","La salud se forma donde usted vive: la comida, el calor, el aire y las personas que le ayudan.")}</p>
  <div class="note">${L("Language-first care: this information is in your language and adapted to your community — not one-size-fits-all.","Atención en su idioma: esta información está en su idioma y adaptada a su comunidad, no igual para todos.")}</div>

  <div class="grid g2" style="margin-top:16px">
    <div class="card">
      <h3>🥬 ${L("Food as medicine","La comida como medicina")}</h3>
      <p class="small muted" style="margin:0 0 8px">${L("A weekly produce prescription and medically tailored meals — covered by your insurance — for diabetes, high blood pressure, or food insecurity.","Una receta semanal de frutas y verduras y comidas adaptadas a su salud, cubiertas por su seguro, para la diabetes, la presión alta o la falta de alimentos.")}</p>
      <button class="btn primary" data-community="food">${L("Enroll","Inscribirme")}</button>
      ${evidenceCard("produceRx")}
    </div>
    <div class="card">
      <h3>🌡️ ${L("Heat & air quality alerts","Alertas de calor y calidad del aire")}</h3>
      <div class="rowitem"><span class="chip ${heatHigh?'red':'green'}">${L("Heat","Calor")}</span><div style="flex:1" class="small">${L("Extreme heat today — check on neighbors, hydrate, limit midday activity.","Calor extremo hoy: cuide a sus vecinos, hidrátese, evite el mediodía.")}</div></div>
      <div class="rowitem"><span class="chip ${aqi>100?'amber':'green'}">AQI ${aqi}</span><div style="flex:1" class="small">${L("Unhealthy for sensitive groups — limit outdoor exertion if you have asthma or COPD.","Dañino para grupos sensibles: limite el esfuerzo al aire libre si tiene asma o EPOC.")}</div></div>
      <div class="tiny" style="margin-top:6px">${L("Nearest cooling center: Central Library, 0.4 mi — open until 8 PM.","Centro de enfriamiento más cercano: Biblioteca Central, 0.6 km, abierto hasta las 8 PM.")} · CDC HeatRisk / AirNow</div>
    </div>
  </div>
  <div class="section-gap"></div>

  <div class="card">
    <h3>🤝 ${L("Community health worker","Trabajador de salud comunitaria")}</h3>
    <p class="small muted" style="margin:0 0 8px">${L("A community health worker can help with housing, food, transportation and benefits — and coordinate with your care team, documenting your needs so nothing falls through the cracks.","Un trabajador de salud comunitaria puede ayudarle con vivienda, comida, transporte y beneficios, y coordinar con su equipo de salud, documentando sus necesidades para que nada se pierda.")}</p>
    <button class="btn primary" data-community="chw">${L("Request a community health worker","Solicitar un trabajador de salud")}</button>
    ${evidenceCard("kangovi18")}
  </div>`;
}

function vMental(){
  const phq = state.screens.phq9;
  const level = phq ? (phq.score>=15?3:phq.score>=10?2:1) : null;
  const levels = [
    { n:1, t:L("Self-guided","Autoayuda guiada"), d:L("Free evidence-based apps for stress, sleep and mood.","Apps gratuitas basadas en evidencia para el estrés, el sueño y el ánimo.") },
    { n:2, t:L("Peer & coaching","Apoyo de pares"), d:L("Talk with a trained peer or health coach.","Hable con un par capacitado o un asesor de salud.") },
    { n:3, t:L("Clinician therapy","Terapia profesional"), d:L("Connect to a therapist or psychiatrist, in person or by telehealth.","Conéctese con un terapeuta o psiquiatra, en persona o por telesalud.") },
  ];
  return `
  <h1 class="page-title">${L("Mental & behavioral health","Salud mental y del comportamiento")}</h1>
  <p class="page-sub">${L("The right care at the right intensity — for you and for your kids.","La atención adecuada en la intensidad adecuada, para usted y sus hijos.")}</p>
  <div class="note">${L("In crisis? Call or text 988 (Suicide & Crisis Lifeline) — free, confidential, 24/7.","¿En crisis? Llame o envíe un texto al 988 (Línea de Crisis) — gratis, confidencial, 24/7.")}</div>

  <div class="card" style="margin-top:16px">
    <h3>${L("Stepped care — matched to you","Cuidado escalonado — a su medida")}</h3>
    ${levels.map(l=>`<div class="rowitem"><span class="chip ${level===l.n?'accent':'plain'}" style="min-width:30px; text-align:center">${l.n}</span><div style="flex:1"><div class="t small">${l.t}${level===l.n?` · <span style="color:var(--accent)">${L("suggested for you","sugerido para usted")}</span>`:''}</div><div class="d">${l.d}</div></div><button class="btn small">${L("Start","Empezar")}</button></div>`).join('')}
    ${phq?`<div class="evidence">${L("Based on your recent PHQ-9 score","Según su puntaje reciente de PHQ-9")} (${phq.score}). ${L("Stepped/collaborative care is proven to improve depression and anxiety outcomes.","El cuidado escalonado mejora los resultados de depresión y ansiedad.")}${ev("collabCare")}</div>`:`<div class="tiny" style="margin-top:8px">${L("Take a quick check-in to get matched.","Complete un breve cuestionario para recibir una recomendación.")} <button class="btn ghost small" data-nav-inline="screenings">${L("Go to screenings","Ir a cuestionarios")}</button></div>`}
  </div>
  <div class="section-gap"></div>

  <div class="card">
    <h3>🎒 ${L("For your child — school-based support","Para su hijo/a — apoyo escolar")}</h3>
    <p class="small muted" style="margin:0">${L("Schools can screen early for anxiety and depression and connect students to on-site or telehealth counseling — catching problems sooner.","Las escuelas pueden detectar temprano la ansiedad y la depresión y conectar a los estudiantes con consejería en el lugar o por telesalud.")}</p>
    <div class="tiny" style="margin-top:6px">${L("Aligned with SAMHSA school mental health guidance.","Alineado con la guía de salud mental escolar de SAMHSA.")}</div>
  </div>`;
}

function vSystems(){
  return `
  <h1 class="page-title">Systems &amp; policy</h1>
  <p class="page-sub">The infrastructure and incentives that let prevention scale beyond one clinic.</p>

  <div class="card" style="margin-bottom:16px">
    <h3>🏛️ Public-health data infrastructure <span class="chip accent">Health department</span></h3>
    <p class="small muted" style="margin:0 0 6px">Modernize the patchwork of health-department systems so outbreak data flows in near-real-time. LumaChart emits electronic case reports and syndromic-surveillance data on the certified FHIR surface — §170.315(f).</p>
    <div class="rowitem"><span class="chip green">live</span><div class="d" style="flex:1">Electronic case reporting (eCR) — reportable conditions auto-transmit to public health.</div></div>
    <div class="rowitem"><span class="chip green">live</span><div class="d" style="flex:1">Syndromic surveillance — de-identified, near-real-time signal to the health department.</div></div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <h3>💵 Value-based payment for prevention</h3>
    <p class="small muted" style="margin:0">Reimbursement that rewards keeping populations healthy, not just treating illness. LumaChart's prevention, screening and CHW activity generate the quality and outcome measures value-based contracts pay on (CMS value-based programs).</p>
    <div class="tiny" style="margin-top:6px">Feeds the same measures as Revenue &amp; analytics — prevention becomes revenue, not cost.</div>
  </div>

  <div class="card">
    <h3>🦠 Antimicrobial-resistance stewardship</h3>
    <p class="small muted" style="margin:0 0 6px">Point-of-care decision support plus diagnostics that reduce unnecessary antibiotics — with incentives that make best practice the easy path. Every avoidable prescription is avoidable resistance prevented.</p>
    ${evidenceCard("amrSteward")}
  </div>`;
}

/* ==========================================================================
   READMISSION PREDICTIVE ANALYTICS — predict → trigger CHW follow-up
   ========================================================================== */
function vReadmit(){
  const pts = READMIT.patients;
  const high = pts.filter(p=>p.risk==="High").length;
  const assigned = pts.filter((p,i)=>state.chwAssigned[i]).length;
  const tone = r => r==="High"?"red":r==="Moderate"?"amber":"green";
  const d = DETERIORATION, s = d.stewardship;
  const dismissed = state.deterDismissed;
  return `
  <h1 class="page-title">Risk &amp; early warning</h1>
  <p class="page-sub">Watch every patient continuously, surface only the ones who need you now, and act with a step that's proven to work.</p>

  <div class="card" style="margin-bottom:16px; border-color:var(--red)">
    <h3><span class="spark" style="color:var(--red)">◉</span> Deterioration alert — ${d.alert.pt}
      <span class="chip red">${d.alert.risk} risk</span>${reg("b11")}
      <span class="chip amber" style="margin-left:auto">simulated</span></h3>
    ${dismissed ? `<div class="small muted">Evaluated ✓ — sepsis bundle started, lactate re-checked. The alert closed itself; no pop-up will ask you again.</div>`
    : `<div class="small" style="margin-bottom:8px">The model flags a rising risk of sepsis over the <b>${d.alert.window}</b>. Here's <i>why</i> — the contributing factors, so you can judge in seconds:</div>
    <div class="rowlist">
      ${d.alert.factors.map(f=>`<div class="rowitem"><span class="chip plain">▲</span><div class="d" style="flex:1">${f}</div></div>`).join("")}
    </div>
    <div style="display:flex; gap:9px; margin-top:12px; flex-wrap:wrap">
      <button class="btn primary small" data-deter-act>Evaluate now → open sepsis order set</button>
      <button class="btn ghost small" data-deter-dismiss>Not sepsis — dismiss &amp; tell the model why</button>
    </div>
    <div class="evidence">One alert, one action, its reasons attached — never a pop-up chain. A validated early-warning model (TREWS) cut time to antibiotics and mortality when alerts were evaluated promptly, in a prospective 5-site study.${ev("adamsTrews")}${ev("henryTrews")} This is now an <b>FDA-cleared</b> category: the first-ever 510(k) for continuous AI sepsis monitoring (May 2026) reported 5.7-hour lead time and 18% lower mortality when clinicians act in time.${aut("bayesian")} LumaChart's predictive module is designed for that same pathway — see the regulatory architecture in <a data-nav-inline="security" style="cursor:pointer">Security</a>.</div>`}
  </div>

  <div class="card" style="margin-bottom:16px">
    <h3>🎯 Alert stewardship <span class="chip plain">synthetic demo</span></h3>
    <div class="gauge-wrap">
      <div class="metric"><div class="v">${s.perDay}</div><div class="l">alerts / clinician / day — few, because only the ones that matter fire</div></div>
      <div class="metric"><div class="v" style="color:var(--green)">${s.override}</div><div class="l">override rate — low means the model earns trust</div></div>
      <div class="metric"><div class="v">${s.timeToEval}</div><div class="l">median time to evaluation</div></div>
      <div class="metric"><div class="v" style="color:var(--green)">${s.adoption}</div><div class="l">clinician adoption</div></div>
    </div>
    <div class="evidence">Adoption is the metric that mattered in the research — a model no one trusts saves no one. Alert volume and override rate are tracked here because alert fatigue is both a safety risk and a burnout driver.${aut("sgAdvisory")} These numbers also surface on the CWO dashboard.</div>
  </div>

  <h3 style="margin:6px 0 10px">Post-discharge readmission risk</h3>
  <p class="page-sub" style="margin-bottom:16px">Predict who's likely to come back — using clinical <i>and</i> social data — and act with a follow-up that's proven to work.</p>

  <div class="grid g3">
    <div class="card"><div class="metric"><div class="v" style="color:var(--red)">${high}</div><div class="l">high-risk after discharge</div></div></div>
    <div class="card"><div class="metric"><div class="v" style="color:var(--green)">${assigned}</div><div class="l">community health worker assigned</div></div></div>
    <div class="card"><div class="metric"><div class="v">RCT</div><div class="l">CHW follow-up cut hospitalization in randomized trials${ev("kangovi18")}</div></div></div>
  </div>
  <div class="section-gap"></div>

  <div class="card">
    <h3>Discharged patients — risk-stratified <span class="chip plain">LACE + SDOH</span></h3>
    ${pts.map((p,i)=>`
      <div class="plan-item">
        <span class="chip ${tone(p.risk)}" style="min-width:96px; text-align:center">${p.risk} · ${p.pct}%</span>
        <div class="pi-body">
          <div class="pi-what">${p.name} <span class="tiny">· ${p.age} · ${p.dx} · LACE ${p.lace}</span></div>
          <div class="pi-why"><b>Clinical:</b> ${p.clinical.join(", ")}</div>
          <div class="pi-why" style="color:var(--text-3)"><b>Social (SDOH):</b> ${p.social.join(", ")}</div>
        </div>
        ${state.chwAssigned[i]
          ? `<span class="chip green">✓ CHW assigned</span>`
          : (p.risk!=="Low" ? `<button class="btn small" data-chw="${i}">Assign CHW follow-up</button>` : `<span class="chip plain">routine</span>`)}
      </div>`).join("")}
    <div class="evidence">The risk score is a <b>transparent decision-support intervention</b> (§170.315(b)(11)): its inputs are disclosed — LACE clinical factors plus named social determinants — not a black box. Model validated in ${ev("lace")} and reviewed in ${ev("kansagara")}.</div>
  </div>
  <div class="section-gap"></div>

  <div class="card">
    <h3>Why this is evidence-based</h3>
    <div class="rowitem"><span class="chip accent" style="min-width:132px; text-align:center">Predict</span><div class="d" style="flex:1">Validated readmission risk models (LACE) + a systematic review stratify who needs help.${ev("lace")} ${ev("kansagara")}</div></div>
    <div class="rowitem"><span class="chip accent" style="min-width:132px; text-align:center">Trigger CHW</span><div class="d" style="flex:1">Community health worker follow-up improved post-hospital outcomes and reduced hospitalization in randomized trials.${ev("kangovi14")} ${ev("kangovi18")} ${ev("kangoviPool")}</div></div>
    <div class="rowitem"><span class="chip accent" style="min-width:132px; text-align:center">Redesign discharge</span><div class="d" style="flex:1">A reengineered discharge (Project RED) cut rehospitalization.${ev("projectRED")}</div></div>
    <div class="tiny" style="margin-top:8px">Social determinants map to USCDI Health Status Assessments / SDOH — the same structured data the screening tools and research layer already capture.</div>
  </div>`;
}

/* ==========================================================================
   PRACTICE — revenue & analytics, digital payments, plans & value
   ========================================================================== */
function vAnalytics(){
  const a = ANALYTICS, maxR = Math.max(...a.revenue12);
  return `
  <h1 class="page-title">Revenue &amp; analytics</h1>
  <p class="page-sub">Payments, claims, and office performance in one place — so the practice runs on numbers, not guesswork.</p>
  <div class="grid g2">
    ${a.kpis.map(k=>`<div class="card"><div class="metric"><div class="v" style="color:var(--${k.tone==='green'?'green':'accent'})">${k.v}</div><div class="l">${k.t}</div></div><div class="tiny" style="margin-top:4px">${k.d}</div></div>`).join('')}
  </div>
  <div class="section-gap"></div>
  <div class="grid g2">
    <div class="card"><h3>Revenue trend (12 mo)</h3><div class="sparkrow">${a.revenue12.map(v=>`<i style="height:${Math.round(v/maxR*100)}%"></i>`).join('')}</div><div class="tiny" style="margin-top:6px">Monthly collected ($k), trending up.</div></div>
    <div class="card"><h3>Claims this month</h3>
      <div class="rowitem"><div style="flex:1" class="small">Submitted</div><b>${a.claims.submitted}</b></div>
      <div class="rowitem"><div style="flex:1" class="small" style="color:var(--green)">Paid</div><b style="color:var(--green)">${a.claims.paid}</b></div>
      <div class="rowitem"><div style="flex:1" class="small">Pending</div><b style="color:var(--amber)">${a.claims.pending}</b></div>
      <div class="rowitem"><div style="flex:1" class="small">Denied <span class="tiny">— auto-routed to follow-up</span></div><b style="color:var(--red)">${a.claims.denied}</b></div>
    </div>
  </div>
  <div class="section-gap"></div>
  <div class="grid g2">
    <div class="card"><h3>A/R aging</h3>${a.arAging.map(x=>`<div class="small muted" style="margin-bottom:6px">${x.b} days · <b>${x.pct}%</b><div class="bar" style="margin-top:3px"><i class="${x.b==='90+'?'red':x.b==='61–90'?'amber':'green'}" style="width:${x.pct}%"></i></div></div>`).join('')}</div>
    <div class="card"><h3>Office performance</h3>${a.office.map(o=>`<div class="rowitem"><div style="flex:1" class="small">${o.t}</div><b>${o.v}</b></div>`).join('')}</div>
  </div>
  <div class="section-gap"></div>
  <div class="card"><h3>Automated workflow <span class="chip green">saves clicks</span></h3>${a.automations.map(x=>`<div class="rowitem"><span class="chip green">auto</span><div style="flex:1"><div class="t small">${x.t}</div><div class="d">${x.d}</div></div></div>`).join('')}</div>`;
}

function vPayments(){
  const p = PAYMENTS, paid = state.billPaid, bal = paid ? 0 : p.balance;
  return `
  <h1 class="page-title">Billing &amp; payments</h1>
  <p class="page-sub">See what you owe after insurance, and pay online in a tap — card, HSA/FSA, or Apple/Google Pay.</p>
  <div class="grid g32">
    <div class="card" style="display:flex; align-items:center; gap:20px">
      <div class="metric"><div class="v" style="color:${bal>0?'var(--amber)':'var(--green)'}">$${bal.toFixed(2)}</div><div class="l">current balance</div></div>
      ${bal>0?`<button class="btn primary" id="pay-now">Pay $${bal.toFixed(2)} now</button>`:`<span class="chip green">Paid in full 🎉</span>`}
    </div>
    <div class="card"><h3>Payment methods</h3><p class="small muted" style="margin:0">${p.methods}. Set up autopay or a payment plan any time — no surprises.</p></div>
  </div>
  <div class="section-gap"></div>
  <div class="card"><h3>Statements</h3>
    ${p.statements.map(s=>{ const isPaid = s.status==='paid' || (s.status==='due' && paid);
      return `<div class="rowitem"><div style="flex:1"><div class="t small">${s.desc}</div><div class="d">${s.date}${s.code?` · <span class="code-light">${s.code}</span>`:""}</div></div><span class="chip ${isPaid?'green':'amber'}">${isPaid?'paid':'due'} · $${s.amt.toFixed(2)}</span></div>`; }).join('')}
    <div class="tiny" style="margin-top:8px">The light-gray numbers are the standard billing codes your insurance company uses — you don't need to do anything with them, but they're yours to see.</div>
  </div>
  <div class="section-gap"></div>

  <div class="card">
    <h3>🛡 Keep your coverage <span class="chip green">renewal on track</span></h3>
    <div class="small">Your Medicaid coverage renews every year — the state calls this a <span class="code-light">redetermination</span>. Yours is due <b>November 12</b>. We'll remind you a month ahead, and helping you re-enroll takes a few minutes, right from your phone, in your language.</div>
    <div class="tiny" style="margin-top:8px">Why we watch this for you: <b>72% of people who lose Medicaid are actually still eligible</b> — they lose coverage to paperwork, not the rules. Losing coverage interrupts your care and your medicines, so keeping it is part of keeping you healthy.${aut("fortuna")}</div>
    <button class="btn primary small" style="margin-top:10px" data-coverage-check>Check my renewal now</button>
  </div>`;
}

function vPlans(){
  const p = PLANS;
  return `
  <h1 class="page-title">Plans &amp; long-term value</h1>
  <p class="page-sub">Doctors and health systems buy value over years, not a checklist of features. Here's the long-term case.</p>
  <div class="grid g3">
    ${p.tiers.map(t=>`<div class="card" style="${t.featured?'border-color:var(--accent); box-shadow:inset 0 0 0 1px var(--accent)':''}">
      <h3>${t.name} ${t.featured?'<span class="chip accent">popular</span>':''}</h3>
      <div class="metric"><div class="v">${t.price}</div><div class="l">${t.per}</div></div>
      <div class="tiny" style="margin:6px 0 8px">${t.for}</div>
      ${t.feats.map(f=>`<div class="small muted">✓ ${f}</div>`).join('')}
      <button class="btn ${t.featured?'primary':''}" style="margin-top:12px">${t.cta}</button>
    </div>`).join('')}
  </div>
  <div class="tiny" style="margin:8px 0 0">Illustrative pricing model — free to start for small practices, a 30-day trial, custom enterprise terms.</div>
  <div class="section-gap"></div>
  <div class="grid g2">
    ${p.value.map(v=>`<div class="card"><h3>${v.t}</h3><p class="small muted" style="margin:0">${v.d}</p></div>`).join('')}
  </div>
  <div class="banner" style="margin-top:16px; background:linear-gradient(100deg,var(--accent-soft),var(--surface2)); border:1px solid var(--line-strong); color:var(--text)">
    <h3 style="color:var(--text)">Why the value compounds</h3>
    <p style="color:var(--text-2)">A feature list is copied in a quarter. An <b>evidence-based record</b> gets better every time guidelines update, every time the consented research network grows, and every time it prevents a denial or an after-hours hour. That is long-term value — see <b>docs/PLANS-AND-VALUE.md</b>.</p>
  </div>`;
}

/* ==========================================================================
   TRUST & DEPLOYMENT — security/SAFER, readiness & contracts
   ========================================================================== */
function vSecurity(){
  const t = TRUST;
  return `
  <h1 class="page-title">Security &amp; patient-data protection</h1>
  <p class="page-sub">Protecting health information is the foundation, not a bolt-on: HIPAA safeguards, ONC SAFER safety practices, and a clear hosting choice.</p>

  <div class="card" style="margin-bottom:16px">
    <h3>🔗 Standards we speak &amp; privacy law we honor</h3>
    <div class="small" style="margin-bottom:8px"><b>Interoperability</b> — LumaChart is standards-native, not a walled garden. The live <a data-nav-inline="fhir" style="cursor:pointer">FHIR sandbox</a> and <a data-nav-inline="enterprise" style="cursor:pointer">Enterprise &amp; exchange</a> views show these working.</div>
    <div class="rowlist">
      ${STANDARDS.interop.map(x=>`<div class="rowitem"><span class="chip accent">${x.s}</span><div class="d" style="flex:1">${x.d}</div></div>`).join("")}
    </div>
    <div class="small" style="margin:14px 0 8px"><b>Privacy &amp; security regimes</b> — built to serve patients on both sides of the Atlantic, and the enterprises that answer to regulators.</div>
    <div class="rowlist">
      ${STANDARDS.privacy.map(x=>`<div class="rowitem"><span class="chip ${x.tag==="designed-in"?"green":"amber"}">${x.s}</span>
        <div class="d" style="flex:1"><b>${x.scope}.</b> ${x.d}</div><span class="chip plain">${x.tag}</span></div>`).join("")}
    </div>
    <div class="evidence">GDPR's data-subject rights and HIPAA's right of access point the same way LumaChart already does — the patient owns the record (see <a data-nav-inline="synthesis" style="cursor:pointer">the interop thesis</a> and the patient's “My record” request). Building AI-native and FHIR-native from a blank page means these are architecture, not retrofit.${aut("onc2020")}</div>
  </div>

  <div class="grid g2">
    <div class="card"><h3>HIPAA safeguards <span class="chip green">by design</span></h3>
      ${t.hipaa.map(h=>`<div class="rowitem"><span class="chip green">✓</span><div style="flex:1"><div class="t small">${h.t}</div><div class="d">${h.d}</div></div></div>`).join('')}
    </div>
    <div class="card"><h3>ONC SAFER — high-priority safety practices</h3>
      ${t.saferHighPriority.map(s=>`<div class="rowitem"><span class="chip accent">▲</span><div class="d" style="flex:1">${s}</div></div>`).join('')}
      <div class="tiny" style="margin-top:8px">Nine SAFER Guides in all: ${t.saferGuides.join(' · ')}. <a class="pmid" href="${t.saferUrl}" target="_blank" rel="noopener" style="text-indent:0">SAFER Guides ↗</a> The SAFER self-assessment is also a required annual attestation for hospitals in the Medicare Promoting Interoperability Program.${aut("cmsPI")}</div>
    </div>
  </div>
  <div class="section-gap"></div>

  <div class="card"><h3>Cloud vs. locally hosted — choose with eyes open</h3>
    <div class="tablewrap"><table class="reg">
      <tr><th></th><th>☁️ Cloud-based</th><th>🏢 Locally hosted</th></tr>
      <tr><td class="cap">Benefits</td><td>${t.cloud.benefits.map(b=>'• '+b).join('<br>')}</td><td>${t.local.benefits.map(b=>'• '+b).join('<br>')}</td></tr>
      <tr><td class="cap">Challenges</td><td>${t.cloud.challenges.map(b=>'• '+b).join('<br>')}</td><td>${t.local.challenges.map(b=>'• '+b).join('<br>')}</td></tr>
    </table></div>
    <div class="evidence">LumaChart is cloud-native (lower cost, higher availability), so data-security responsibility is <b>shared</b> with the vendor — always backed by a signed BAA, an SLA, and ongoing monitoring. <a class="pmid" href="${t.apiPrivacyUrl}" target="_blank" rel="noopener" style="text-indent:0">API privacy &amp; security ↗</a></div>
  </div>
  <div class="section-gap"></div>

  <div class="card"><h3>🚫 Information blocking — the data is never held hostage</h3>
    <div class="small" style="margin-bottom:8px">Under the 21st Century Cures Act, providers, certified health-IT developers, and health information networks may not interfere with the <b>access, exchange, or use</b> of electronic health information unless a defined exception applies (preventing harm, privacy, security, infeasibility, health-IT performance, and the manner/fees/licensing exceptions). For developers, each violation carries civil monetary penalties of up to <b>$1&nbsp;million</b>.${aut("infoBlocking")}</div>
    <div class="rowlist">
      <div class="rowitem"><span class="chip green">design rule</span><div class="d" style="flex:1"><b>Open by default</b> — patient records flow to patients, other providers, and successor systems via standard FHIR APIs. No export fees, no proprietary lock-in, no "sunset ransom."</div></div>
      <div class="rowitem"><span class="chip green">design rule</span><div class="d" style="flex:1"><b>Exceptions are named, never vague</b> — if LumaChart ever withholds EHI it cites the specific regulatory exception (e.g., preventing harm), logged and reviewable.</div></div>
      <div class="rowitem"><span class="chip green">attestation-ready</span><div class="d" style="flex:1"><b>PI-program alignment</b> — hospitals attest annually that they don't information-block; an EHR that blocks by design makes its customers non-compliant. LumaChart's openness protects their attestation.${aut("cmsPI")}</div></div>
    </div>
  </div>
  <div class="section-gap"></div>

  <div class="card"><h3>🔓 Open API conditions — the developer's obligations, met</h3>
    <div class="small" style="margin-bottom:8px">Being a certified API developer (§170.315(g)(10)) comes with binding openness rules under the Cures Act. LumaChart is designed to satisfy all five — because an open API isn't a favor to competitors, it's the whole point.${aut("apiConditions")}</div>
    <div class="rowlist">
      <div class="rowitem"><span class="chip green">transparency</span><div class="d" style="flex:1"><b>Docs &amp; terms published</b> (§170.404(a)(2)) — complete business + technical documentation via a public link on CHPL.${aut("chpl")}</div></div>
      <div class="rowitem"><span class="chip green">fair fees</span><div class="d" style="flex:1"><b>Fair, reasonable, non-discriminatory fees</b> (§170.404(a)(3)) — the same fee for every app developer regardless of size; prohibited fees barred. Matches LumaChart's all-in, no-interface-ransom pricing.</div></div>
      <div class="rowitem"><span class="chip green">pro-competitive</span><div class="d" style="flex:1"><b>No anti-competitive conditions</b> (§170.404(a)(4)) — equal access and support for all API users, third parties included, with advance notice of changes.</div></div>
      <div class="rowitem"><span class="chip green">fast onboarding</span><div class="d" style="flex:1"><b>App verification &amp; registration on the clock</b> (§170.404(b)(1)) — authenticity verified within 10 business days, production registration within 5.</div></div>
      <div class="rowitem"><span class="chip green">public endpoints</span><div class="d" style="flex:1"><b>Public FHIR endpoint directory</b> (§170.404(b)(2)) — every customer's service base URL published as a FHIR Endpoint + Organization Bundle.</div></div>
    </div>
    <div class="tiny" style="margin-top:8px">This is the enforceable, technical form of "open by default" — and it's why <a data-nav-inline="helix" style="cursor:pointer">Helix Hub</a> can be a genuine third-party app marketplace, not a walled garden.</div>
  </div>
  <div class="section-gap"></div>

  <div class="card" style="margin-bottom:16px"><h3>🔍 What each AI feature actually does with data — in plain words</h3>
    <div class="small" style="margin-bottom:8px">No legalese: for every AI feature, here is what's captured, what persists, who can see it, and how to turn it off. Transparency is a Code commitment, not a courtesy.${aut("namAICC")}</div>
    <div class="tablewrap"><table class="reg">
      <tr><th></th><th>Captures</th><th>Persists</th><th>Who sees it</th><th>Off switch</th></tr>
      ${AI_PRIVACY.map(p=>`<tr><td class="cap">${p.name}</td><td>${p.captures}</td><td>${p.persists}</td><td>${p.sees}</td><td>${p.off}</td></tr>`).join("")}
    </table></div>
  </div>

  <div class="card" style="margin-bottom:16px"><h3>🏛 Regulatory architecture — national standards, two honest tracks</h3>
    <div class="small" style="margin-bottom:8px">Being a serious platform means meeting the law precisely — and keeping the tracks separate rather than blurring them. All of it is in service of the mission: less clinician burden, a real patient note, and billing that succeeds quietly in the background.</div>
    <div class="rowlist">
      ${REGULATORY.tracks.map(t=>`<div class="rowitem"><span class="chip accent">${t.chip}</span>
        <div class="d" style="flex:1"><b>${t.name}</b> <span class="tiny">(${t.who})</span><br>${t.d}${aut(t.auth)}</div></div>`).join("")}
    </div>
    <div class="evidence">The conformance gate is concrete: LumaChart's FHIR sandbox must pass the ONC test suites (Inferno for the §170.315(g)(10) API) to certify.${aut("oncTestTools")} Patients' right to their data via standard APIs underpins the patient-mediated record.${aut("patientAccess")} And the EHIgnite challenge names the same mission LumaChart's 'My record' already serves.${aut("ehignite")}</div>
  </div>

  <div class="card"><h3>🤖 AI governance — designed to the NAM Code of Conduct</h3>
    <div class="small" style="margin-bottom:8px">Every AI feature in LumaChart (Scribe, the coding agent, Canary, the assistant) is designed against the NAM Artificial Intelligence Code of Conduct's six commitments — an advantage of building AI-native from a blank page: the Code is architecture here, where a billing-first legacy system can only retrofit it.${aut("namAICC")}</div>
    <div class="rowlist">
      <div class="rowitem"><span class="chip accent">1·2</span><div class="d" style="flex:1"><b>Advance Humanity · Ensure Equity</b> — evidence on the record for every patient; equity-disaggregated well-being and outcome data, aggregate-only.</div></div>
      <div class="rowitem"><span class="chip accent">3</span><div class="d" style="flex:1"><b>Engage Impacted Individuals</b> — the scribe is per-encounter, patient-consented, physician-switchable; patients control research consent tier by tier.</div></div>
      <div class="rowitem"><span class="chip accent">4</span><div class="d" style="flex:1"><b>Improve Workforce Well-Being</b> — the founding commitment: AI exists here to return time (no-homework charting, batched inbox), measured in the Burden lab.</div></div>
      <div class="rowitem"><span class="chip accent">5·6</span><div class="d" style="flex:1"><b>Monitor Performance · Innovate &amp; Learn</b> — every decision-support intervention ships with §170.315(b)(11) source &amp; logic transparency, audit logging, and post-deployment surveillance.</div></div>
    </div>
  </div>`;
}

function vReadiness(){
  const t = TRUST;
  const answered = t.readiness.filter((_,i)=>state.readiness[i]).length;
  const pct = Math.round(answered/t.readiness.length*100);
  return `
  <h1 class="page-title">Readiness &amp; contracts</h1>
  <p class="page-sub">Implementation succeeds on people and paperwork, not just software. A 60-second readiness check and the contract terms that protect you.</p>

  <div class="card" style="margin-bottom:16px">
    <h3>🏥 Medicare Promoting Interoperability Program — why certification is non-negotiable</h3>
    <div class="small" style="margin-bottom:8px">Hospitals and critical access hospitals must be <b>meaningful users of certified EHR technology (CEHRT)</b> or take a <b>downward Medicare payment adjustment</b> — interoperability isn't a feature request, it's a revenue requirement.${aut("cmsPI")} CEHRT means the ONC 2015 Edition criteria, the 2015 Edition <b>Cures Update</b> (smartphone/API patient access, new privacy &amp; security criteria, USCDI updates), or a combination — with functionality in place on day one of the EHR reporting period and certification complete by its last day.</div>
    <div class="rowlist">
      <div class="rowitem"><span class="chip green">demoed</span><div class="d" style="flex:1"><b>Health information exchange &amp; APIs</b> — the FHIR R4 round-trips in the <a data-nav-inline="fhir" style="cursor:pointer">FHIR sandbox</a> are the exchanges this program scores.</div></div>
      <div class="rowitem"><span class="chip green">demoed</span><div class="d" style="flex:1"><b>Provider-to-patient exchange</b> — the patient portal's records, results and API-first design.</div></div>
      <div class="rowitem"><span class="chip amber">roadmap</span><div class="d" style="flex:1"><b>e-Prescribing + public-health data exchange</b> — immunization registries, electronic case reporting, reportable labs (see Roadmap &amp; gates).</div></div>
      <div class="rowitem"><span class="chip green">designed-in</span><div class="d" style="flex:1"><b>Required attestations</b> — Security Risk Analysis, the SAFER Guides self-assessment, and the information-blocking attestations live in <a data-nav-inline="security" style="cursor:pointer">Security &amp; SAFER</a>.${aut("infoBlocking")}</div></div>
    </div>
    <div class="evidence"><b>Honest cost note:</b> ONC certification is strict and expensive — accredited-lab testing per criterion, ongoing surveillance, annual Real World Testing, and decision-support transparency under §170.315(b)(11). It is a real budget line on LumaChart's path to market (see docs/ONC-CERTIFICATION-ROADMAP.md), and buyers verify any vendor's status on the official product list.${aut("chpl")}${aut("onc2020")} Until certified, LumaChart cannot support a hospital's PI attestation — no prototype can.</div>
  </div>

  <div class="grid g32">
    <div class="card"><h3>Implementation readiness self-check</h3>
      ${t.readiness.map((x,i)=>`<label class="rowitem" style="cursor:pointer"><input type="checkbox" class="task-check rd-item" data-i="${i}" ${state.readiness[i]?'checked':''}><div style="flex:1"><div class="t small">${x.k}</div><div class="d">${x.q}</div></div></label>`).join('')}
      <div class="tiny" style="margin-top:6px">Plan for both the <b>initial</b> and the <b>ongoing</b> effects on your practice.</div>
    </div>
    <div class="card" style="display:flex; align-items:center; justify-content:center">
      <div class="ring" style="--p:${pct}; --ring-color:${pct>=80?'var(--green)':pct>=40?'var(--amber)':'var(--red)'}"><div><b>${answered}/${t.readiness.length}</b><span>ready</span></div></div>
    </div>
  </div>
  <div class="section-gap"></div>

  <div class="card"><h3>EHR contract checklist <span class="chip plain">before you sign</span></h3>
    ${t.contracts.map(c=>`<div class="rowitem"><span class="chip accent">§</span><div style="flex:1"><div class="t small">${c.t}</div><div class="d">${c.d}</div></div></div>`).join('')}
    <div class="tiny" style="margin-top:8px">Reduce your risk: put SLAs and data-export rights in writing, and monitor on an ongoing basis. <a class="pmid" href="${t.contractsUrl}" target="_blank" rel="noopener" style="text-indent:0">EHR Contracts Untangled ↗</a></div>
  </div>`;
}

/* ==========================================================================
   HELIX HUB — the vetted app store for the health record
   ========================================================================== */
function helixLogo(sz){
  const s = sz || 34;
  return `<svg viewBox="0 0 40 40" width="${s}" height="${s}" fill="none" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
    <path d="M12 6c8 4 8 10 0 14s-8 10 0 14" stroke="var(--accent)"/>
    <path d="M28 6c-8 4-8 10 0 14s8 10 0 14" stroke="var(--amber)"/>
    <line x1="13" y1="11" x2="27" y2="11" stroke="var(--accent)"/><line x1="15" y1="20" x2="25" y2="20" stroke="var(--accent)"/><line x1="13" y1="29" x2="27" y2="29" stroke="var(--accent)"/>
    <circle cx="20" cy="20" r="3.4" fill="var(--accent)" stroke="none"/>
  </svg>`;
}
function vHelix(){
  const h = HELIX, inst = state.helixInstalled || {};
  return `
  <div style="display:flex; align-items:center; gap:12px">
    ${helixLogo(38)}
    <div><h1 class="page-title" style="margin:0">${h.brand}</h1><div class="page-sub" style="margin:0">${h.tagline}</div></div>
  </div>
  <div class="section-gap"></div>

  <div class="banner" style="background:linear-gradient(100deg,#0f2a33,#1d4a4f); color:#e7f4f6">
    <h3 style="color:#fff">A secondary market on the health record</h3>
    <p style="color:#bcd8de">${h.model}</p>
  </div>

  <div class="card" style="margin-bottom:16px"><h3>Every app is vetted before it lists</h3>
    <div class="grid g2">${h.vetting.map(v=>`<div class="rowitem"><span class="chip green">✓</span><div style="flex:1"><div class="t small">${v.t}</div><div class="d">${v.d}</div></div></div>`).join('')}</div>
  </div>

  <h3 style="margin:0 0 8px">Apps &amp; APIs <span class="chip plain">SMART on FHIR</span></h3>
  <div class="grid g3">
    ${h.apps.map((a,i)=>`<div class="card">
      <h3 style="font-size:14px">${a.name}</h3>
      <div class="small muted">${a.dev}${a.oss?' · <span class="chip green" style="font-size:10px">open source</span>':''}</div>
      <div class="small" style="margin:6px 0">${a.desc}</div>
      <div style="margin-bottom:8px"><span class="chip accent">${a.cat}</span> <span class="chip plain">${a.price}</span> <span class="chip green">vetted ✓</span></div>
      ${inst[i]?`<button class="btn" disabled style="opacity:.6">✓ Installed</button>`:`<button class="btn primary" data-helix="${i}">Install</button>`}
    </div>`).join('')}
  </div>
  <div class="section-gap"></div>

  <div class="card" style="margin-bottom:16px"><h3>Requested by clinicians <span class="chip accent">${state.helixSuggestions.length}</span></h3>
    <p class="small muted" style="margin:0 0 8px">Helix Hub grows from real questions at the bedside. Suggest a tool or a research question, or upvote what matters — the top requests guide what LumaChart builds and studies next.</p>
    ${state.helixSuggestions.slice().sort((a,b)=>b.votes-a.votes).map(s=>`<div class="rowitem">
      <button class="btn small" data-hx-vote="${s.id}" ${state.helixVoted[s.id]?'disabled style="opacity:.55"':''}>▲ ${s.votes}</button>
      <div style="flex:1"><div class="t small">${s.type==='question'?'🔬':'🛠'} ${s.title}</div><div class="d">${s.desc}</div><div class="tiny">— ${s.by}</div></div>
      ${s.by==='You'?'<span class="chip green">yours</span>':''}
    </div>`).join('')}
    <div class="divider"></div>
    <div class="small" style="font-weight:700; margin-bottom:6px">Suggest something for Helix Hub</div>
    <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center">
      <select id="hx-type" class="cme-select"><option value="question">🔬 Research question</option><option value="tool">🛠 Tool / app</option></select>
      <input id="hx-title" class="hx-input" placeholder="Your idea in one line — e.g., 'flag AKI risk before contrast'" style="flex:1; min-width:240px">
    </div>
    <input id="hx-desc" class="hx-input" placeholder="A sentence of clinical context (optional)" style="width:100%; margin-top:8px">
    <button class="btn primary" id="hx-submit" style="margin-top:10px">Submit to Helix Hub</button>
    <div class="tiny" style="margin-top:6px">Submissions go to the clinical &amp; safety team for review — the same vetting every listed app passes — so routine bedside questions become vetted tools and studies.</div>
  </div>

  <div class="card"><h3>Publish to Helix Hub <span class="chip accent">for developers</span></h3>
    <p class="small muted" style="margin:0">Build on the open §170.315(g)(10) FHIR API, submit to the vetting pipeline (safety → HIPAA → conformance → source review), and reach every LumaChart site. Great open-source ideas — hardened, distributed, and revenue-shared.</p>
  </div>`;
}

/* ==========================================================================
   RENDER + WIRING
   ========================================================================== */
const VIEWS = {
  clinician:{ dashboard:vDashboard, chart:vChart, scribe:vScribe, inbox:vInbox, fhir:vFhir, practice:vPractice, readmit:vReadmit, billing:vBilling, analytics:vAnalytics, cme:vCME, wellness:vWellness, canary:vCanary, synthesis:vSynthesis, enterprise:vEnterprise, ecosystem:vEcosystem, helix:vHelix, compete:vCompete, plans:vPlans, security:vSecurity, readiness:vReadiness, cert:vCert, roadmap:vRoadmap },
  patient:{ checkin:vCheckin, home:vHome, plan:vPlan, screenings:vScreenings, community:vCommunity, mental:vMental, payments:vPayments, myplan:vMyPlan, myrecord:vMyRecord, longevity:vLongevity, consent:vConsent },
  researcher:{ console:vConsole, systems:vSystems, synthesis:vSynthesis, roadmap:vRoadmap },
  cwo:{ joy:vJoy, ehr8:vEhr8, burden:vBurden, actions:vActions, report:vReport, biblio:vBiblio },
};

function render(){
  renderNav();
  $("#content").innerHTML = VIEWS[state.role][state.view]();
  window.scrollTo(0,0);
  wireView();
}

function wireView(){
  $$("[data-nav-inline]").forEach(b => b.addEventListener("click", () => {
    const v = b.dataset.navInline;
    if (!VIEWS[state.role][v]){                                   // cross-role link → switch role
      const r = Object.keys(VIEWS).find(role => VIEWS[role][v]);
      if (r){ state.role = r; $$(".role-btn").forEach(x => x.classList.toggle("active", x.dataset.role === r)); }
    }
    state.view = v; render();
  }));
  $$(".synth-toggle").forEach(c => c.addEventListener("change", () => {
    state.interop[c.dataset.feed] = c.checked;
    updateSynth();
  }));
  $$("[data-start-screen]").forEach(b => b.addEventListener("click", () => { state.activeResult = null; state.activeInstrument = b.dataset.startScreen; render(); }));
  const scx = $("[data-screen-cancel]"); if (scx) scx.addEventListener("click", () => { state.activeInstrument = null; render(); });
  $$("[data-screen-submit]").forEach(b => b.addEventListener("click", () => scoreInstrument(b.dataset.screenSubmit)));

  /* --- Aug-2026 interview wave: scribe · pacing · delegation steps --- */
  const stog = $("[data-scribe-toggle]"); if (stog) stog.addEventListener("click", () => {
    state.scribeOn = !state.scribeOn; store.set("scribeOn", state.scribeOn); render();
    toast("Scribe " + (state.scribeOn ? "on" : "off"),
      state.scribeOn ? "Listening, with the patient's consent — the visit documents itself." :
                       "Nothing is captured. Your call, per encounter.", "green");
  });
  const asig = $("[data-scribe-sign]"); if (asig) asig.addEventListener("click", () => {
    state.scribeSigned = true; render();
    toast("Note signed ✍", "Charted between patients, while it was fresh — the healthy habit that keeps tonight yours.", "green");
  });
  const asend = $("[data-scribe-send]"); if (asend) asend.addEventListener("click", () => {
    state.scribeSent = true; render();
    toast("Codes sent to Encounter & claim", "Drafted ICD-10 + CPT codes are queued for your one-tap verification in the claim workflow.", "green");
  });
  $$("[data-defer]").forEach(b => b.addEventListener("click", () => {
    state.tasksDone["defer"+b.dataset.defer] = true; store.set("tasksDone", state.tasksDone); render();
    toast("Follow-up booked", "Deferred to its own visit — today stays on time, and the concern still gets real attention.", "green");
  }));
  $$("[data-delegate-step]").forEach(b => b.addEventListener("click", () => {
    state.delegated[b.dataset.delegateStep] = true; render();
    toast("Delegation step running", "Your team has it — protocol-safe, with automatic route-back if anything is out of range.", "green");
  }));

  /* --- FHIR sandbox + Burden lab + advisory features --- */
  $$("[data-fhir-run]").forEach(b => b.addEventListener("click", () => runFhirWorkflow(b.dataset.fhirRun)));
  $$("[data-task-start]").forEach(b => b.addEventListener("click", () => startTimedTask(b.dataset.taskStart)));
  const eqd = $("[data-equity-dept]"); if (eqd) eqd.addEventListener("change", () => { state.equityDept = eqd.value; render(); });
  $$("[data-burnout-save]").forEach(b => b.addEventListener("click", () => {
    const sel = $("input[name=biq]:checked");
    if (!sel){ toast("Pick an answer first", "Choose the statement that fits best, then save.", "amber"); return; }
    state.burnoutSelf[b.dataset.burnoutSave] = +sel.value;
    store.set("burnoutSelf", state.burnoutSelf); render();
    toast("Saved — private to you", "Stored only on this device, like every well-being measure in LumaChart.", "green");
  }));
  const bd = $("#biblio-download"); if (bd) bd.addEventListener("click", () => {
    const url = URL.createObjectURL(new Blob([bibliographyHTML()], { type:"text/html" }));
    const a = document.createElement("a"); a.href = url; a.download = "LumaChart-Bibliography.html"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast("Bibliography generated 📚", "Every citation in the software, in one searchable document — open it and print to PDF. It regenerates from the live evidence base, so new features' citations are always included.", "green");
  });
  const adl = $("#audit-download"); if (adl) adl.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify({ exported:new Date().toISOString(), note:"LumaChart demo audit log — real FHIR sandbox round-trips, synthetic data", calls:state.fhirLog }, null, 2)], { type:"application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "lumachart-audit-log.json"; a.click(); setTimeout(()=>URL.revokeObjectURL(url), 5000);
  });
  const gn = $("#gross-nominate"); if (gn) gn.addEventListener("click", () => {
    const inp = $("#gross-input"); const v = (inp.value || "").trim();
    if (!v){ toast("Name the task", "What should die? Be specific — specific nominations get eliminated.", "amber"); return; }
    state.gross.unshift({ id:"g"+Date.now(), title:v, by:"You (this device)", votes:1, status:"under review", saved:"" });
    store.set("gross", state.gross); render();
    toast("Nominated 🗑", "Your care team can now vote it up. Leadership answers every nomination — that's the deal.", "green");
  });
  $$("[data-gross-vote]").forEach(b => b.addEventListener("click", () => {
    const g = state.gross.find(x => x.id === b.dataset.grossVote);
    if (g && !state.grossVoted[g.id]){ g.votes++; state.grossVoted[g.id] = true;
      store.set("gross", state.gross); store.set("grossVoted", state.grossVoted); render(); }
  }));
  const cvg = $("[data-coverage-check]"); if (cvg) cvg.addEventListener("click", () => {
    toast("Coverage looks good ✓", "Your Medicaid renewal is due November 12 — nothing to do yet. We'll remind you in October and walk you through it, step by step, in your language.", "green");
  });
  $$("[data-practice-step]").forEach(c => c.addEventListener("change", () => {
    state.practice[c.dataset.practiceStep] = c.checked;
    store.set("practice", state.practice); render();
  }));
  const bo = $("[data-buddy-optin]"); if (bo) bo.addEventListener("click", () => {
    state.buddy = true; store.set("buddy", true); render();
    toast("Battle Buddy 🤝", "Opted in — you'll be paired within your department. Five minutes, once a week, no agenda.", "green");
  });
  $$("[data-view-result]").forEach(b => b.addEventListener("click", () => { state.activeResult = b.dataset.viewResult; render(); }));
  const rdn = $("[data-result-done]"); if (rdn) rdn.addEventListener("click", () => { state.activeResult = null; render(); });
  const usr = $("#uspstf-refresh"); if (usr) usr.addEventListener("click", () => loadUSPSTF(true));
  $$("[data-order-screen]").forEach(b => b.addEventListener("click", () => toast("Questionnaire sent", `${INSTRUMENTS[b.dataset.orderScreen].short} sent to the patient's portal to complete before or during the visit.`, "green")));

  // --- encounter & claim ---
  const adx = $("#add-dx"); if (adx) adx.addEventListener("click", () => { state.claim.dxAdded = true; render(); toast("Diagnoses added", "The two discussed diagnoses are coded — every condition is now captured.", "green"); });
  $$("[data-verify-cpt]").forEach(b => b.addEventListener("click", () => { state.claim.verified[b.dataset.verifyCpt] = true; render(); }));
  const ca = $("#claim-assemble"); if (ca) ca.addEventListener("click", () => { state.claim.stage = "agent"; render(); toast("🤖 Billing agent", "Claim assembled (837P) from your verified codes + demographics, and handed to the biller.", "green"); });
  const cb = $("#claim-biller"); if (cb) cb.addEventListener("click", () => { state.claim.stage = "biller"; render(); });
  const cs = $("#claim-submit"); if (cs) cs.addEventListener("click", () => { state.claim.stage = "submitted"; render(); toast("Claim submitted", "Routed to the clearinghouse through the Puerto Rico bridge connector.", "green"); });
  const dact = $("[data-deter-act]"); if (dact) dact.addEventListener("click", () => { state.deterDismissed = true; render(); toast("Sepsis order set opened", "Antibiotics, fluids and a lactate re-check queued — one tap, from one alert. The model learns this was a true positive. (Simulated.)", "green"); });
  const ddis = $("[data-deter-dismiss]"); if (ddis) ddis.addEventListener("click", () => { state.deterDismissed = true; render(); toast("Dismissed — thank you", "Your reason tunes the model so it earns trust. A dismissed alert never nags you again. (Simulated.)", "green"); });
  const car = $("#claim-ar"); if (car) car.addEventListener("click", () => { state.claim.stage = "ar"; render(); toast("🤖 AR agent watching", "The agent follows this claim to its outcome — you'll hear about decisions, never statuses. (Simulated.)", "green"); });
  const cre = $("#claim-reset"); if (cre) cre.addEventListener("click", () => { state.claim = { dxAdded:false, verified:{}, stage:"code" }; render(); });

  // --- my record (patient-mediated right of access) ---
  const mrn = $("[data-myrecord-next]"); if (mrn) mrn.addEventListener("click", () => {
    state.myrecord = { step: Math.min(state.myrecord.step + 1, 3) };
    store.set("myrecord", state.myrecord);
    render();
    if (state.myrecord.step === 3) toast("Your record is assembled ✓", "A request went to every system that holds your records — gathered here under your right of access. (Demo simulation.)", "green");
  });
  const mrr = $("[data-myrecord-reset]"); if (mrr) mrr.addEventListener("click", () => { state.myrecord = { step:0 }; store.set("myrecord", state.myrecord); render(); });
  $$("[data-myrecord-dest]").forEach(b => b.addEventListener("click", () => {
    const k = b.dataset.myrecordDest;
    const msg = k==="keep" ? "Your unified record lives in LumaChart and stays current as new care happens. (Demo simulation.)"
      : k==="send" ? "A complete copy is on its way to your new doctor, with your authorization attached. (Demo simulation.)"
      : "Your record is being packaged as a readable copy for you to keep. (Demo simulation.)";
    toast(k==="keep" ? "Kept in your LumaChart ✓" : k==="send" ? "Sent to your new doctor ✓" : "Copy ready to download ✓", msg, "green");
  }));

  // --- patient check-in (iPad) ---
  const ciu = $("#ci-upload"); if (ciu) ciu.addEventListener("click", () => { state._idUploaded = true; ciu.textContent = "✓ Photo ID uploaded"; ciu.disabled = true; const s=$("#ci-upload-state"); if (s) s.textContent = "captured"; });
  const cis = $("#ci-submit"); if (cis) cis.addEventListener("click", () => {
    const conditions = $$(".ci-cond").filter(c => c.checked).map(c => c.dataset.icd);
    state.checkin = { conditions, idUploaded: state._idUploaded, at: new Date().toISOString().slice(0,10) };
    store.set("checkin", state.checkin);
    render();
    toast("Check-in complete 🎉", "Thanks, Maria! Your info pre-loaded the visit and the claim. The doctor will see you shortly.", "green");
  });
  const cir = $("[data-checkin-redo]"); if (cir) cir.addEventListener("click", () => { state.checkin = null; store.set("checkin", null); state._idUploaded = false; render(); });

  // --- CME ---
  const cst = $("#cme-state"); if (cst) cst.addEventListener("change", () => { state.cmeReqIdx = +cst.value; store.set("cmeReqIdx", state.cmeReqIdx); render(); });
  $$("[data-cme-book]").forEach(b => b.addEventListener("click", () => {
    const c = CME.catalog.find(x => x.id === b.dataset.cmeBook);
    state.cmeBooked[c.id] = true; store.set("cmeBooked", state.cmeBooked); render();
    toast("CME booked 🎓", `${c.title} — ${c.credits} credits${c.cost?`, $${c.cost}`:""}. Dates held and credits logged.${c.kind==="destination"?" Travel plan started.":""}`, "green");
  }));
  $$("[data-cme-cancel]").forEach(b => b.addEventListener("click", () => { delete state.cmeBooked[b.dataset.cmeCancel]; store.set("cmeBooked", state.cmeBooked); render(); }));
  $$("[data-chw]").forEach(b => b.addEventListener("click", () => {
    const i = b.dataset.chw, p = READMIT.patients[i];
    state.chwAssigned[i] = true; store.set("chwAssigned", state.chwAssigned); render();
    toast("Community health worker assigned 🤝", `${p.name} — a home visit and post-discharge check-in are scheduled. CHW follow-up is a randomized-trial-proven way to prevent readmission.`, "green");
  }));
  $$("[data-eco]").forEach(b => b.addEventListener("click", () => {
    const k = b.dataset.eco;
    const msg = k==="eligibility" ? "HealthFirst PPO active · $42 copay · deductible met — confirmed in real time (X12 271)."
      : k==="priorauth" ? "Prior authorization approved in seconds — auto-filled from the chart via Da Vinci DTR/PAS. No fax, no phone call."
      : "Telehealth visit launched on the national network — the clinician and patient are connected, notes flow back to the chart.";
    toast(k==="eligibility"?"Eligibility confirmed ✓":k==="priorauth"?"Prior auth approved ✓":"Telehealth started 📹", msg, "green");
  }));
  $$("[data-laborder]").forEach(b => b.addEventListener("click", () => {
    const id = b.dataset.laborder, t = ECOSYSTEM.labs.tests.find(x=>x.id===id);
    state.labOrders[id] = true; store.set("labOrders", state.labOrders); render();
    toast("Test ordered 🧬", `${t.name} — routed to ${t.lab}. Results (~${t.tat}) return straight to the chart.`, "green");
  }));
  const ls = $("#lang-select"); if (ls) ls.addEventListener("change", () => { state.lang = ls.value; store.set("lang", state.lang); render(); });
  $$("[data-community]").forEach(b => b.addEventListener("click", () => {
    const k = b.dataset.community;
    toast(L("Request received ✓","Solicitud recibida ✓"),
      k==="food" ? L("You're enrolled — your first produce box and meal plan are on the way, billed to insurance.","Está inscrito/a: su primera caja de frutas y verduras y su plan de comidas están en camino, facturados al seguro.")
                 : L("A community health worker will reach out within 2 business days to help with your needs.","Un trabajador de salud comunitaria se comunicará en un plazo de 2 días hábiles para ayudarle."),
      "green");
  }));

  // --- digital payment ---
  const pn = $("#pay-now"); if (pn) pn.addEventListener("click", () => { state.billPaid = true; store.set("billPaid", true); render(); toast("Payment received ✓", "Thanks! Your balance is paid in full. A receipt is in your portal.", "green"); });

  // --- research: IRB + cohort export ---
  $$("[data-irb-board]").forEach(b => b.addEventListener("click", () => { state.irbBoard = b.dataset.irbBoard; store.set("irbBoard", state.irbBoard); render(); }));
  $$("[data-irb]").forEach(b => b.addEventListener("click", () => { state.irb[b.dataset.irb] = "review"; store.set("irb", state.irb); render(); const bd = IRB.options.find(o=>o.id===state.irbBoard); toast("Protocol submitted", `Sent to the ${bd?bd.name:'IRB'} for review. You'll be notified of the board's decision.`, "green"); }));
  $$("[data-irb-decide]").forEach(b => b.addEventListener("click", () => { state.irb[b.dataset.irbDecide] = "approved"; store.set("irb", state.irb); render(); toast("IRB approved ✓", "Protocol approved. Cohort export is unlocked for this study; continuing review in 12 months.", "green"); }));
  const ex = $("#export-cohort"); if (ex) ex.addEventListener("click", () => toast("Cohort exported", "De-identified, small-cells suppressed, and fully audit-logged — delivered to the approved protocol.", "green"));

  // --- Helix Hub install ---
  $$("[data-helix]").forEach(b => b.addEventListener("click", () => { const a = HELIX.apps[b.dataset.helix]; state.helixInstalled[b.dataset.helix] = true; store.set("helixInstalled", state.helixInstalled); render(); toast("App installed 🧬", `${a.name} added to your LumaChart — vetted for safety &amp; HIPAA, running on SMART-on-FHIR scopes.`, "green"); }));
  $$("[data-hx-vote]").forEach(b => b.addEventListener("click", () => {
    const id = b.dataset.hxVote; if (state.helixVoted[id]) return;
    const s = state.helixSuggestions.find(x => x.id === id);
    if (s){ s.votes++; state.helixVoted[id] = true; store.set("helixSuggestions", state.helixSuggestions); store.set("helixVoted", state.helixVoted); render(); }
  }));
  const hxs = $("#hx-submit"); if (hxs) hxs.addEventListener("click", () => {
    const title = ($("#hx-title").value || "").trim();
    if (!title){ toast("Add a title", "Give your suggestion a one-line title first.", "amber"); return; }
    const s = { id:"u"+Date.now(), type:$("#hx-type").value, title, desc:($("#hx-desc").value||"").trim() || "(no additional context)", votes:1, by:"You" };
    state.helixSuggestions.unshift(s); state.helixVoted[s.id] = true;
    store.set("helixSuggestions", state.helixSuggestions); store.set("helixVoted", state.helixVoted);
    render();
    toast("Suggestion submitted 🧬", `"${title}" is queued for clinical &amp; safety review. This is how a routine question becomes a vetted tool or study.`, "green");
  });
  // --- Framingham-modeled consent tiers ---
  $$(".consent-tier").forEach(c => c.addEventListener("change", () => { if(!state.consentTiers) state.consentTiers={}; state.consentTiers[c.dataset.i] = c.checked; }));
  // --- regulatory document placeholder ---
  $$("[data-regdoc]").forEach(b => b.addEventListener("click", () => {
    const layer = $("#modal-layer"); layer.classList.remove("hidden");
    layer.innerHTML = `<div class="modal">
      <h2>📄 ${b.dataset.regdoc}</h2>
      <p class="small muted" style="margin-top:0">Placeholder — a real deployment attaches the signed authorization here.</p>
      <div class="evidence" style="font-family:var(--font)">
        <b>[ ${b.dataset.regdoc} — PLACEHOLDER ]</b><br><br>
        Protocol: LumaChart Prospective Public-Health Cohort<br>
        Sponsor / Institution: (your organization)<br>
        FWA: ${IRB.fwa} · IRB of record: ${(IRB.options.find(o=>o.id===state.irbBoard)||IRB.options[0]).name}<br>
        Status: authorized · continuing review in 12 months<br><br>
        This is a demonstration placeholder and not a real regulatory document.
      </div>
      <div class="modal-actions"><button class="btn primary" id="regdoc-ok">Close</button></div>
    </div>`;
    $("#regdoc-ok").addEventListener("click", () => layer.classList.add("hidden"));
  }));

  // --- implementation readiness self-check ---
  $$(".rd-item").forEach(c => c.addEventListener("change", () => { state.readiness[c.dataset.i] = c.checked; render(); }));

  // --- Joy in Medicine data extract report ---
  const gjr = $("#gen-joy-report"); if (gjr) gjr.addEventListener("click", generateJoyReport);
  const sjr = $("#submit-joy-report"); if (sjr) sjr.addEventListener("click", () => toast("Submitted to AMA portal", `${AMA.orgName}'s ${AMA.applyingFor} application data extract was routed to the AMA Joy in Medicine application portal. You'll be notified of the review outcome.`, "green"));
  const es = $("#exec-support"); if (es) es.addEventListener("click", () => { state.supportExecuted = true; store.set("supportExecuted", true); render(); toast("Intervention executed 🎯", "Peer-support program launched — the Support domain is now met (6 of 6). Your report reflects it.", "green"); });
  const note = $("#lean-note");
  if (note){
    const count = () => { $("#note-count").textContent = `${note.value.trim().split(/\s+/).length} words — lean and clinical`; };
    note.addEventListener("input", count); count();
  }
  const del = $("#delegate-all");
  if (del) del.addEventListener("click", () => {
    del.textContent = "Delegated ✓ — your team has it";
    del.disabled = true;
    toast("Care choreography", "6 protocol items routed to your care team. Estimated 14 minutes returned to you.", "green");
  });
  const bb = $("#breath-btn");
  if (bb) bb.addEventListener("click", startBreathing);
  const gp = $("#gen-patient-plan");
  if (gp) gp.addEventListener("click", () => {
    gp.textContent = "Published ✓ — live in Maria's portal";
    gp.disabled = true;
    toast("Plan published", "A patient-friendly translation of today's plan — tasks, timing, and reasons — is now in Maria's portal. Switch to the Patient role to see it.", "green");
  });
  const ct = $("#consent-toggle");
  if (ct) ct.addEventListener("change", () => {
    const s = $("#consent-state");
    s.textContent = ct.checked ? "ON" : "OFF";
    s.style.color = ct.checked ? "var(--green)" : "var(--red)";
    toast("Consent updated", ct.checked ? "Thank you — your de-identified data will help public-health research." : "You've opted out. Your data is excluded from all future extracts, effective immediately.", ct.checked ? "green" : "amber");
  });
  const cm = $("#customize-metrics");
  if (cm) cm.addEventListener("click", metricsModal);
  $$("[data-schedule]").forEach(b => b.addEventListener("click", () => scheduleModal(b.dataset.schedule)));
  $$("[data-ics]").forEach(b => b.addEventListener("click", () => {
    const t = b.dataset.ics, s = state.scheduled[t];
    if (s) downloadICS(t, s);
  }));
  $$(".task-check").forEach(c => c.addEventListener("change", () => {
    state.tasksDone[c.dataset.task] = c.checked;
    store.set("tasksDone", state.tasksDone);
    if (c.checked) toast("Nice work 💛", "Marked done — your care team can see your progress.", "green");
    render();
  }));
  updateCanaryMini();
}

/* ==========================================================================
   SCHEDULING — help booking the prevention plan, with .ics export
   ========================================================================== */
function scheduleModal(title){
  const offers = SLOTS[title] || [
    { d:"Mon, Jul 13", t:"9:00 AM", loc:"Main clinic", ics:"20260713T090000" },
    { d:"Wed, Jul 15", t:"2:30 PM", loc:"Main clinic", ics:"20260715T143000" },
  ];
  const layer = $("#modal-layer");
  layer.classList.remove("hidden");
  layer.innerHTML = `
    <div class="modal">
      <h2>📅 Schedule: ${title}</h2>
      <p class="small muted" style="margin-top:0">Pick a time that works — prep instructions follow automatically. Transportation help is available if you need it: just ask.</p>
      <div id="slot-list">
        ${offers.map((s,i)=>`
          <label class="slot" data-slot="${i}">
            <input type="radio" name="slot" value="${i}">
            <div><div class="s-when">${s.d} · ${s.t}</div><div class="s-loc">${s.loc}</div></div>
          </label>`).join("")}
      </div>
      <div class="modal-actions">
        <button class="btn" id="slot-cancel">Cancel</button>
        <button class="btn primary" id="slot-confirm" disabled>Confirm appointment</button>
      </div>
    </div>`;
  let picked = null;
  $$(".slot", layer).forEach(el => el.addEventListener("click", () => {
    picked = offers[+el.dataset.slot];
    $$(".slot", layer).forEach(x => x.classList.toggle("picked", x === el));
    $("#slot-confirm").disabled = false;
  }));
  $("#slot-cancel").addEventListener("click", () => layer.classList.add("hidden"));
  $("#slot-confirm").addEventListener("click", () => {
    state.scheduled[title] = picked;
    store.set("scheduled", state.scheduled);
    layer.innerHTML = `
      <div class="modal">
        <h2>✅ You're booked</h2>
        <p class="small"><b>${title}</b><br>${picked.d} · ${picked.t}<br><span class="muted">${picked.loc}</span></p>
        <p class="small muted">We'll send prep instructions and a reminder. Your care team has been notified.</p>
        <div class="modal-actions">
          <button class="btn" id="slot-ics">📅 Add to calendar (.ics)</button>
          <button class="btn primary" id="slot-done">Done</button>
        </div>
      </div>`;
    $("#slot-ics").addEventListener("click", () => downloadICS(title, picked));
    $("#slot-done").addEventListener("click", () => { layer.classList.add("hidden"); render(); });
  });
}

function downloadICS(title, slot){
  const stamp = new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d+Z/,"Z");
  const ics = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//LumaChart//Demo//EN","BEGIN:VEVENT",
    `UID:${Date.now()}@lumaehr.demo`, `DTSTAMP:${stamp}`, `DTSTART:${slot.ics}`, "DURATION:PT1H",
    `SUMMARY:${title} — LumaChart`, `LOCATION:${slot.loc}`,
    "DESCRIPTION:Scheduled from your LumaChart prevention plan (demonstration).",
    "END:VEVENT","END:VCALENDAR"].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type:"text/calendar" }));
  const a = document.createElement("a");
  a.href = url; a.download = title.replace(/\W+/g,"-") + ".ics"; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  toast("Calendar file ready", "Open the downloaded .ics to add this appointment to Apple/Google/Outlook calendar.", "green");
}

/* ==========================================================================
   CUSTOMIZABLE METRICS
   ========================================================================== */
function metricsModal(){
  const layer = $("#modal-layer");
  layer.classList.remove("hidden");
  layer.innerHTML = `
    <div class="modal">
      <h2>⚙ Customize your metrics</h2>
      <p class="small muted" style="margin-top:0">Pin what matters most to <i>your</i> practice — LumaChart adapts to you.</p>
      ${METRIC_LIBRARY.map(m=>`
        <label class="rowitem" style="cursor:pointer">
          <input type="checkbox" class="task-check metric-pick" value="${m.id}" ${state.metrics.includes(m.id)?"checked":""}>
          <div style="flex:1"><div class="t small">${m.t}</div><div class="d">${m.d}</div></div>
        </label>`).join("")}
      <div class="modal-actions">
        <button class="btn" id="metrics-cancel">Cancel</button>
        <button class="btn primary" id="metrics-save">Save</button>
      </div>
    </div>`;
  $("#metrics-cancel").addEventListener("click", () => layer.classList.add("hidden"));
  $("#metrics-save").addEventListener("click", () => {
    state.metrics = $$(".metric-pick", layer).filter(c=>c.checked).map(c=>c.value);
    store.set("metrics", state.metrics);
    layer.classList.add("hidden");
    render();
    toast("Metrics updated", "Your dashboard now shows what you chose to watch.", "green");
  });
}

/* ==========================================================================
   LUMA ASSISTANT — scripted demo helper
   ========================================================================== */
function assistantSay(html, actions){
  const box = $("#assistant-msgs");
  const el = document.createElement("div");
  el.className = "a-msg";
  el.innerHTML = html;
  if (actions && actions.length){
    const row = document.createElement("div");
    row.className = "a-actions";
    actions.forEach(a => {
      const b = document.createElement("button");
      b.className = "btn small";
      b.textContent = a.label;
      b.addEventListener("click", () => {
        if (a.go){
          state.role = a.go.role; state.view = a.go.view;
          $$(".role-btn").forEach(x => x.classList.toggle("active", x.dataset.role === state.role));
          render();
        }
      });
      row.appendChild(b);
    });
    el.appendChild(row);
  }
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}
function assistantAsk(text){
  const box = $("#assistant-msgs");
  const u = document.createElement("div");
  u.className = "a-msg user";
  u.textContent = text;
  box.appendChild(u);
  box.scrollTop = box.scrollHeight;
  const rule = ASSISTANT_RULES.find(r => r.match.test(text));
  setTimeout(() => rule ? assistantSay(rule.a, rule.actions) : assistantSay(ASSISTANT_FALLBACK), 350);
}
$("#assistant-fab").addEventListener("click", () => $("#assistant-drawer").classList.toggle("hidden"));
$("#assistant-close").addEventListener("click", () => $("#assistant-drawer").classList.add("hidden"));
$$(".a-chip").forEach(c => c.addEventListener("click", () => assistantAsk(c.textContent)));
$("#assistant-send").addEventListener("click", () => {
  const inp = $("#assistant-input");
  if (inp.value.trim()){ assistantAsk(inp.value.trim()); inp.value = ""; }
});
$("#assistant-input").addEventListener("keydown", e => { if (e.key === "Enter") $("#assistant-send").click(); });

/* ==========================================================================
   BREATHING EXERCISE
   ========================================================================== */
let breathTimer = null;
function startBreathing(){
  const circle = $("#breath-circle"), btn = $("#breath-btn");
  if (!circle) return;
  clearInterval(breathTimer);
  btn.textContent = "Breathing… (60s)";
  btn.disabled = true;
  let phase = 0, elapsed = 0;
  const phases = [ ["Breathe in", true], ["Hold", true], ["Breathe out", false], ["Hold", false] ];
  const step = () => {
    const [label, grow] = phases[phase % 4];
    circle.textContent = label;
    circle.classList.toggle("inhale", grow);
    phase++; elapsed += 4;
    if (elapsed >= 60){
      clearInterval(breathTimer);
      circle.textContent = "Well done 💛";
      circle.classList.remove("inhale");
      btn.textContent = "Start breathing";
      btn.disabled = false;
    }
  };
  step();
  breathTimer = setInterval(step, 4000);
}

/* ==========================================================================
   CANARY ENGINE — accelerated demo clock: 1 real second = 1 demo minute
   ========================================================================== */
function fmtMin(m){ return `${Math.floor(m/60)}:${String(m%60).padStart(2,"0")}`; }

function updateCanaryPill(){
  const m = state.canary.sessionMin;
  const pill = $("#canary-pill"), txt = $("#canary-pill-text");
  txt.textContent = `Session ${fmtMin(m)}`;
  pill.className = "canary-pill " + (m > 120 ? "alert" : m > 60 ? "warn" : "ok");
}
function updateCanaryMini(){
  const el = $("#canary-mini");
  if (el){
    const m = state.canary.sessionMin;
    el.innerHTML = `Session <b>${fmtMin(m)}</b> · inbox <b>${INBOX.length}</b> · after-hours trend <b style="color:var(--green)">falling ↓</b>`;
  }
  const sv = $("#canary-session");
  if (sv){
    sv.textContent = fmtMin(state.canary.sessionMin);
    const bar = $("#canary-session-bar");
    if (bar){
      const m = state.canary.sessionMin;
      bar.style.width = Math.min(m/180*100,100) + "%";
      bar.className = m>120?"red":m>60?"amber":"green";
    }
  }
}

function canaryTick(){
  state.canary.sessionMin++;
  const m = state.canary.sessionMin;
  updateCanaryPill();
  updateCanaryMini();
  if (state.role !== "clinician") return;
  if (!state.wellness) return;                                     // well-being features turned off
  if (m < state.canary.snoozedUntil) return;
  if (state.activeInstrument || state.activeResult) return;        // don't interrupt a focused check-in
  if (!$("#modal-layer").classList.contains("hidden")) return;     // a dialog is already open — don't pile on

  if (m >= 25 && !state.canary.fired.micro){
    state.canary.fired.micro = true;
    toast("🐦 Canary — micro-break", "You've been in the record 25 minutes. 20-second eye rest? Look at something 20 feet away (20-20-20).", "green");
  }
  if (m >= 60 && !state.canary.fired.breathe){
    state.canary.fired.breathe = true;
    toast("🐦 Canary — one mindful minute", "One hour heads-down. A 60-second breathing break measurably restores focus.", "accent",
      [{ label:"Start breathing", act:()=>{ state.view="wellness"; render(); setTimeout(startBreathing,300); } },
       { label:"Later", act:null }]);
  }
  if (m >= 120 && !state.canary.fired.extended){
    state.canary.fired.extended = true;
    extendedLoginModal();
  }
}

function extendedLoginModal(){
  const layer = $("#modal-layer");
  layer.classList.remove("hidden");
  layer.innerHTML = `
    <div class="modal">
      <h2>🐦 Extended session — Canary is chirping</h2>
      <p class="small">You've been logged in for <b>${fmtMin(state.canary.sessionMin)}</b> continuously. Long uninterrupted EHR sessions are one of the measured drivers of burnout — primary-care physicians average 5.9 hr/day in the EHR, with 1.4 hr after hours. <a class="pmid" href="${pubmed("28893811")}" target="_blank" rel="noopener" title="${EVIDENCE.arndt.cite}">PMID 28893811</a></p>
      <p class="small muted">This is a nudge, not a lock. Your session, your call — Canary never reports individuals.</p>
      <div class="modal-actions">
        <button class="btn" id="canary-snooze">Snooze 30 min</button>
        <button class="btn primary" id="canary-break">Take a real break</button>
      </div>
    </div>`;
  $("#canary-snooze").addEventListener("click", () => {
    state.canary.snoozedUntil = state.canary.sessionMin + 30;
    layer.classList.add("hidden");
    toast("🐦 Canary", "Snoozed 30 minutes. I'll check back — gently.", "amber");
  });
  $("#canary-break").addEventListener("click", () => {
    layer.classList.add("hidden");
    state.canary.sessionMin = 0;
    state.canary.fired.micro = state.canary.fired.breathe = state.canary.fired.extended = false;
    updateCanaryPill(); updateCanaryMini();
    toast("🐦 Canary", "Session timer reset. Enjoy the break — your patients get the rested version of you.", "green");
  });
}

/* ==========================================================================
   TOASTS
   ========================================================================== */
function toast(title, body, tone="accent", actions){
  const layer = $("#toast-layer");
  while (layer.children.length >= 2) layer.removeChild(layer.firstChild);   // never let notifications stack up
  const el = document.createElement("div");
  el.className = `toast ${tone==="green"?"green":tone==="amber"?"amber":""}`;
  el.innerHTML = `<b>${title}</b>${body}`;
  el.title = "Tap to dismiss";
  el.addEventListener("click", e => { if (e.target.tagName !== "BUTTON") el.remove(); });
  if (actions){
    const row = document.createElement("div");
    row.className = "toast-actions";
    actions.forEach(a => {
      const b = document.createElement("button");
      b.className = "btn small";
      b.textContent = a.label;
      b.addEventListener("click", () => { el.remove(); if (a.act) a.act(); });
      row.appendChild(b);
    });
    el.appendChild(row);
  }
  layer.appendChild(el);
  setTimeout(() => el.remove(), actions ? 30000 : 9000);
}

/* ==========================================================================
   BOOT
   ========================================================================== */
function updateWellnessUI(){
  const wt = $("#wellness-toggle"); if (wt) wt.classList.toggle("active", state.wellness);
  const pill = $("#canary-pill"); if (pill) pill.style.display = state.wellness ? "" : "none";
}
function updateFocusUI(){
  // Focus is a clinician-only concept — the toggle exists only in the clinician role,
  // and the minimal display never alters the patient / researcher / CWO experiences.
  const clin = state.role === "clinician";
  const ft = $("#focus-toggle");
  if (ft){ ft.style.display = clin ? "" : "none"; ft.classList.toggle("active", clin && state.focus); }
  document.documentElement.classList.toggle("focus-on", clin && state.focus);
}
function toggleFocus(){
  state.focus = !state.focus;
  store.set("focus", state.focus);
  if (state.focus && state.role === "clinician" && !FOCUS_CORE.has(state.view)) state.view = "dashboard";
  updateFocusUI();
  render();
  toast("Focus " + (state.focus ? "on" : "off"),
    state.focus ? "The minimal display — like Do Not Disturb for your EHR. Today's clinical work only; urgent items always break through. Toggle any time." :
                  "Full interface restored — every panel is back.", "green");
}
function toggleWellness(){
  state.wellness = !state.wellness;
  store.set("wellness", state.wellness);
  if (!state.wellness && (state.view === "wellness" || state.view === "canary")) state.view = "dashboard";
  updateWellnessUI();
  render();
  toast("Well-being features " + (state.wellness ? "on" : "hidden"),
    state.wellness ? "Wellness Center and Canary are back." : "Lean clinical view — Wellness Center, Canary and its nudges are hidden. A preference, like the theme — toggle any time.", "green");
}

render();
loadUSPSTF();                    // pull the latest Grade A/B recommendations (embedded fallback if offline)
$("#wellness-toggle").addEventListener("click", toggleWellness);
const _ft = $("#focus-toggle"); if (_ft) _ft.addEventListener("click", toggleFocus);
updateWellnessUI();
updateFocusUI();
setInterval(canaryTick, 1000);
setTimeout(() => toast("Welcome to LumaChart", `Restore Mode (low-glare dark) is on to reduce visual fatigue.${ev("eyestrain")} Tap any notification to dismiss it — they stay gentle and out of your way.`, "green"), 4500);
