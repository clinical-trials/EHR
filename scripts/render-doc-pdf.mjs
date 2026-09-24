// Renders a Markdown doc to a styled, print-ready HTML (then Chrome prints it to PDF).
// Handles headers, tables, lists, **bold**, *italic*, `code`, [links](url), --- rules.
// Usage: node scripts/render-doc-pdf.mjs <input.md> <output.html> "<Doc title>" "<subtitle>"
import fs from "node:fs";

const [,, inPath, outPath, title = "", subtitle = ""] = process.argv;
const md = fs.readFileSync(inPath, "utf8");

const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = s => esc(s)
  .replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`)
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => `<a href="${u}">${t}</a>`)
  .replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>")
  .replace(/\*([^*]+?)\*/g, "<em>$1</em>");

const blocks = md.replace(/\r/g, "").split(/\n{2,}/);
let html = "";
for (const raw of blocks) {
  let lines = raw.split("\n").filter(l => l.trim() !== "");
  if (!lines.length) continue;
  // pull any leading header lines off the block
  while (lines.length && /^#{1,6}\s/.test(lines[0])) {
    const m = lines[0].match(/^(#{1,6})\s+(.*)$/);
    html += `<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`;
    lines = lines.slice(1);
  }
  if (!lines.length) continue;
  if (lines.every(l => /^>/.test(l))) {                           // blockquote → callout box
    let bl = lines.map(l => l.replace(/^>\s?/, ""));
    let inner = "";
    while (bl.length && /^#{1,6}\s/.test(bl[0])) { const m = bl[0].match(/^#{1,6}\s+(.*)$/); inner += `<div class="callout-title">${inline(m[1])}</div>`; bl = bl.slice(1); }
    if (bl.length) inner += `<p>${inline(bl.join(" "))}</p>`;
    html += `<div class="callout">${inner}</div>`;
  } else if (lines.every(l => /^\s*\|/.test(l))) {                // table
    const rows = lines.filter(l => !/^\s*\|[\s|:-]+\|\s*$/.test(l));
    const cells = r => r.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map(c => c.trim());
    let t = "<table>";
    rows.forEach((r, i) => {
      const tag = i === 0 ? "th" : "td";
      t += "<tr>" + cells(r).map(c => `<${tag}>${inline(c)}</${tag}>`).join("") + "</tr>";
    });
    html += t + "</table>";
  } else if (/^\s*[-*]\s/.test(lines[0])) {                       // list (with wrapped items)
    const items = [];
    for (const l of lines) {
      if (/^\s*[-*]\s/.test(l)) items.push(l.replace(/^\s*[-*]\s+/, ""));
      else if (items.length) items[items.length - 1] += " " + l.trim();
    }
    html += "<ul>" + items.map(it => `<li>${inline(it)}</li>`).join("") + "</ul>";
  } else if (lines.length === 1 && /^-{3,}$/.test(lines[0].trim())) {
    html += "<hr>";
  } else {
    html += `<p>${inline(lines.join(" "))}</p>`;
  }
}

const CSS = `
@page{size:8.5in 11in;margin:0.7in 0.75in}
*{box-sizing:border-box}
body{font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;color:#1a2b33;font-size:11px;line-height:1.5;margin:0}
.doc-head{border-bottom:3px solid #0e7c8b;padding-bottom:10px;margin-bottom:16px}
.doc-head .wm{font-size:20px;font-weight:800}.doc-head .wm i{color:#0e7c8b;font-style:normal}
.doc-head .t{font-size:22px;font-weight:850;margin-top:6px;letter-spacing:-.3px}
.doc-head .s{font-size:12px;color:#5a6c76;margin-top:3px}
h1{font-size:19px;font-weight:850;margin:20px 0 8px;color:#12303a}
h2{font-size:14.5px;font-weight:800;color:#0e7c8b;margin:18px 0 7px;padding-left:9px;border-left:4px solid #22c0cf}
h3{font-size:12.5px;font-weight:800;color:#12303a;margin:13px 0 5px}
p{margin:6px 0}
ul{margin:6px 0 6px 2px;padding-left:16px}
li{margin:3px 0}
a{color:#0e7c8b;text-decoration:none}
code{background:#eef4f5;border:1px solid #dce7e9;border-radius:4px;padding:0 4px;font-size:10px;font-family:ui-monospace,Menlo,monospace}
strong{color:#12303a}
em{color:#3f5560}
table{border-collapse:collapse;width:100%;margin:9px 0;font-size:10px;break-inside:avoid}
th,td{border:1px solid #d7e2e5;padding:5px 8px;text-align:left;vertical-align:top}
th{background:#eaf6f8;color:#0e7c8b;font-weight:800}
tr:nth-child(even) td{background:#fafcfc}
hr{border:none;border-top:1px solid #e3ebed;margin:14px 0}
h1,h2,h3{break-after:avoid}
.callout{border:1px solid #f0c98a;background:#fdf6ea;border-left:5px solid #c98a1e;border-radius:8px;padding:11px 15px;margin:12px 0;break-inside:avoid}
.callout-title{font-weight:800;color:#9a6a12;font-size:12.5px;margin-bottom:5px}
.callout p{margin:4px 0}
`;

const head = title ? `<div class="doc-head"><div class="wm">Luma<i>Chart</i></div><div class="t">${esc(title)}</div>${subtitle?`<div class="s">${esc(subtitle)}</div>`:""}</div>` : "";
fs.writeFileSync(outPath, `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${head}${html}</body></html>`);
console.log("wrote", outPath);
