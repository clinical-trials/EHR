// Regenerates docs/ANNOTATED-BIBLIOGRAPHY.md from the running evidence base in data.js.
// Peer-reviewed entries (EVIDENCE, keyed by PMID) are sorted by their leading citation head;
// reports/standards (AUTHORITIES) are listed in data.js insertion order.
// Usage: node scripts/gen-bibliography.mjs [--check]
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataText = fs.readFileSync(path.join(root, "data.js"), "utf8");

// Load data.js in a sandbox and pull out EVIDENCE + AUTHORITIES.
const sandbox = { window:{}, document:{}, localStorage:{ getItem(){}, setItem(){} }, navigator:{}, console };
vm.createContext(sandbox);
vm.runInContext(dataText + "\n;globalThis.__E=typeof EVIDENCE!=='undefined'?EVIDENCE:{};globalThis.__A=typeof AUTHORITIES!=='undefined'?AUTHORITIES:{};", sandbox);
const EVIDENCE = sandbox.__E, AUTHORITIES = sandbox.__A;

const splitCite = c => { const i = c.indexOf(" — "); return i < 0 ? [c, ""] : [c.slice(0, i), c.slice(i + 3)]; };

const peer = Object.entries(EVIDENCE)
  .map(([key, v]) => { const [head, rest] = splitCite(v.cite); return { key, head, rest, pmid: v.pmid }; })
  .sort((a, b) => a.head.localeCompare(b.head, "en"));

const reports = Object.entries(AUTHORITIES).map(([key, v]) => ({ key, ...v }));

const peerLine = e => `- **${e.head}** — ${e.rest}${e.rest ? " " : ""}[PMID ${e.pmid}](https://pubmed.ncbi.nlm.nih.gov/${e.pmid}/) _(key: \`${e.key}\`)_`;
const repLine = e => `- **${e.label}** — ${e.cite} <${e.url}> _(key: \`${e.key}\`)_`;

const md = [
  "# LumaChart — Annotated Bibliography", "",
  `Auto-generated from the running evidence base (data.js). ${peer.length} peer-reviewed sources + ${reports.length} reports, standards & legislation.`, "",
  "## Peer-reviewed literature (PubMed)", "",
  ...peer.map(peerLine), "",
  "## Reports, standards, regulation & industry precedent", "",
  ...reports.map(repLine), "",
].join("\n");

const outPath = path.join(root, "docs", "ANNOTATED-BIBLIOGRAPHY.md");
if (process.argv.includes("--check")) {
  const cur = fs.readFileSync(outPath, "utf8");
  if (cur.trim() === md.trim()) { console.log(`OK — reproduces current bib exactly (${peer.length} peer + ${reports.length} reports).`); }
  else {
    console.log(`DIFF — generated ${peer.length} peer + ${reports.length} reports; does NOT match current file.`);
    const a = cur.trim().split("\n"), b = md.trim().split("\n");
    for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) { console.log(`first diff @line ${i + 1}:\n  cur: ${a[i]}\n  gen: ${b[i]}`); break; }
  }
} else {
  fs.writeFileSync(outPath, md);
  console.log(`wrote ${outPath} — ${peer.length} peer + ${reports.length} reports.`);
}
