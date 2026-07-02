/* ==========================================================================
   LumaChart prototype — app logic
   Roles: clinician / patient / researcher · Themes: restore / classic / modern
   Canary: burnout early-warning engine on an accelerated demo clock (1s = 1min)
   ========================================================================== */

const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];

const state = { role:"clinician", view:"dashboard", canary:{ sessionMin:0, snoozedUntil:0, fired:{} } };

/* ---------- evidence helper ---------- */
const ev = key => {
  if (!key || !EVIDENCE[key]) return "";
  const e = EVIDENCE[key];
  return ` <span class="pmid" title="${e.cite}">PMID ${e.pmid}</span>`;
};
const evidenceCard = key => {
  if (!key || !EVIDENCE[key]) return "";
  const e = EVIDENCE[key];
  return `<div class="evidence"><b>Why we recommend this:</b> ${e.cite} <span class="pmid" title="Verified against PubMed">PMID ${e.pmid}</span></div>`;
};

/* ==========================================================================
   THEME SWITCHING — Restore Mode is the default, called out as a feature
   ========================================================================== */
$$(".theme-btn").forEach(btn => btn.addEventListener("click", () => {
  document.documentElement.dataset.theme = btn.dataset.themepick;
  $$(".theme-btn").forEach(b => b.classList.toggle("active", b === btn));
  if (btn.dataset.themepick !== "restore" && !state.canary.fired.themeNote) {
    state.canary.fired.themeNote = true;
    toast("Theme changed", "Restore Mode (low-glare dark) is LumaChart's default — designed to reduce eyestrain on long shifts. Switch back any time.", "green");
  }
}));

/* ==========================================================================
   ROLE SWITCHING + NAVIGATION
   ========================================================================== */
const NAVS = {
  clinician: [
    { label:"Care", items:[
      { id:"dashboard", ic:"▦", t:"Today" },
      { id:"chart",     ic:"▤", t:"Patient chart" },
      { id:"inbox",     ic:"✉", t:"Inbox", badge:() => INBOX.length },
    ]},
    { label:"You", items:[
      { id:"wellness",  ic:"❦", t:"Wellness Center" },
      { id:"canary",    ic:"🐦", t:"Canary" },
    ]},
  ],
  patient: [
    { label:"My health", items:[
      { id:"home",      ic:"✚", t:"Healthspan home" },
      { id:"plan",      ic:"◷", t:"Prevention plan", badge:() => PREVENTION_PLAN.filter(p=>p.status==="due").length },
      { id:"longevity", ic:"↗", t:"Longevity tracker" },
      { id:"consent",   ic:"✔", t:"Research & consent" },
    ]},
  ],
  researcher: [
    { label:"Public health", items:[
      { id:"console",   ic:"◫", t:"Research console" },
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
  $("#sidenav").innerHTML = NAVS[state.role].map(group => `
    <div class="nav-label">${group.label}</div>
    ${group.items.map(i => `
      <button class="nav-item ${state.view===i.id?"active":""}" data-nav="${i.id}">
        <span class="ic">${i.ic}</span>${i.t}
        ${i.badge ? `<span class="badge">${i.badge()}</span>` : ""}
      </button>`).join("")}
  `).join("");
  $$("[data-nav]").forEach(b => b.addEventListener("click", () => { state.view = b.dataset.nav; render(); }));
}

/* ==========================================================================
   VIEWS — CLINICIAN
   ========================================================================== */
function vDashboard(){
  const face = 3.2, desk = 2.9;
  return `
  <h1 class="page-title">Good morning, Dr. Chen</h1>
  <p class="page-sub">Tuesday · 6 visits scheduled · your day is designed to end on time.</p>

  <div class="grid g23">
    <div class="card">
      <h3><span class="spark">▦</span> Today's schedule</h3>
      <div class="rowlist">
        ${SCHEDULE.map(p => `
          <div class="rowitem">
            <div class="avatar">${p.initials}</div>
            <div style="flex:1">
              <div class="t">${p.time} — ${p.name} <span class="tiny">(${p.age}${p.sex})</span></div>
              <div class="d">${p.reason} ${p.preVisit ? `· <span class="chip accent">pre-visit ✓${""}</span>` : ""}</div>
            </div>
            <span class="chip ${p.status==="roomed"?"green":p.status==="arrived"?"amber":"plain"}">${p.status}</span>
          </div>`).join("")}
      </div>
      <div class="evidence">Pre-visit questionnaires flow patient concerns straight into your note — patients contributing to the record increases efficiency and engagement.${ev("mafi")}</div>
    </div>

    <div style="display:flex; flex-direction:column; gap:16px">
      <div class="card">
        <h3><span class="spark">⏱</span> Time well spent</h3>
        <div class="small muted" style="margin-bottom:6px">Face time vs. desktop time (today)</div>
        <div class="small">With patients — <b>${face} h</b></div>
        <div class="bar" style="margin:4px 0 10px"><i class="green" style="width:${face/(face+desk)*100}%"></i></div>
        <div class="small">In the EHR — <b>${desk} h</b></div>
        <div class="bar" style="margin:4px 0 6px"><i class="amber" style="width:${desk/(face+desk)*100}%"></i></div>
        <div class="tiny">National benchmark: ~2 h of EHR/desk work per 1 h of care.${ev("sinskyTM")} LumaChart's goal is to flip that ratio.</div>
      </div>
      <div class="card">
        <h3><span class="spark">🐦</span> Canary</h3>
        <div id="canary-mini" class="small muted">Watching over your session…</div>
        <div class="tiny" style="margin-top:8px">Private to you. Never used for productivity review.</div>
        <button class="btn ghost small" style="margin-top:10px" data-nav-inline="canary">Open Canary panel →</button>
      </div>
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
    <h3>Progress note <span class="chip green">billing decoupled — handled automatically</span></h3>
    <textarea class="note-editor" id="lean-note">58F with T2DM and HTN, both improving. A1c 6.9 (from 7.4), BP 132/81 on lisinopril 20. Reports nocturnal foot tingling — monofilament exam today. Asked about Mediterranean diet; counseled and shared evidence card. Goal: dancing at daughter's wedding in October. Plan: continue current meds; colonoscopy referral placed; follow-up 3 months.</textarea>
    <div class="tiny" style="margin-top:8px"><span id="note-count"></span> — U.S. notes average ~4× the length of the same EHR abroad because billing data bloats them. LumaChart keeps the note clinical.${ev("downing")}</div>
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
      <div class="rowitem"><div class="d">✅ Snoozable — you stay in control, always</div></div>
    </div>
  </div>`;
}

/* ==========================================================================
   VIEWS — PATIENT (Maria Alvarez persona)
   ========================================================================== */
function vHome(){
  const done = PREVENTION_PLAN.filter(p=>p.status!=="due").length;
  const pct = Math.round(done/PREVENTION_PLAN.length*100);
  return `
  <h1 class="page-title">Welcome back, Maria</h1>
  <p class="page-sub">Your record is organized around one question: <b>how do you stay well and live longer?</b></p>

  <div class="grid g32">
    <div class="card" style="display:flex; align-items:center; gap:22px">
      <div class="ring" style="--p:${pct}; --ring-color:var(--green)"><div><b>${done}/${PREVENTION_PLAN.length}</b><span>prevention</span></div></div>
      <div>
        <h3 style="margin-bottom:6px">Health maintenance</h3>
        <p class="small muted" style="margin:0 0 10px">You're up to date on ${done} of ${PREVENTION_PLAN.length} evidence-based prevention items. Two are ready to schedule.</p>
        <button class="btn primary" data-nav-inline="plan">See my prevention plan →</button>
      </div>
    </div>
    <div class="card">
      <h3>What's due now</h3>
      ${PREVENTION_PLAN.filter(p=>p.status==="due").map(p=>`
        <div class="rowitem"><div style="flex:1"><div class="t small">${p.t}</div></div><button class="btn small">Schedule</button></div>`).join("")}
    </div>
  </div>
  <div class="section-gap"></div>

  <div class="grid g3">
    <div class="card"><div class="metric"><div class="v" style="color:var(--green)">6.9%</div><div class="l">A1c — down from 7.4. Your work is paying off.</div></div></div>
    <div class="card"><div class="metric"><div class="v">132/81</div><div class="l">Blood pressure — close to your &lt;130 goal${ev("sprint")}</div></div></div>
    <div class="card"><div class="metric"><div class="v" style="color:var(--accent)">95<span style="font-size:15px"> min/wk</span></div><div class="l">Activity — every 15 min/day adds up${ev("activity")}</div></div></div>
  </div>
  <div class="section-gap"></div>

  <div class="card">
    <h3>A note from your care team</h3>
    <p class="small muted" style="margin:0">"Maria — your A1c improvement is real progress. We read your question about olive oil: yes, the evidence is strong. See your prevention plan for the study behind it. — Dr. Chen"</p>
  </div>`;
}

function vPlan(){
  return `
  <h1 class="page-title">Your prevention plan</h1>
  <p class="page-sub">Every recommendation comes with the actual evidence — you deserve to know <i>why</i>.</p>
  ${PREVENTION_PLAN.map(p=>`
    <div class="card" style="margin-bottom:14px">
      <h3>${p.t}
        ${p.status==="due"?`<span class="chip amber">due — schedule now</span>`:p.status==="done"?`<span class="chip green">complete</span>`:`<span class="chip accent">active</span>`}
      </h3>
      <p class="small" style="margin:0 0 4px">${p.detail}</p>
      <p class="small muted" style="margin:0"><b>What it buys you:</b> ${p.benefit}</p>
      ${p.ev ? evidenceCard(p.ev) : `<div class="evidence"><b>Basis:</b> national guideline recommendation (USPSTF / CDC-ACIP).</div>`}
    </div>`).join("")}`;
}

function vLongevity(){
  return `
  <h1 class="page-title">Longevity tracker</h1>
  <p class="page-sub">Five modifiable numbers, one goal: more healthy years. Small moves on these compound.</p>
  ${LONGEVITY.map(l=>`
    <div class="card" style="margin-bottom:13px">
      <div style="display:flex; align-items:center; gap:14px">
        <div style="flex:1"><b>${l.m}</b>
          <div class="small muted">now <b>${l.now}</b> · target <b>${l.target}</b>${l.ev?ev(l.ev):""}</div></div>
        <div style="width:220px"><div class="bar"><i class="${l.pct>=90?"green":l.pct>=65?"":"amber"}" style="width:${l.pct}%"></i></div></div>
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
   VIEWS — RESEARCHER
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
   RENDER
   ========================================================================== */
const VIEWS = {
  clinician:{ dashboard:vDashboard, chart:vChart, inbox:vInbox, wellness:vWellness, canary:vCanary },
  patient:{ home:vHome, plan:vPlan, longevity:vLongevity, consent:vConsent },
  researcher:{ console:vConsole },
};

function render(){
  renderNav();
  $("#content").innerHTML = VIEWS[state.role][state.view]();
  $("#content").scrollTop = 0;
  wireView();
}

function wireView(){
  $$("[data-nav-inline]").forEach(b => b.addEventListener("click", () => { state.view = b.dataset.navInline; render(); }));
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
  const ct = $("#consent-toggle");
  if (ct) ct.addEventListener("change", () => {
    const s = $("#consent-state");
    s.textContent = ct.checked ? "ON" : "OFF";
    s.style.color = ct.checked ? "var(--green)" : "var(--red)";
    toast("Consent updated", ct.checked ? "Thank you — your de-identified data will help public-health research." : "You've opted out. Your data is excluded from all future extracts, effective immediately.", ct.checked ? "green" : "amber");
  });
  updateCanaryMini();
}

/* ==========================================================================
   BREATHING EXERCISE (box breathing, 1 minute)
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
    phase++;
    elapsed += 4;
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
  if (state.role !== "clinician") return;              // Canary watches clinicians
  if (m < state.canary.snoozedUntil) return;

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
      <p class="small">You've been logged in for <b>${fmtMin(state.canary.sessionMin)}</b> continuously. Long uninterrupted EHR sessions are one of the measured drivers of burnout — primary-care physicians average 5.9 hr/day in the EHR, with 1.4 hr after hours. <span class="pmid" title="${EVIDENCE.arndt.cite}">PMID 28893811</span></p>
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
  const el = document.createElement("div");
  el.className = `toast ${tone==="green"?"green":tone==="amber"?"amber":""}`;
  el.innerHTML = `<b>${title}</b>${body}`;
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
render();
setInterval(canaryTick, 1000);   // 1 real second = 1 demo minute
setTimeout(() => toast("Welcome to LumaChart", "Restore Mode (low-glare dark) is on by default to reduce eyestrain — switch themes any time, top right. Canary is watching over your session, privately.", "green"), 1200);
