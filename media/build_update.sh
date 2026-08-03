#!/bin/bash
set -e
cd /Users/lgm/public-health-ehr/media
. .ttsenv/bin/activate
export PATH="/opt/homebrew/bin:$PATH"
BUNDLE=/Users/lgm/public-health-ehr/dist/LumaChart.html
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
M=voices/hfc.onnx
rm -rf up_frames up_audio up_clips; mkdir -p up_frames up_audio up_clips

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
  } > "up_frames/$id.html"
  shoot "up_frames/$id.png" "$PWD/up_frames/$id.html"
}

# ---- title / close ----
cat > up_frames/00title.html <<'HTML'
<!doctype html><meta charset=utf-8><body style="margin:0;width:1280px;height:800px;background:radial-gradient(120% 90% at 78% 8%,#143444,#12222F 42%,#0B1621);font-family:-apple-system,Arial;color:#EAF3F5;display:flex;flex-direction:column;justify-content:center;padding:0 90px;box-sizing:border-box">
<div style="display:flex;align-items:center;gap:18px"><div style="width:64px;height:64px;border-radius:18px;background:conic-gradient(from 130deg,#5AD1E0,#86BEA4,#F2B04C,#5AD1E0);position:relative"><div style="position:absolute;inset:8px;border-radius:12px;background:#12222F"></div></div><div style="font-size:42px;font-weight:800;letter-spacing:-1px">Luma<span style="color:#5AD1E0">Chart</span></div></div>
<div style="font-size:26px;color:#F2B04C;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-top:40px">Product update</div>
<div style="font-size:56px;font-weight:800;letter-spacing:-1.5px;line-height:1.05;margin-top:12px">Built for the <span style="color:#5AD1E0">physician.</span></div>
<div style="font-size:24px;color:#B9D6DC;margin-top:20px">The well-being features that protect the person using the record.</div>
<div style="position:absolute;bottom:40px;left:90px;color:#F2B04C;font-weight:700">LUMAEHR.com</div></body>
HTML
shoot up_frames/00title.png "$PWD/up_frames/00title.html"

cat > up_frames/99close.html <<'HTML'
<!doctype html><meta charset=utf-8><body style="margin:0;width:1280px;height:800px;background:radial-gradient(120% 90% at 22% 92%,#143444,#12222F 42%,#0B1621);font-family:-apple-system,Arial;color:#EAF3F5;display:flex;flex-direction:column;justify-content:center;padding:0 90px;box-sizing:border-box">
<div style="font-size:52px;font-weight:800;letter-spacing:-1.2px;line-height:1.08">Caring for the patient<br>requires <span style="color:#5AD1E0">caring for the provider.</span></div>
<div style="font-size:22px;color:#B9D6DC;margin-top:24px">The Quadruple Aim — Bodenheimer &amp; Sinsky, Ann Fam Med 2014 (PMID 25384822)</div>
<div style="font-size:26px;color:#F2B04C;font-weight:700;margin-top:32px">LumaChart · LUMAEHR.com</div>
<div style="position:absolute;bottom:40px;left:90px;right:90px;color:#7f97a0;font-size:14px;border-top:1px solid #22384a;padding-top:14px">Demonstration prototype · synthetic data only · not for clinical use.</div></body>
HTML
shoot up_frames/99close.png "$PWD/up_frames/99close.html"

# ---- content frames: id role view theme wellness pluck caption ----
make_frame 02breath clinician wellness  restore true  "breathing break"      "One-minute box breathing, one click away"
make_frame 03canary clinician canary    restore true  "Canary's promises"    "Canary is private — never used against you"
make_frame 04hours  clinician dashboard restore true  "After-hours EHR load" "Know your after-hours load"
make_frame 05grat   clinician wellness  restore true  "Gratitude"            "Patient thank-you notes, when you need them"
make_frame 06pulse  clinician wellness  restore true  "Well-being pulse"     "A private, validated well-being check"
make_frame 07toggle clinician dashboard restore false ""                     "Not your thing? Hide wellness in one click"
make_frame 08note   clinician chart     restore true  "billing decoupled"    "The note stays clinical — billing is separate"
make_frame 09team   clinician inbox     restore true  "Inbox burden"         "Delegate protocol work to your team"
make_frame 10cme    clinician cme       restore true  ""                     "Book restorative CME as easily as a weekend away"

# ---- narration ----
ORDER=(00title 02breath 03canary 04hours 05grat 06pulse 07toggle 08note 09team 10cme 99close)
narr(){ printf '%s' "$2" > "up_audio/$1.txt"; }
narr 00title  "An update. The features that put the physician first."
narr 02breath "Feeling the pressure between patients? A one minute box breathing break is one click away. Breathe in, hold, and breathe out."
narr 03canary "Canary watches your workload, but it is private to you by default. It is never wired to productivity or employment decisions. Support, not surveillance."
narr 04hours  "Right on your dashboard, see your after hours load and your face time ratio. The numbers that protect your time, each cited to the research."
narr 05grat   "On a hard day, the Wellness Center surfaces real thank you notes from your patients. A reminder of why the work matters."
narr 06pulse  "A quick, validated well being self check, using the same instruments the research uses. Private, and yours alone."
narr 07toggle "Not every clinician wants wellness features. Hide them entirely with one toggle, just like dark mode. Your clinical tools stay untouched."
narr 08note   "Your note stays lean and clinical. Billing and compliance live in a separate, automated layer. That is why LumaChart notes stay short."
narr 09team   "Delegate protocol inbox work to your care team in one click. The team based model this is built on cut clinician burnout from fifty three percent, to thirteen."
narr 10cme    "Track your C M E credits, and book restorative destination courses as easily as a weekend away. Renewal is part of wellness, too."
narr 99close  "Because caring for the patient requires caring for the provider. LumaChart. Built for the physician. Learn more at luma E H R dot com."

# ---- synth + clips (Piper hfc, audio padded to video for perfect sync) ----
: > up_clips.txt
for id in "${ORDER[@]}"; do
  piper -m "$M" --length-scale 1.06 -f "up_audio/$id.wav" < "up_audio/$id.txt" >/dev/null 2>&1
  dur=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "up_audio/$id.wav")
  tot=$(echo "$dur + 1.4" | bc)
  ffmpeg -y -loglevel error -loop 1 -i "up_frames/$id.png" -i "up_audio/$id.wav" \
    -vf "scale=1280:800,setsar=1,format=yuv420p" -af "adelay=300:all=1,apad" -t "$tot" -r 30 \
    -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 160k -ar 44100 -movflags +faststart "up_clips/$id.mp4"
  echo "file 'up_clips/$id.mp4'" >> up_clips.txt
done
ffmpeg -y -loglevel error -f concat -safe 0 -i up_clips.txt -c copy LumaChart-update-voiceover.mp4
ffmpeg -y -loglevel error -i LumaChart-update-voiceover.mp4 -an -c:v copy LumaChart-update-silent.mp4

echo "=== UPDATE VIDEO ==="
for f in LumaChart-update-voiceover.mp4 LumaChart-update-silent.mp4; do
  d=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$f"); s=$(ls -la "$f"|awk '{print $5}')
  printf "%-34s %6.1fs  %5.1f MB\n" "$f" "$d" "$(echo "scale=2;$s/1048576"|bc)"
done