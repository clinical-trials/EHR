const fs = require("fs");
// ---- palette ----
const C = {
  ink:"#12303a", sub:"#5a6c76", line:"#cfdde0", bg:"#ffffff",
  patient:"#0e7c8b", provider:"#2e8b62", core:"#12303a", eco:"#b3792a", research:"#6a4fb0", admin:"#c2472f",
};
const tint = { patient:"#e6f4f6", provider:"#e6f4ec", core:"#eef2f4", eco:"#fbf1e2", research:"#efeafb", admin:"#fceae5" };
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
let S = "";
const rect=(x,y,w,h,r,fill,stroke,sw=1)=>{ S+=`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${sw}"`:""}/>`; };
const text=(x,y,t,{size=13,fill=C.ink,weight=400,anchor="start",ls=0}={})=>{ S+=`<text x="${x}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="${size}" fill="${fill}" font-weight="${weight}" text-anchor="${anchor}"${ls?` letter-spacing="${ls}"`:""}>${esc(t)}</text>`; };
const line=(x1,y1,x2,y2,stroke,sw=2,dash="")=>{ S+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}"${dash?` stroke-dasharray="${dash}"`:""} marker-end="url(#arrow)"/>`; };
// a lane of feature chips
function lane(x,y,w,key,title,sub,items){
  const h = 44 + items.length*40 + 10;
  rect(x,y,w,h,14,tint[key],C[key],1.5);
  rect(x,y,w,30,14,C[key]); rect(x,y+15,w,15,0,C[key]);
  text(x+14,y+20,title,{size:13.5,fill:"#fff",weight:800,ls:0.5});
  text(x+14,y+44,sub,{size:9.5,fill:C.sub});
  let yy=y+58;
  items.forEach(it=>{ rect(x+12,yy,w-24,32,7,"#fff",C.line,1);
    text(x+22,yy+14,it[0],{size:11,weight:700,fill:C.ink});
    text(x+22,yy+27,it[1],{size:9,fill:C.sub}); yy+=40; });
  return {x,y,w,h,cx:x+w/2,bottom:y+h,top:y};
}
function band(x,y,w,h,key,title,sub){
  rect(x,y,w,h,14,tint[key],C[key],1.5);
  text(x+16,y+24,title,{size:13.5,fill:C[key],weight:800,ls:0.4});
  if(sub) text(x+16,y+42,sub,{size:10,fill:C.sub});
  return {x,y,w,h,cx:x+w/2,bottom:y+h,top:y};
}
function chips(x,y,w,items,key){ // row of small boxes inside a band
  const n=items.length, gap=10, bw=(w-(n+1)*gap)/n;
  items.forEach((it,i)=>{ const bx=x+gap+i*(bw+gap);
    rect(bx,y,bw,54,8,"#fff",C[key],1);
    text(bx+bw/2,y+20,it[0],{size:10.5,weight:800,fill:C[key],anchor:"middle"});
    // wrap sub to 2 lines
    const words=it[1].split(" "); let l1="",l2="";
    words.forEach(wd=>{ if((l1+" "+wd).length<=Math.floor(bw/5.2) && !l2) l1=(l1?l1+" ":"")+wd; else l2=(l2?l2+" ":"")+wd; });
    text(bx+bw/2,y+35,l1,{size:8.5,fill:C.sub,anchor:"middle"});
    if(l2) text(bx+bw/2,y+46,l2,{size:8.5,fill:C.sub,anchor:"middle"});
  });
}

// ===================== layout =====================
const W=1400; let H=1010; // H recomputed after bottom bands are placed
// title
text(40,42,"LumaChart — Systems & Operational Flow",{size:26,weight:800,fill:C.ink});
text(40,66,"A physician-resilience & wellness EHR: how the patient, the provider, the researcher, and leadership connect around one record.",{size:12.5,fill:C.sub});
rect(40,78,590,22,11,tint.provider,C.provider,1);
text(52,93,"Well-being first  ·  a real patient note  ·  billing succeeds quietly in the background",{size:10.5,weight:700,fill:C.provider});

// actor lanes (row 1)
const laneY=120, laneW=420;
const P = lane(40, laneY, laneW, "patient","1 · PATIENT","Their record, their access",[
  ["iPad pre-visit check-in","Confirms conditions, meds, demographics"],
  ["Healthspan portal","Prevention, screenings, longevity, community"],
  ["My record (patient-mediated)","HIPAA right of access · unified timeline"],
  ["Payments + Keep-your-coverage","Transparent bills · Medicaid renewal"],
  ["Secure messaging","Routed to staff, batched to the provider"],
]);
const PR = lane(490, laneY, laneW, "provider","2 · PROVIDER (physician)","No homework · not a data clerk",[
  ["Today + Focus (Luma Lean)","Run on time · one patient, one action"],
  ["Luma Scribe","Ambient draft note + suggested questions"],
  ["Chart + evidence CDS","USPSTF prevention · PubMed at point of care"],
  ["Batched inbox + delegation","2×/day · team-based, one route per task"],
  ["Encounter & claim","Agent coding · denial prevention (background)"],
  ["Canary + self-care (private)","Burnout early-warning · movement/nutrition"],
]);
const AD = lane(940, laneY, laneW, "admin","3 · LEADERSHIP — CWO / CMO / Admin","Not the physician's initial purview",[
  ["AI governance & assurance","Model registry · scale / pause / kill · PCCP"],
  ["Burden lab (measurement)","Audit-log time + validated burnout instrument"],
  ["Joy in Medicine + equity","AMA recognition · disaggregated well-being"],
  ["Deadlines & compliance","50-state + PR · statutory deadline tracking"],
  ["Bibliography (live)","Every claim cited · PMID / §170.315 / authority"],
]);

// core platform band (row 2) — sit below the TALLEST lane
const coreY = Math.max(P.bottom, PR.bottom, AD.bottom) + 34;
const CO = band(40, coreY, W-80, 118, "core","CORE PLATFORM & DATA BACKBONE",
  "Standards-native, evidence-linked, governed AI — the spine every role shares");
chips(56, coreY+52, W-112, [
  ["FHIR R4 + US Core","SMART on FHIR · §170.315(g)(10) API"],
  ["USCDI v3","National data classes (HTI-1 baseline)"],
  ["Evidence engine","PubMed / MEDLINE CDS, cited"],
  ["Governed AI","§170.315(b)(11) · FDA/PCCP · NAM AI Code"],
  ["50-state + PR compliance","Per-jurisdiction rules + deadlines"],
], "core");

// bottom row: ecosystem (left) + research (right)
const botY = CO.bottom + 34;
const EC = band(40, botY, 660, 150, "eco","EXTERNAL ECOSYSTEM  ·  interoperability that returns time",
  "Certified/partner modules — bought, not rebuilt (composition)");
chips(56, botY+56, 628, [
  ["Payers","Eligibility · prior auth (Da Vinci)"],
  ["Labs & genetics","Coded results, one-tap orders"],
  ["Telehealth","National virtual-care network"],
], "eco");
chips(56, botY+56+62, 628, [
  ["e-Prescribing","NCPDP SCRIPT · EPCS"],
  ["State EDRS / vital records","Death registration via VRDR FHIR → CDC/NCHS"],
  ["Health information exchange","TEFCA · C-CDA transitions of care"],
], "eco");

const RE = band(720, botY, W-760, 150, "research","RESEARCH & PUBLIC HEALTH  ·  the learning health system",
  "Consent-gated, IRB-approved, audit-logged — nothing leaves without approval");
chips(736, botY+56, W-792, [
  ["Consented de-identified registry","Explicit, revocable consent"],
  ["IRB-gated research console","Cohort export only after approval"],
  ["Public-health knowledge","Population insight, disparities"],
], "research");
chips(736, botY+56+62, W-792, [
  ["RSI discovery loop","Hypotheses → rank → test → learn (research layer)"],
  ["Back into evidence CDS","Validated findings return, governed"],
], "research");

// crop canvas to content (bottom bands are the lowest elements)
H = botY + 150 + 46;

// ===================== arrows =====================
// patient -> provider (check-in / portal / messaging)
line(P.x+P.w, laneY+70, PR.x, laneY+70, C.patient, 2.5);
text((P.x+P.w+PR.x)/2, laneY+62, "check-in · messages", {size:9, fill:C.patient, anchor:"middle", weight:700});
// provider <-> patient (results / plan back)
line(PR.x, laneY+150, P.x+P.w, laneY+150, C.provider, 2, "4 3");
text((P.x+P.w+PR.x)/2, laneY+168, "results · care plan", {size:9, fill:C.provider, anchor:"middle"});
// patient & provider -> core
line(P.cx, P.bottom, P.cx, coreY, C.patient, 2.5);
line(PR.cx, PR.bottom, PR.cx, coreY, C.provider, 2.5);
// leadership <- core (measurement/governance, aggregate/private)
line(CO.x+CO.w-120, coreY, AD.cx, AD.bottom, C.admin, 2.5, "5 4");
text(AD.cx+8, AD.bottom+22, "aggregate · private · governed", {size:9, fill:C.admin, anchor:"middle"});
// core <-> ecosystem
line(EC.cx, botY, EC.cx, CO.bottom, C.eco, 2.5);
S = S.replace(/marker-end="url\(#arrow\)"\/>(?=[^]*$)/,'marker-end="url(#arrow)"/>'); // noop keep
// core -> research and research -> core (loop)
line(RE.x+180, botY, RE.x+180, CO.bottom, C.research, 2.5);
line(RE.x+320, CO.bottom, RE.x+320, botY, C.research, 2, "4 3");

// footer
text(40,H-16,"Demonstration prototype · synthetic data only · every claim carries its PMID, §170.315 criterion, or authority citation · lumaehr.com",{size:9,fill:"#8a9aa4"});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs><marker id="arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
<path d="M0,0 L7,3 L0,6 z" fill="#7a8b93"/></marker></defs>
<rect width="${W}" height="${H}" fill="${C.bg}"/>${S}</svg>`;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:14in 10.1in;margin:0}html,body{margin:0}svg{display:block}</style></head><body>${svg}</body></html>`;
fs.writeFileSync(process.argv[2], html);
fs.writeFileSync(process.argv[3], svg);
console.log("wrote", process.argv[2], html.length, "bytes");
