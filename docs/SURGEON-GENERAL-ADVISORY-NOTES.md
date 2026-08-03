# Surgeon General's Advisory on Health Worker Burnout (2022) — LumaChart notes

Source: *Addressing Health Worker Burnout: The U.S. Surgeon General's Advisory on Building a Thriving Health Workforce* (Vivek H. Murthy, MD, MBA — 2022, 76 pp).
hhs.gov/sites/default/files/health-worker-wellbeing-advisory.pdf

This is the closest thing LumaChart's mission has to a federal charter: an official advisory saying that health-worker burnout is a systems problem, that EHR/administrative burden is a core driver, and that technology companies have named responsibilities. Notes below = the facts worth citing + how each maps to what we build.

## Headline facts (citable)

| Fact | Where |
|---|---|
| Pre-pandemic, burnout at "crisis levels": **35–54% of nurses & physicians**, 45–60% of students/residents (NAM) | Background |
| Burnout is an **occupational syndrome**, not an individual diagnosis — it "primarily calls for systems-oriented, organizational-level solutions" | Background |
| **Physicians spend 2 hours on the EHR/admin for every 1 hour of direct patient care; nurses spend up to 41% of their time on EHR/documentation** | Figure 5 |
| Turnover costs: **$9B/yr (nurses), $2.6–6.3B/yr (physicians)** | Background |
| 1 in 15 physicians had suicidal thoughts; less likely than others to seek help | Background |
| Projected shortage of **54,100–139,000 physicians by 2033**, worst in primary care & rural | Background |
| 61% of physicians have little/no time to address SDOH; **83% say addressing SDOH contributes to burnout** | Background |
| Prior auth: **85% of physicians rate the burden high/extremely high; 34% report it caused a serious adverse event**; e-prior-auth would save $417M/yr and ~12 min/transaction | Payers |
| Pandemic-era: 1 in 5 physicians, 2 in 5 nurses intended to leave practice | Background |
| "Getting Rid of Stupid Stuff" (Hawaii Pacific Health): staff nominate EHR tasks to kill → **1,700 nursing hours saved/month** | Health care orgs |
| 25×5 goal: **reduce documentation burden 75% by 2025** — scribes and automation named as example strategies | Health care orgs |
| VA PACT "teamlet" team-based model → lower burnout; zero-burnout practices share strong teamwork cultures | Health care orgs |
| Feeling **valued** mitigated workload/mental-health stress in health workers | Background |

## The advisory's six calls to action

1. Protect health, safety & well-being (incl. workplace violence, staffing)
2. **Eliminate punitive policies for seeking mental-health / substance-use care** (licensing & credentialing reform — ask only about *current* impairment; Dr. Lorna Breen Act)
3. **Reduce administrative burden** — "help health workers make time for what matters"
4. **Transform culture** — Chief Wellness Officer with resources & decision power, well-being metrics in org KPIs, link executive compensation to well-being
5. **Social connection & community** — peer support, team-based care
6. Invest in public health & the public-health workforce

## What it asks of health care TECHNOLOGY companies (our section)

- Co-design with health workers; don't add cognitive load or compete with patient time
- **Reduce pop-ups/interruptions; minimal clicks per task; curate & visualize data**
- Interoperability **at the outset**; integrate data across platforms & care teams (incl. patient/caregivers)
- Seamless, standard, device-agnostic storage & access
- Research call: better tools to **summarize, organize, display** data; AI to reduce administrative burden

## Scorecard — LumaChart vs. the advisory

| Advisory ask | LumaChart today |
|---|---|
| CWO role, well-being metrics in KPIs | ✅ CWO dashboard, Joy in Medicine, EHR8/WOW8 |
| Measure burnout with validated tools, confidential | ✅ Canary (private by default, non-punitive) + validated instruments |
| Reduce interruptions / pop-ups | ✅ Batched inbox 2×/day, calm Canary, Focus mode |
| Minimal clicks / cognitive load | ✅ Focus (Luma Lean), one-route-per-task rule |
| Scribes & automation for documentation | ✅ Luma Scribe (demo) + auto-coding → claim |
| Team-based delegation (PACT-style) | ✅ Suggested delegation steps, delegate-to-team |
| Value the conversation, not just the procedure | ✅ billing decoupled from note; "lean notes" |
| Feeling valued | ✅ gratitude surfacing in Wellness Center |
| Prior-auth automation | ✅ ecosystem: real-time eligibility & e-prior-auth |
| Interop at the outset; patient data integrated | ✅ synthesis view; ⏳ unified care timeline (data staged) |
| SDOH / community investment | ✅ patient Community Health + CHW readmission workflow |

## Gaps → candidate features (not yet built)

1. **Confidential help, one tap** — Wellness Center card with EAP + Physician Support Line (1-888-409-0141) + 988; explicitly non-punitive framing ("seeking care is strength; licensure asks only about current impairment").
2. **"Feeling valued" metric** on the CWO dashboard (advisory suggests adding it next to burnout measures).
3. **"Kill a stupid task" button** — GROSS-style nomination flow (staff nominate EHR tasks to eliminate; track hours saved). Natural extension of one-route-per-task; could live in Helix suggestions.
4. **Peer support / Battle Buddy pairing** in the Wellness Center.
5. **Equity-disaggregated well-being data** on the CWO extract (by role, unit, race/ethnicity, gender — confidential, aggregate-only).
6. **Licensure-question reform note** in CME & licensure view (Joint Commission 2020 / FSMB language).

*Written 2026-08-03 from the archived 2022 PDF (HHS CDN blocks direct fetch; retrieved via Wayback snapshot 2022-05-27).*
