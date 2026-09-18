// Builds the self-contained dist/LumaChart.html from index.html + luma.css + data.js + app.js.
// Inlines CSS/JS and guarantees the file begins with <!doctype html> + <meta charset="utf-8">
// (charset FIRST) so § and em-dashes render even when served without a UTF-8 header.
// Usage: node scripts/build-bundle.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");

const indexHtml = read("index.html");
const css = read("luma.css");
const dataJs = read("data.js");
const appJs = read("app.js");

// Take the <body> inner markup, minus the external script tags (we inline them below)
// and minus the external favicon link (not needed in a self-contained file).
let body = indexHtml.slice(indexHtml.indexOf("<body>") + "<body>".length, indexHtml.indexOf("</body>"));
body = body
  .replace(/\s*<script src="data\.js[^"]*"><\/script>/i, "")
  .replace(/\s*<script src="app\.js[^"]*"><\/script>/i, "")
  .trim();

const bundle =
`<!doctype html>
<meta charset="utf-8">
<script>document.documentElement.setAttribute("data-theme","restore")</script>
<style>
${css}
</style>
${body}
<script>
${dataJs}
</script>
<script>
${appJs}
</script>
`;

const out = path.join(root, "dist", "LumaChart.html");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, bundle);
console.log(`wrote ${out} — ${(bundle.length/1024).toFixed(0)} KB`);
