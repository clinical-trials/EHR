const fs = require("fs");
const C = { ink:"#12303a", sub:"#5a6c76", line:"#d7e2e5", bg:"#ffffff",
  teal:"#0e7c8b", tealT:"#e9f6f8", green:"#2e8b62", amber:"#b3792a", grey:"#9aa8ae" };
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
let S="";
const rect=(x,y,w,h,r,fill,stroke,sw=1)=>{ S+=`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${sw}"`:""}/>`; };
const txt=(x,y,t,{size=13,fill=C.ink,weight=400,anchor="start",ls=0}={})=>{ S+=`<text x="${x}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="${size}" fill="${fill}" font-weight="${weight}" text-anchor="${anchor}"${ls?` letter-spacing="${ls}"`:""}>${esc(t)}</text>`; };

// status -> glyph + color
const G = { strong:["✓",C.green], luma:["✓",C.teal], part:["◑",C.amber], weak:["—",C.grey], neut:["•",C.grey] };

const W=1440;
const cols = ["Epic","Oracle Health (Cerner)","Jane","LumaChart"];
const LX=44, LW=344;                    // label column
const DX=LX+LW, DW=(W-44-DX)/4;         // 4 data cols
const colX = i => DX + i*DW;
const lumaI = 3;

// rows: label, [ [status,text] x4 ]
const rows = [
 ["Segment / setting", [["neut","Hospital & enterprise"],["neut","Hospital & enterprise"],["neut","Outpatient allied-health"],["luma","Hospital + public health"]]],
 ["Design center", [["weak","Revenue cycle"],["weak","Revenue cycle"],["part","Practice management"],["luma","Well-being + a real note"]]],
 ["Physician-burnout focus", [["weak","Assoc. with burden"],["weak","Assoc. with burden"],["part","Lighter UX (small clinics)"],["luma","The problem it treats"]]],
 ["Evidence at point of care, cited on the record", [["part","Links out / add-on"],["part","Links out / add-on"],["weak","Not a focus"],["luma","Embedded · PMID + § cited"]]],
 ["ONC certification (45 CFR Part 170)", [["strong","Certified"],["strong","Certified"],["weak","Not a certified EHR"],["part","Certification by design (path)"]]],
 ["Governed AI — registry · PCCP · kill switch", [["part","AI present; governance varies"],["part","AI present; governance varies"],["weak","Not a focus"],["luma","§170.315(b)(11) · FDA/PCCP"]]],
 ["50-state + PR statutory-deadline engine", [["weak","Per-install config"],["weak","Per-install config"],["weak","Not a focus"],["luma","Built-in · with countdowns"]]],
 ["Interoperability (FHIR · USCDI · TEFCA · SMART apps)", [["strong","Yes"],["strong","Yes"],["part","Limited / partner list"],["luma","Standards-native + app store"]]],
 ["Transparent, published pricing", [["weak","Opaque, quote-only"],["weak","Opaque, quote-only"],["strong","Published"],["luma","Published + CMS 180 / GFE native"]]],
 ["Public health / learning health system", [["part","Research (Cosmos)"],["part","Research network"],["weak","Not a focus"],["luma","Consented registry + RSI loop"]]],
 ["Maturity (candid)", [["strong","Dominant, deployed"],["part","Deployed; rollout challenges"],["strong","Widely used (SMB)"],["part","Working prototype"]]],
];

// ---------- title ----------
txt(LX,52,"How LumaChart compares",{size:30,weight:800});
txt(LX,80,"Epic · Oracle Health (Cerner) · Jane — and where a well-being-first, compliance-native EHR wins.",{size:14,fill:C.sub});

const topY=110, headH=46, rowH=62;
const tableBottom = topY+headH+rows.length*rowH;

// luma column highlight (behind everything)
rect(colX(lumaI)-6, topY-4, DW+2, headH+rows.length*rowH+10, 12, C.tealT, C.teal, 1.5);

// header row
cols.forEach((c,i)=>{
  const cx=colX(i)+DW/2;
  txt(cx, topY+30, c, {size: i===lumaI?15:14, weight:800, anchor:"middle", fill: i===lumaI?C.teal:C.ink});
});
txt(LX, topY+30, "", {});

// rows
let y=topY+headH;
rows.forEach((r,ri)=>{
  if(ri%2===0){ rect(LX-8, y, W-2*36-  (LX-36), rowH, 8, "#f4f8f9"); } // zebra (label+left cols); keep under luma tint
  // re-draw luma tint segment over zebra for this row
  rect(colX(lumaI)-6, y, DW+2, rowH, 0, C.tealT);
  // label
  wrapLabel(LX, y+rowH/2, r[0]);
  // cells
  r[1].forEach((cell,ci)=>{
    const [st,text]=cell; const [gly,gcol]=G[st];
    const cx=colX(ci)+16;
    txt(cx, y+rowH/2+5, gly, {size:16, weight:800, fill: gcol});
    wrapCell(colX(ci)+38, y+rowH/2, text, DW-46, ci===lumaI);
  });
  y+=rowH;
});

// row separators
for(let i=0;i<=rows.length;i++){ S+=`<line x1="${LX-8}" y1="${topY+headH+i*rowH}" x2="${W-36}" y2="${topY+headH+i*rowH}" stroke="${C.line}" stroke-width="1"/>`; }

// helpers for wrapping (approx)
function wrapLabel(x,yc,t){
  const max=40; const words=t.split(" "); let l1="",l2="";
  words.forEach(w=>{ if((l1+" "+w).trim().length<=max && !l2.length) l1=(l1?l1+" ":"")+w; else l2=(l2?l2+" ":"")+w; });
  if(l2){ txt(x,yc-4,l1,{size:13.5,weight:700}); txt(x,yc+15,l2,{size:13.5,weight:700}); }
  else txt(x,yc+5,l1,{size:13.5,weight:700});
}
function wrapCell(x,yc,t,w,luma){
  const cpl=Math.floor(w/6.4); const words=t.split(" "); let l1="",l2="";
  words.forEach(wd=>{ if((l1+" "+wd).trim().length<=cpl && !l2.length) l1=(l1?l1+" ":"")+wd; else l2=(l2?l2+" ":"")+wd; });
  const col=luma?C.ink:C.sub, wt=luma?700:400;
  if(l2){ txt(x,yc-4,l1,{size:12,fill:col,weight:wt}); txt(x,yc+13,l2,{size:12,fill:col,weight:wt}); }
  else txt(x,yc+4,l1,{size:12,fill:col,weight:wt});
}

// ---------- footer ----------
const fy=tableBottom+34;
rect(LX-8, fy-24, W-2*36-(LX-36), 40, 10, "#0f2731");
txt(LX+8, fy+2, "Legacy EHRs make you compliant in the back office. LumaChart makes compliance a live, cited, 50-state instrument on the screen.", {size:14, fill:"#eaf3f5", weight:700});
// legend
const ly=fy+44;
txt(LX,ly,"✓",{size:14,weight:800,fill:C.green}); txt(LX+18,ly,"strong",{size:12,fill:C.sub});
txt(LX+90,ly,"◑",{size:14,weight:800,fill:C.amber}); txt(LX+108,ly,"partial / in progress",{size:12,fill:C.sub});
txt(LX+270,ly,"—",{size:14,weight:800,fill:C.grey}); txt(LX+288,ly,"not a focus",{size:12,fill:C.sub});
txt(W-36,ly,"Comparison for discussion · competitor rows summarize public positioning · LumaChart is a demonstration prototype · lumaehr.com",{size:10.5,fill:C.grey,anchor:"end"});

const H=ly+34;
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${C.bg}"/>${S}</svg>`;
const win=W/96, hin=H/96;
const html=`<!doctype html><html><head><meta charset="utf-8"><style>@page{size:${win.toFixed(3)}in ${hin.toFixed(3)}in;margin:0}html,body{margin:0}svg{display:block}</style></head><body>${svg}</body></html>`;
fs.writeFileSync(process.argv[2],html); fs.writeFileSync(process.argv[3],svg);
console.log("wrote",process.argv[2],"H=",H);
