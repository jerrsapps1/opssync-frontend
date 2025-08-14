/**
 * Adds a new owner-only toggle `WALLETS_INFO` so you can show/hide
 * "Apple/Google wallets available" messaging in your app UI.
 *
 * It modifies:
 *  - server/config/features.ts            (default FEATURE_WALLETS_INFO env)
 *  - server/routes/owner_admin.ts         (allow updates to the new key)
 *  - client/src/pages/OwnerSettings.tsx   (type + UI shows the toggle)
 *
 * Usage (from project root):
 *   node scripts/enable_wallets_info_toggle.js
 */

import fs from "fs";
import path from "path";

function patchFile(file, replacers) {
  if (!fs.existsSync(file)) return false;
  let src = fs.readFileSync(file, "utf8");
  let changed = false;
  for (const [re, rep] of replacers) {
    const next = src.replace(re, rep);
    if (next !== src) { src = next; changed = true; }
  }
  if (changed) fs.writeFileSync(file, src, "utf8");
  return changed;
}

// 1) features.ts: add default from env
const featuresFile = path.join(process.cwd(), "server", "config", "features.ts");
patchFile(featuresFile, [
  // Insert WALLETS_INFO line after WEEKLY_DIGEST
  [/(WEEKLY_DIGEST:\s*process\.env\.FEATURE_WEEKLY_DIGEST === "1",?\s*\n\};?)/m,
   `WEEKLY_DIGEST: process.env.FEATURE_WEEKLY_DIGEST === "1",
  WALLETS_INFO: process.env.FEATURE_WALLETS_INFO === "1",
};`]
]);

// 2) owner_admin.ts: allow the key in allowed list and typing is dynamic anyway
const ownerAdminFile = path.join(process.cwd(), "server", "routes", "owner_admin.ts");
patchFile(ownerAdminFile, [
  [/(const\s+allowed\s*=\s*\[)([^\]]*)(\])/m,
   (m, a, b, c) => {
     if (b.includes("WALLETS_INFO")) return m;
     const withKey = b.trim().length ? b.trim() + `,"WALLETS_INFO"` : `"WALLETS_INFO"`;
     return a + withKey + c;
   }]
]);

// 3) OwnerSettings.tsx: widen Flags type to index signature so new keys show automatically
const ownerSettingsFile = path.join(process.cwd(), "client", "src", "pages", "OwnerSettings.tsx");
patchFile(ownerSettingsFile, [
  [/type\s+Flags\s*=\s*\{[^}]+\};/m,
   `type Flags = { [key: string]: boolean };`],
  // Also adjust keys derivation if necessary (it already used Object.keys)
]);

console.log("Done. If a file wasn't found, that's okay—this script is conservative.");
