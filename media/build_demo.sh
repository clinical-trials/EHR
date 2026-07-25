#!/bin/bash
set -e
W=/Users/lgm/public-health-ehr/media
BUNDLE=/Users/lgm/public-health-ehr/dist/LumaChart.html
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
VOICE="Samantha"
rm -rf "$W/frames" "$W/audio" "$W/clips"; mkdir -p "$W/frames" "$W/audio" "$W/clips"

shoot(){ "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=1280,800 --virtual-time-budget=2000 --screenshot="$1" "file://$2" >/dev/null 2>&1; }

# ---- override script injected into the bundle for each app frame ----
OVR_HEAD='<script>(function(){try{
state.wellness=true; state.canary={sessionMin:0,snoozedUntil:999999,fired:{micro:true,breathe:true,extended:true}};'
OVR_TAIL='render();
document.querySelectorAll(".theme-btn[data-themepick]").forEach(function(b){b.classList.toggle("active",b.dataset.themepick===document.documentElement.getAttribute("data-theme"))});
var t=document.getElementById("toast-layer"); if(t) t.innerHTML="";
var m=document.getElementById("modal-layer"); if(m) m.classList.add("hidden");
function sc(k){var el;var hs=[].slice.call(document.querySelectorAll("h3"));
 if(k==="uspstf")el=hs.filter(function(h){return /USPSTF/.test(h.textContent)})[0];
 else if(k==="helix")el=hs.filter(function(h){return /Requested by clinicians/.test(h.textContent)})[0];
 else if(k==="irb")el=hs.filter(function(h){return /IRB of record/.test(h.textContent)})[0];
 if(!el){window.scrollTo(0,0);return;}
 var y=el.getBoundingClientRect().top+(window.pageYOffset||0)-120;
 var max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
 window.scrollTo(0,Math.max(0,Math.min(y,max)));}
sc(SCROLLKEY);
var c=document.createElement("div");
c.style.cssText="position:fixed;left:0;right:0;bottom:0;z-index:99999;padding:16px 30px;font:600 22px -apple-system,Arial;color:#fff;background:linear-gradient(0deg,rgba(8,14,19,.95),rgba(8,14,19,0))";
c.innerHTML=decodeURIComponent(escape(atob(CAPB64))); document.body.appendChild(c);
}catch(e){document.body.innerHTML="<pre style=color:red>"+e.message+"</pre>";}})();</script>'

make_frame(){ # id role view theme scrollkey caption
  local id="$1" role="$2" view="$3" theme="$4" sk="$5" cap="$6"
  local b64; b64=$(printf '%s' "$cap" | base64)
  { cat "$BUNDLE"
    printf '%s\n' "$OVR_HEAD"
    printf 'state.role=%s; state.view=%s; state.activeInstrument=null;\n' "\"$role\"" "\"$view\""
    printf 'document.documentElement.setAttribute("data-theme",%s);\n' "\"$theme\""
    printf '%s\n' "$OVR_TAIL" | sed "s#SCROLLKEY#\"$sk\"#; s#CAPB64#\"$b64\"#"
  } > "$W/frames/$id.html"
  shoot "$W/frames/$id.png" "$W/frames/$id.html"
}

# ---- standalone title & closing cards ----
cat > "$W/frames/00title.html" <<'HTML'
<!doctype html><meta charset=utf-8><body style="margin:0;width:1280px;height:800px;background:radial-gradient(120% 90% at 78% 8%,#143444,#12222F 42%,#0B1621);font-family:-apple-system,Arial;color:#EAF3F5;display:flex;flex-direction:column;justify-content:center;padding:0 90px;box-sizing:border-box">
<div style="display:flex;align-items:center;gap:18px">
<div style="width:64px;height:64px;border-radius:18px;background:conic-gradient(from 130deg,#5AD1E0,#86BEA4,#F2B04C,#5AD1E0);position:relative"><div style="position:absolute;inset:8px;border-radius:12px;background:#12222F"></div></div>
<div style="font-size:42px;font-weight:800;letter-spacing:-1px">Luma<span style="color:#5AD1E0">Chart</span></div></div>
<div style="font-size:56px;font-weight:800;letter-spacing:-1.5px;line-height:1.05;margin-top:44px">The hospital EHR<br>built for <span style="color:#5AD1E0">public health.</span></div>
<div style="font-size:24px;color:#B9D6DC;margin-top:22px">A 3-minute tour — evidence <b>on</b> the record, not just AI.</div>
<div style="position:absolute;bottom:40px;left:90px;color:#F2B04C;font-weight:700;letter-spacing:.5px">LUMAEHR.com</div></body>
HTML
shoot "$W/frames/00title.png" "$W/frames/00title.html"

cat > "$W/frames/99close.html" <<'HTML'
<!doctype html><meta charset=utf-8><body style="margin:0;width:1280px;height:800px;background:radial-gradient(120% 90% at 22% 92%,#143444,#12222F 42%,#0B1621);font-family:-apple-system,Arial;color:#EAF3F5;display:flex;flex-direction:column;justify-content:center;padding:0 90px;box-sizing:border-box">
<div style="font-size:58px;font-weight:800;letter-spacing:-1.5px;line-height:1.06">Not AI on the EHR.<br><span style="color:#5AD1E0">Evidence on the EHR.</span></div>
<div style="font-size:23px;color:#B9D6DC;margin-top:26px;max-width:760px">Clinician sustainability, patient healthspan, and public-health research — one architecture, every claim cited.</div>
<div style="font-size:26px;color:#F2B04C;font-weight:700;margin-top:34px">LUMAEHR.com</div>
<div style="position:absolute;bottom:40px;left:90px;right:90px;color:#7f97a0;font-size:14px;border-top:1px solid #22384a;padding-top:14px">Demonstration prototype · synthetic data only · not for clinical use.</div></body>
HTML
shoot "$W/frames/99close.png" "$W/frames/99close.html"

# ---- content frames ----
make_frame 02dash   clinician dashboard  restore top    "Evidence on the EHR — not just AI"
make_frame 03chart  clinician chart      restore top    "USPSTF Grade A &amp; B prevention, in the chart"
make_frame 04screen patient   screenings restore top    "Mental health is health"
make_frame 05canary clinician canary     restore top    "Canary — a private burnout early-warning"
make_frame 06bill   clinician billing    restore top    "Full ICD-10 capture, agent-assisted coding"
make_frame 07eco    clinician ecosystem  restore top    "Connected to payers, labs &amp; telehealth"
make_frame 08helix  clinician helix      restore top    "Helix Hub — a vetted app marketplace"
make_frame 09res    researcher console   restore top    "Consented, IRB-gated public-health research"
make_frame 10cwo    cwo       joy        restore top    "AMA Joy in Medicine — measured"
make_frame 11pt     patient   home       restore top    "A patient portal built for healthspan"
make_frame 12theme  clinician dashboard  classic top    "Three themes, plus a well-being toggle"
make_frame 13syn    clinician synthesis  restore top    "Physician health × interoperability"

# ---- narration (order matters) ----
declare -a ORDER=(00title 02dash 03chart 04screen 05canary 06bill 07eco 08helix 09res 10cwo 11pt 12theme 13syn 99close)
narr(){ printf '%s' "$2" > "$W/audio/$1.txt"; say -v "$VOICE" -f "$W/audio/$1.txt" -o "$W/audio/$1.aiff"; }
narr 00title  "LumaChart. The hospital E H R built for public health. Here is a quick tour."
narr 02dash   "LumaChart is an electronic health record built around evidence and public health. Right on the dashboard, an after hours workload tile, cited to the research."
narr 03chart  "Every patient chart surfaces the grade A and grade B preventive care the U S Preventive Services Task Force recommends. Each one backed by a real citation."
narr 04screen "Validated, public domain tools like the P H Q nine and G A D seven score instantly, and return evidence based, symptom targeted self care. Mental health is health."
narr 05canary "Canary watches a clinician's own E H R time and after hours load, and nudges gently. It is private, and never used for productivity."
narr 06bill   "Encounter and claim codes every condition, an agent drafts the C P T codes for sign off, and a Puerto Rico bridge maps to I C D nine where payers still need it."
narr 07eco    "LumaChart connects to the wider ecosystem. Real time eligibility and prior authorization, one tap genetic and specialty lab orders, and a national telehealth network."
narr 08helix  "Helix Hub is a vetted app store on the record. Clinicians can request new tools or research questions, and the community votes them up."
narr 09res    "The research console turns consented, de identified data into public health knowledge. I R B gated, audit logged, with consent modeled on the seventy eight year Framingham Heart Study."
narr 10cwo    "For leaders, a chief wellness officer dashboard tracks A M A Joy in Medicine recognition, and the E H R time and work outside of work metrics, by specialty."
narr 11pt     "Patients get a portal organized around staying well. Prevention, longevity, community health, digital payments, and language first communication."
narr 12theme  "Prefer a classic light interface? Switch themes in a click, or hide the well being features entirely for a lean clinical view."
narr 13syn    "It all ties together. Clinician centered interoperability is physician health infrastructure, and the same lean data serves public health."
narr 99close  "LumaChart. Not A I on the E H R. Evidence on the E H R. This is a demonstration prototype with synthetic data. Learn more at luma E H R dot com."

# ---- build clips (image + narration, +0.9s tail) ----
: > "$W/clips.txt"
for id in "${ORDER[@]}"; do
  dur=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$W/audio/$id.aiff")
  tot=$(echo "$dur + 0.9" | bc)
  ffmpeg -y -loglevel error -loop 1 -i "$W/frames/$id.png" -i "$W/audio/$id.aiff" \
    -vf "scale=1280:800,setsar=1,format=yuv420p" -t "$tot" -r 30 \
    -c:v libx264 -preset veryfast -crf 23 -c:a aac -b:a 128k -movflags +faststart "$W/clips/$id.mp4"
  echo "file 'clips/$id.mp4'" >> "$W/clips.txt"
done

cd "$W"
ffmpeg -y -loglevel error -f concat -safe 0 -i clips.txt -c copy LumaChart-demo-voiceover.mp4
ffmpeg -y -loglevel error -i LumaChart-demo-voiceover.mp4 -an -c:v copy LumaChart-demo-silent.mp4

echo "=== RESULTS ==="
for f in LumaChart-demo-voiceover.mp4 LumaChart-demo-silent.mp4; do
  d=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$f")
  s=$(ls -la "$f" | awk '{print $5}')
  printf "%-34s %6.1fs  %5.1f MB\n" "$f" "$d" "$(echo "scale=2;$s/1048576"|bc)"
done