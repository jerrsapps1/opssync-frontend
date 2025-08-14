/**
 * Attempts to swap your scheduler to the checked version by editing `server/index.ts`
 * (or `server/index.js`) to call startCronWithTenantChecks() instead of your previous starter.
 *
 * This is conservative: if it can't find a match, it does nothing.
 *
 * Usage:
 *   node scripts/swap_in_cron_checks.js
 */
const fs = require("fs");
const path = require("path");

const candidates = [
  path.join(process.cwd(), "server", "index.ts"),
  path.join(process.cwd(), "server", "index.js"),
];

for (const file of candidates) {
  if (!fs.existsSync(file)) continue;
  let src = fs.readFileSync(file, "utf8");
  let changed = false;

  if (!/startCronWithTenantChecks/.test(src)) {
    // add import
    if (!/from\s+["']\.\/services\/cron_feature_checks["']/.test(src)) {
      src = `import { startCronWithTenantChecks } from "./services/cron_feature_checks";\n` + src;
      changed = true;
    }
    // replace known starters
    src = src.replace(/startTimelinessAddons\(\s*\)/g, "startCronWithTenantChecks()") || src;
    src = src.replace(/startTimelinessScheduler\(\s*.*?\)/g, "startCronWithTenantChecks()") || src;
    if (/startCronWithTenantChecks\(\)/.test(src)) changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, src, "utf8");
    console.log("Patched:", path.relative(process.cwd(), file));
  }
}

console.log("Done. If no files were patched, add the import and call manually:");
console.log(`  import { startCronWithTenantChecks } from "./services/cron_feature_checks";`);
console.log(`  startCronWithTenantChecks();`);
