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
  checkin:   store.get("checkin", null), // patient iPad pre-visit intake
  claim:     { dxAdded:false, verified:{}, stage:"code" }, // encounter/claim workflow
  _idUploaded: false,
  cmeReqIdx: store.get("cmeReqIdx", 0),  // selected state requirement (default Puerto Rico)
  cmeBooked: store.get("cmeBooked", {}), // booked CME programs
};

/* ---------- evidence helpers — every PMID links straight to PubMed ---------- */
const pubmed = pmid => `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
const ev = key => {
  if (!key || !EVIDENCE[key]) return "";
  const e = EVIDENCE[key];
  return ` <a class="pmid" href="${pubmed(e.pmid)}" target="_blank" rel="noopener" title="${e.cite} — click to open on PubMed">PMID ${e.pmid}</a>`;
};
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
    toast("Theme changed", "Restore Mode (low-glare dark) is LumaChart's default — designed to reduce eyestrain on long shifts. Switch back any time.", "green");
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
      { id:"inbox",     ic:"✉", t:"Inbox", badge:() => INBOX.length },
      { id:"billing",   ic:"⛁", t:"Encounter & claim" },
    ]},
    { label:"Professional", items:[
      { id:"cme",       ic:"🎓", t:"CME & licensure", badge:() => cmeDueBadge() },
    ]},
    { label:"You", items:[
      { id:"wellness",  ic:"❦", t:"Wellness Center", ph:true },
      { id:"canary",    ic:"🐦", t:"Canary", ph:true },
    ]},
    { label:"Platform", items:[
      { id:"synthesis", ic:"◎", t:"Physician health × Interop" },
      { id:"roadmap",   ic:"⛭", t:"Roadmap & gates" },
    ]},
  ],
  patient: [
    { label:"My health", items:[
      { id:"checkin",   ic:"▤", t:"Check-in" },
      { id:"home",      ic:"✚", t:"Healthspan home" },
      { id:"plan",      ic:"◷", t:"Prevention plan", badge:() => PREVENTION_PLAN.filter(p=>p.status==="due" && !state.scheduled[p.t]).length || null },
      { id:"screenings",ic:"✎", t:"Screenings & questionnaires" },
      { id:"myplan",    ic:"☑", t:"My care plan" },
      { id:"longevity", ic:"↗", t:"Longevity tracker" },
      { id:"consent",   ic:"✔", t:"Research & consent" },
    ]},
  ],
  researcher: [
    { label:"Public health", items:[
      { id:"console",   ic:"◫", t:"Research console" },
      { id:"synthesis", ic:"◎", t:"Physician health × Interop" },
      { id:"roadmap",   ic:"⛭", t:"Roadmap & gates" },
    ]},
  ],
  cwo: [
    { label:"Well-being program", items:[
      { id:"joy",    ic:"🏅", t:"Joy in Medicine" },
      { id:"ehr8",   ic:"⏱", t:"EHR8 · WOW8 · Inbox" },
      { id:"report", ic:"📄", t:"Data extract report" },
    ]},
  ],
};

$$(".role-btn").forEach(btn => btn.addEventListener("click", () => {
  state.role = btn.dataset.role;
  state.view = NAVS[state.role][0].items[0].id;
  $$(".role-btn").forEach(b => b.classList.toggle("active", b === btn));
  render();
}));

function renderNav(){
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

function vDashboard(){
  const pinned = METRIC_LIBRARY.filter(m => state.metrics.includes(m.id));
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
  </div>`;
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
    <textarea class="note-editor" id="lean-note" style="min-height:110px">${CARE_PLAN.assessment}</textarea>
    <div class="tiny" style="margin-top:8px"><span id="note-count"></span> — U.S. notes average ~4× the length of the same EHR abroad because billing data bloats them. LumaChart keeps the note clinical.${ev("downing")}</div>
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
  const cats = ["Results","Refill","Portal"];
  const delegable = INBOX.filter(i=>i.delegable).length;
  return `
  <h1 class="page-title">Inbox <span class="chip amber">${INBOX.length} items</span></h1>
  <p class="page-sub">Inbox work is ~24% of physicians' EHR time.${ev("arndt")} LumaChart routes what your team can own.</p>

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

  ${cats.map(cat => `
    <div class="card" style="margin-bottom:14px">
      <h3>${cat==="Results"?"🧪 Results":cat==="Refill"?"℞ Refills":"💬 Portal messages"}</h3>
      <div class="rowlist">
        ${INBOX.filter(i=>i.cat===cat).map(i=>`
          <div class="rowitem">
            <div style="flex:1"><div class="t small">${i.t} ${i.gratitude?"💛":""}</div><div class="d">${i.d}</div></div>
            ${i.delegable?`<span class="chip green">delegable</span>`:`<span class="chip plain">physician</span>`}
          </div>`).join("")}
      </div>
    </div>`).join("")}`;
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
  </div>`;
}

function vCanary(){
  const m = state.canary.sessionMin;
  const backlog = INBOX.length;
  return `
  <h1 class="page-title">🐦 Canary <span class="chip green">private to you</span></h1>
  <p class="page-sub">Your early-warning companion. Canary reads your own workload signals against your baseline and speaks up gently — like a canary in a coal mine, it warns before harm.</p>

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
    <div class="card"><div class="metric"><div class="v" style="color:var(--green)">6.9%</div><div class="l">A1c — down from 7.4. Your work is paying off.</div></div></div>
    <div class="card"><div class="metric"><div class="v">132/81</div><div class="l">Blood pressure — close to your &lt;130 goal${ev("sprint")}</div></div></div>
    <div class="card"><div class="metric"><div class="v" style="color:var(--accent)">95<span style="font-size:15px"> min/wk</span></div><div class="l">Activity — every 15 min/day adds up${ev("activity")}</div></div></div>
  </div>
  <div class="section-gap"></div>
  <div class="card" style="display:flex; align-items:center; gap:16px; flex-wrap:wrap">
    <div style="flex:1; min-width:220px"><h3 style="margin-bottom:4px">💚 Mental health is health</h3>
      <p class="small muted" style="margin:0">A 2-minute private check-in on mood, worry, or drinking — with evidence-based steps that help. Recommended for all adults by the USPSTF.</p></div>
    <button class="btn primary" data-nav-inline="screenings">Check in</button>
  </div>`;
}

function vPlan(){
  return `
  <h1 class="page-title">Your prevention plan</h1>
  <p class="page-sub">Every recommendation comes with the actual evidence — click any PMID to read the study on PubMed.</p>

  <div class="card" style="margin-bottom:16px">
    <h3>Backed by the USPSTF — recommended for you
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
      ${p.ev ? evidenceCard(p.ev) : `<div class="evidence"><b>Basis:</b> national guideline recommendation (USPSTF / CDC-ACIP).</div>`}
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

function vScreenings(){
  if (state.activeInstrument) return vInstrument(state.activeInstrument);
  if (state.activeResult) return vResultView(state.activeResult);
  return `
  <h1 class="page-title">Mental health is health</h1>
  <p class="page-sub">Private, validated check-ins recommended by the USPSTF — all free, public-domain instruments. You fill them out; your care team reviews the results, and you get evidence-based steps that help.</p>
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
  <p class="page-sub">Five modifiable numbers, one goal: more healthy years. Small moves on these compound.</p>
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
    <p class="small muted" style="margin:0">Blood pressure, glucose, lipids, movement and sleep are the levers with the strongest trial evidence for adding healthy years — tight BP control reduced death in a landmark trial${ev("sprint")}, and even 15 minutes of daily activity added ~3 years of life expectancy in a 416,000-person cohort${ev("activity")}.</p></div>`;
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
        <b>Contribute my de-identified data to public-health research</b>
        <div class="small muted">Currently: <span id="consent-state" style="color:var(--green); font-weight:700">ON</span> · revocable instantly, no questions asked</div>
      </div>
    </div>
    <div class="divider"></div>
    <div class="grid g2 small muted">
      <div><b style="color:var(--text)">What is shared</b><br>Diagnoses, labs, vitals, prevention status — with your name, birthdate, address and record numbers removed.</div>
      <div><b style="color:var(--text)">What is never shared</b><br>Your identity, your messages, your notes' free text, anything re-identifiable. Small groups are suppressed entirely.</div>
    </div>
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
  return `
  <h1 class="page-title">Public-health research console</h1>
  <p class="page-sub">Prospective, consented, de-identified — the population layer the National Academy of Medicine called for.</p>

  <div class="grid g3">
    <div class="card"><div class="metric"><div class="v">${r.consented.toLocaleString()}</div><div class="l">consented participants</div></div>
      <div class="bar" style="margin-top:10px"><i class="green" style="width:${r.consented/r.total*100}%"></i></div>
      <div class="tiny" style="margin-top:6px">${(r.consented/r.total*100).toFixed(1)}% of ${r.total.toLocaleString()} patients — consent is explicit &amp; revocable.</div></div>
    <div class="card"><div class="metric"><div class="v">2</div><div class="l">active prospective studies</div></div>
      <div class="tiny" style="margin-top:10px">Leaner, structured records make research-grade data a by-product of care — "better use for research."${ev("downing")}</div></div>
    <div class="card"><div class="metric"><div class="v">100%</div><div class="l">queries audit-logged</div></div>
      <div class="tiny" style="margin-top:10px">Every cohort query is recorded and reviewable.</div></div>
  </div>
  <div class="section-gap"></div>

  <div class="grid g2">
    <div class="card">
      <h3>Active studies</h3>
      ${r.studies.map(s=>`
        <div class="rowitem"><div style="flex:1"><div class="t small">${s.t}</div><div class="d">${s.d}</div>
        <div class="tiny" style="margin-top:3px">${s.n}</div></div><span class="chip accent">${s.status}</span></div>`).join("")}
    </div>
    <div class="card">
      <h3>Privacy guardrails <span class="chip green">enforced</span></h3>
      ${r.guardrails.map(g=>`<div class="rowitem"><div class="d">🔒 ${g}</div></div>`).join("")}
      <div class="divider"></div>
      <button class="btn" disabled style="opacity:.55; cursor:not-allowed">Export cohort — requires IRB approval</button>
      <div class="tiny" style="margin-top:6px">Honest by design: no export path exists without an approved protocol.</div>
    </div>
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

  ${booked.length?`<div class="section-gap"></div><div class="card"><h3>Booked <span class="chip green">${bookedCredits} credits · $${bookedCost}</span></h3>
    ${booked.map(c=>`<div class="rowitem"><span class="chip green">✓</span><div style="flex:1"><div class="t small">${c.title}</div><div class="d">${c.location} · ${c.dates} · ${c.credits} credits</div></div><button class="btn ghost small" data-cme-cancel="${c.id}">Cancel</button></div>`).join("")}</div>`:""}

  ${section("online","💻 Look up online CME")}
  ${section("local","📍 Live CME near you")}
  ${section("destination","✈️ Destination CME — restorative &amp; cost-effective")}
  <div class="tiny" style="margin-top:12px">One tap books the program, holds the dates, logs the credits, and — for a destination program — starts the travel plan. Easier than booking a family trip.</div>`;
}

/* ==========================================================================
   CHIEF WELLNESS OFFICER — AMA Joy in Medicine
   ========================================================================== */
function vJoy(){
  const a = AMA, cur = a.tiers.indexOf(a.currentTier);
  return `
  <h1 class="page-title">Joy in Medicine <span class="muted" style="font-size:15px">organizational well-being</span></h1>
  <p class="page-sub">${a.program} — the system-level program a Chief Wellness Officer runs. LumaChart supplies the measurement.</p>

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
    <h3>Recognition domains <span class="chip ${a.domains.filter(d=>d.met).length>=5?'green':'amber'}">${a.domains.filter(d=>d.met).length} of 6 met · need 5</span></h3>
    ${a.domains.map(d=>`<div class="rowitem"><span class="chip ${d.met?'green':'plain'}" style="min-width:26px; text-align:center">${d.met?'✓':'…'}</span><div style="flex:1"><div class="t small">${d.key}</div><div class="d">${d.evidence}</div></div></div>`).join('')}
    <div class="evidence">Efficiency of Practice Environment is where LumaChart is strongest — EHR8, WOW8 and IB-Time8 quantify documentation burden, and Canary + team choreography reduce it. The report auto-populates domain evidence from LumaChart activity.</div>
    <button class="btn primary" data-nav-inline="report" style="margin-top:10px">Request Joy in Medicine data extract report →</button>
  </div>`;
}

function vEhr8(){
  const m = AMA.metrics;
  const maxE = Math.max(...m.map(x=>x.ehr8)), maxW = Math.max(...m.map(x=>x.wow8)), maxI = Math.max(...m.map(x=>x.ibt8));
  return `
  <h1 class="page-title">EHR8 · WOW8 · IB-Time8</h1>
  <p class="page-sub">The AMA program's efficiency metrics: time in the record, work that follows clinicians home, and time buried in the inbox.</p>

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
  const a = AMA, met = a.domains.filter(d=>d.met).length;
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
  const a = AMA, met = a.domains.filter(d=>d.met).length, today = new Date().toISOString().slice(0,10);
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
${a.domains.map(d=>`<tr><td>${d.key}</td><td class="${d.met?'met':'pend'}">${d.met?'Met':'In progress'}</td><td>${d.evidence}</td></tr>`).join('')}</table>
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

/* ==========================================================================
   RENDER + WIRING
   ========================================================================== */
const VIEWS = {
  clinician:{ dashboard:vDashboard, chart:vChart, inbox:vInbox, billing:vBilling, cme:vCME, wellness:vWellness, canary:vCanary, synthesis:vSynthesis, roadmap:vRoadmap },
  patient:{ checkin:vCheckin, home:vHome, plan:vPlan, screenings:vScreenings, myplan:vMyPlan, longevity:vLongevity, consent:vConsent },
  researcher:{ console:vConsole, synthesis:vSynthesis, roadmap:vRoadmap },
  cwo:{ joy:vJoy, ehr8:vEhr8, report:vReport },
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
  const cre = $("#claim-reset"); if (cre) cre.addEventListener("click", () => { state.claim = { dxAdded:false, verified:{}, stage:"code" }; render(); });

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

  // --- Joy in Medicine data extract report ---
  const gjr = $("#gen-joy-report"); if (gjr) gjr.addEventListener("click", generateJoyReport);
  const sjr = $("#submit-joy-report"); if (sjr) sjr.addEventListener("click", () => toast("Submitted to AMA portal", `${AMA.orgName}'s ${AMA.applyingFor} application data extract was routed to the AMA Joy in Medicine application portal. You'll be notified of the review outcome.`, "green"));
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
updateWellnessUI();
setInterval(canaryTick, 1000);
setTimeout(() => toast("Welcome to LumaChart", "Restore Mode (low-glare dark) is on to reduce eyestrain. Tap any notification to dismiss it — they stay gentle and out of your way.", "green"), 4500);
