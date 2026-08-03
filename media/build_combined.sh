#!/bin/bash
# Combined overview: main-demo basic/unique features + update well-being features,
# one cohesive cut, male (joe) Piper voice, target < 3:00.
set -e
cd /Users/lgm/public-health-ehr/media
. .ttsenv/bin/activate
export PATH="/opt/homebrew/bin:$PATH"
BUNDLE=/Users/lgm/public-health-ehr/dist/LumaChart.html
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
M=voices/joe.onnx
LS=1.05
rm -rf ov_frames ov_audio ov_clips; mkdir -p ov_frames ov_audio ov_clips

shoot(){ "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=1280,800 --virtual-time-budget=2000 --screenshot="$1" "file://$2" >/dev/null 2>&1; }

OVR_HEAD='<script>(function(){try{
state.canary={sessionMin:0,snoozedUntil:999999,fired:{micro:true,breathe:true,extended:true}};'
OVR_TAIL='render();
document.querySelectorAll(".theme-btn[data-themepick]").forEach(function(b){b.classList.toggle("active",b.dataset.themepick===document.documentElement.getAttribute("data-theme"))});
document.querySelectorAll(".role-btn").forEach(function(b){b.classList.toggle("active",b.dataset.role===state.role)});
var wt=document.getElementById("wellness-toggle"); if(wt) wt.classList.toggle("active",state.wellness);
var pill=document.getElementById("canary-pill"); if(pill) pill.style.display=state.wellness?"":"none";
var t=document.getElementById("toast-layer"); if(t) t.innerHTML="";
var m=document.getElementById("modal-layer"); if(m) m.classList.add("hidden");
function dec(b){return decodeURIComponent(escape(atob(b)));}
function pluck(s){ if(!s) return; var cards=[].slice.call(document.querySelectorAll("#content .card"));
 var tg=cards.filter(function(c){return c.textContent.indexOf(s)!==-1})[0]; if(!tg) return;
 var content=document.getElementById("content"); var ti=content.querySelector(".page-title"), su=content.querySelector(".page-sub");
 content.innerHTML=""; if(ti)content.appendChild(ti); if(su)content.appendChild(su); content.appendChild(tg); }
pluck(dec(PLUCKB64)); window.scrollTo(0,0);
var c=document.createElement("div");
c.style.cssText="position:fixed;left:0;right:0;bottom:0;z-index:99999;padding:16px 30px;font:600 22px -apple-system,Arial;color:#fff;background:linear-gradient(0deg,rgba(8,14,19,.95),rgba(8,14,19,0))";
c.innerHTML=dec(CAPB64); document.body.appendChild(c);
}catch(e){document.body.innerHTML="<pre style=color:red>"+e.message+"</pre>";}})();</script>'

make_frame(){ # id role view theme wellness pluck caption
  local id="$1" role="$2" view="$3" theme="$4" well="$5" pl="$6" cap="$7"
  local pb; pb=$(printf '%s' "$pl"  | base64)
  local cb; cb=$(printf '%s' "$cap" | base64)
  { cat "$BUNDLE"
    printf '%s\n' "$OVR_HEAD"
    printf 'state.role=%s; state.view=%s; state.activeInstrument=null; state.wellness=%s;\n' "\"$role\"" "\"$view\"" "$well"
    printf 'document.documentElement.setAttribute("data-theme",%s);\n' "\"$theme\""
    printf '%s\n' "$OVR_TAIL" | sed "s#PLUCKB64#\"$pb\"#; s#CAPB64#\"$cb\"#"
  } > "ov_frames/$id.html"
  shoot "ov_frames/$id.png" "$PWD/ov_frames/$id.html"
}

# ---- title / close cards (demo framing = best fit for "basic + unique features") ----
cat > ov_frames/00title.html <<'HTML'
<!doctype html><meta charset=utf-8><body style="margin:0;width:1280px;height:800px;background:radial-gradient(120% 90% at 78% 8%,#143444,#12222F 42%,#0B1621);font-family:-apple-system,Arial;color:#EAF3F5;display:flex;flex-direction:column;justify-content:center;padding:0 90px;box-sizing:border-box">
<div style="display:flex;align-items:center;gap:18px"><div style="width:64px;height:64px;border-radius:18px;background:conic-gradient(from 130deg,#5AD1E0,#86BEA4,#F2B04C,#5AD1E0);position:relative"><div style="position:absolute;inset:8px;border-radius:12px;background:#12222F"></div></div><div style="font-size:42px;font-weight:800;letter-spacing:-1px">Luma<span style="color:#5AD1E0">Chart</span></div></div>
<div style="font-size:56px;font-weight:800;letter-spacing:-1.5px;line-height:1.05;margin-top:44px">The hospital EHR<br>built for <span style="color:#5AD1E0">public health.</span></div>
<div style="font-size:24px;color:#B9D6DC;margin-top:22px">A quick tour — the everyday features, and what makes it different.</div>
<div style="position:absolute;bottom:40px;left:90px;color:#F2B04C;font-weight:700;letter-spacing:.5px">LUMAEHR.com</div></body>
HTML
shoot ov_frames/00title.png "$PWD/ov_frames/00title.html"

cat > ov_frames/99close.html <<'HTML'
<!doctype html><meta charset=utf-8><body style="margin:0;width:1280px;height:800px;background:radial-gradient(120% 90% at 22% 92%,#143444,#12222F 42%,#0B1621);font-family:-apple-system,Arial;color:#EAF3F5;display:flex;flex-direction:column;justify-content:center;padding:0 90px;box-sizing:border-box">
<div style="font-size:58px;font-weight:800;letter-spacing:-1.5px;line-height:1.06">Not AI on the EHR.<br><span style="color:#5AD1E0">Evidence on the EHR.</span></div>
<div style="font-size:23px;color:#B9D6DC;margin-top:26px;max-width:780px">Clinician sustainability, patient healthspan, and public-health research — one architecture, every claim cited.</div>
<div style="font-size:26px;color:#F2B04C;font-weight:700;margin-top:34px">LUMAEHR.com</div>
<div style="position:absolute;bottom:40px;left:90px;right:90px;color:#7f97a0;font-size:14px;border-top:1px solid #22384a;padding-top:14px">Demonstration prototype · synthetic data only · not for clinical use.</div></body>
HTML
shoot ov_frames/99close.png "$PWD/ov_frames/99close.html"

# ---- content frames: id role view theme wellness pluck caption ----
make_frame 02dash   clinician  dashboard  restore true ""                    "A complete EHR — with an after-hours load tile, cited"
make_frame 03chart  clinician  chart      restore true "USPSTF"              "USPSTF Grade A &amp; B prevention, in the chart"
make_frame 04bill   clinician  billing    restore true ""                    "Encounter &amp; claim — the revenue cycle, handled"
make_frame 05eco    clinician  ecosystem  restore true ""                    "Connected: eligibility, labs &amp; telehealth"
make_frame 06screen patient    screenings restore true ""                    "Validated PHQ-9 / GAD-7 — mental health is health"
make_frame 07canary clinician  canary     restore true "Canary's promises"   "Canary — a private burnout early-warning"
make_frame 08breath clinician  wellness   restore true "breathing break"     "One-minute box breathing, one click away"
make_frame 09cwo    cwo        joy        restore true ""                    "AMA Joy in Medicine — measured, by specialty"
make_frame 10res    researcher console    restore true ""                    "Consented, IRB-gated public-health research"
make_frame 11pt     patient    home       restore true ""                    "A patient portal built for healthspan"

# ---- narration (male / joe) ----
ORDER=(00title 02dash 03chart 04bill 05eco 06screen 07canary 08breath 09cwo 10res 11pt 99close)
narr(){ printf '%s' "$2" > "ov_audio/$1.txt"; }
narr 00title  "LumaChart. The hospital electronic health record built for public health. Evidence on the record, not just an algorithm. Here is what makes it different."
narr 02dash   "It starts as a complete E H R. But right on the dashboard sits an after hours workload tile, cited to the research, because a clinician's time is a metric that matters."
narr 03chart  "Every chart surfaces the grade A and grade B preventive care the U S Preventive Services Task Force recommends, each one backed by a real citation."
narr 04bill   "Encounter and claim handles the revenue cycle. It codes every condition and an agent drafts the C P T codes for sign off, so the note itself can stay short and clinical."
narr 05eco    "LumaChart connects to the wider system. Real time eligibility and prior authorization, one tap lab orders, and a national telehealth network."
narr 06screen "Validated, public domain tools like the P H Q nine and G A D seven score instantly, and return evidence based self care. Mental health is health."
narr 07canary "Canary quietly watches a clinician's own E H R time and after hours load, and nudges gently. It is private by default, and never used for productivity."
narr 08breath "Feeling the pressure between patients? A one minute box breathing break is one click away. Breathe in, hold, and breathe out."
narr 09cwo    "For leaders, a chief wellness officer dashboard tracks A M A Joy in Medicine recognition, and the time spent in the record, by specialty."
narr 10res    "Consented, de identified data becomes public health knowledge. I R B gated and audit logged, with consent modeled on the seventy eight year Framingham Heart Study."
narr 11pt     "And patients get a portal organized around staying well. Prevention, longevity, community health, and language first communication."
narr 99close  "LumaChart. Not, ay eye, on the E H R. Evidence, on the E H R. A demonstration prototype, with synthetic data. Learn more at luma E H R dot com."

# ---- synth + clips (Piper joe, audio padded to video for sync) ----
: > ov_clips.txt
for id in "${ORDER[@]}"; do
  piper -m "$M" --length-scale "$LS" -f "ov_audio/$id.wav" < "ov_audio/$id.txt" >/dev/null 2>&1
  dur=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "ov_audio/$id.wav")
  tot=$(echo "$dur + 1.2" | bc)
  ffmpeg -y -loglevel error -loop 1 -i "ov_frames/$id.png" -i "ov_audio/$id.wav" \
    -vf "scale=1280:800,setsar=1,format=yuv420p" -af "adelay=300:all=1,apad" -t "$tot" -r 30 \
    -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 160k -ar 44100 -movflags +faststart "ov_clips/$id.mp4"
  echo "file 'ov_clips/$id.mp4'" >> ov_clips.txt
done
ffmpeg -y -loglevel error -f concat -safe 0 -i ov_clips.txt -c copy LumaChart-overview-voiceover.mp4
ffmpeg -y -loglevel error -i LumaChart-overview-voiceover.mp4 -an -c:v copy LumaChart-overview-silent.mp4

echo "=== OVERVIEW VIDEO (male / joe) ==="
for f in LumaChart-overview-voiceover.mp4 LumaChart-overview-silent.mp4; do
  d=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$f"); s=$(ls -la "$f"|awk '{print $5}')
  printf "%-36s %6.1fs  %5.1f MB\n" "$f" "$d" "$(echo "scale=2;$s/1048576"|bc)"
done
# per-frame check for silent error cards
echo "--- frame sanity (should list PNGs, no 0-byte) ---"
for id in "${ORDER[@]}"; do sz=$(ls -la "ov_frames/$id.png"|awk '{print $5}'); printf "%-10s %s\n" "$id" "$sz"; done