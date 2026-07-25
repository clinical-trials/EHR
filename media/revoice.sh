#!/bin/bash
set -e
cd /Users/lgm/public-health-ehr/media
. .ttsenv/bin/activate
export PATH="/opt/homebrew/bin:$PATH"
M=voices/hfc.onnx
ORDER=(00title 02dash 03chart 04screen 05canary 06bill 07eco 08helix 09res 10cwo 11pt 12theme 13syn 99close)

: > clips.txt
for id in "${ORDER[@]}"; do
  # neural TTS from the existing narration text (slightly slowed for clarity)
  piper -m "$M" --length-scale 1.06 -f "audio/$id.wav" < "audio/$id.txt" >/dev/null 2>&1
  dur=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "audio/$id.wav")
  tot=$(echo "$dur + 1.15" | bc)
  ffmpeg -y -loglevel error -loop 1 -i "frames/$id.png" -i "audio/$id.wav" \
    -vf "scale=1280:800,setsar=1,format=yuv420p" -t "$tot" -r 30 \
    -c:v libx264 -preset veryfast -crf 23 -c:a aac -b:a 160k -ar 44100 -movflags +faststart "clips/$id.mp4"
  echo "file 'clips/$id.mp4'" >> clips.txt
done

ffmpeg -y -loglevel error -f concat -safe 0 -i clips.txt -c copy LumaChart-demo-voiceover.mp4
ffmpeg -y -loglevel error -i LumaChart-demo-voiceover.mp4 -an -c:v copy LumaChart-demo-silent.mp4

echo "=== RESULTS (Piper neural voice) ==="
for f in LumaChart-demo-voiceover.mp4 LumaChart-demo-silent.mp4; do
  d=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$f")
  s=$(ls -la "$f" | awk '{print $5}')
  printf "%-34s %6.1fs  %5.1f MB\n" "$f" "$d" "$(echo "scale=2;$s/1048576"|bc)"
done