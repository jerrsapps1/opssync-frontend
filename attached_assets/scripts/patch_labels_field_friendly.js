/**
 * Patch older client files to use plain language:
 *  GREEN -> On time, AMBER -> Due soon, RED -> Late
 * Also replaces headings like "RAG" -> "Schedule Health".
 *
 * Usage:
 *   node scripts/patch_labels_field_friendly.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(process.cwd(), "client", "src");
const EXTS = [".tsx", ".ts", ".jsx", ".js"];

function walk(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const s = fs.statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (EXTS.some(e => name.endsWith(e))) out.push(p);
  }
  return out;
}

const replacements = [
  [/\bGREEN\b/g, "On time"],
  [/\bAMBER\b/g, "Due soon"],
  [/\bRED\b/g, "Late"],
  [/RAG\s*Overview/gi, "Schedule Health"],
  [/\bRAG\b/gi, "Schedule Health"],
  [/SLA\s*\/\s*RAG/gi, "Schedule Health"],
];

let changed = 0;
for (const file of walk(ROOT)) {
  const src = fs.readFileSync(file, "utf8");
  let next = src;
  for (const [re, rep] of replacements) next = next.replace(re, rep);
  if (next !== src) {
    fs.writeFileSync(file, next, "utf8");
    console.log("Patched:", path.relative(process.cwd(), file));
    changed++;
  }
}
console.log(`Done. Files changed: ${changed}`);
