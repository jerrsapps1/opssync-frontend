/**
 * Safe-ish script to hide/remove the Manager Dashboard page + nav link.
 * It looks for common file names and route patterns and comments them out.
 * If nothing matches, it does nothing.
 *
 * Usage:
 *   node scripts/remove_manager_dashboard.js
 */
const fs = require("fs");
const path = require("path");

function tryPatch(file, replacers) {
  if (!fs.existsSync(file)) return false;
  let src = fs.readFileSync(file, "utf8");
  let changed = false;
  for (const [pattern, replacement] of replacers) {
    const re = new RegExp(pattern, "g");
    if (re.test(src)) {
      src = src.replace(re, replacement);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(file, src, "utf8");
    console.log("Patched:", file);
  }
  return changed;
}

// 1) Remove route imports/usages in common route files
const routeFiles = [
  "client/src/App.tsx",
  "client/src/App.jsx",
  "client/src/routes.tsx",
  "client/src/main.tsx",
];
for (const rf of routeFiles) {
  tryPatch(path.join(process.cwd(), rf), [
    ["import\\s+ManagerDashboard\\s+from\\s+['\\\"]/.*ManagerDashboard['\\\"];?", "// (removed) $&"],
    ["<Route[^>]+path=[\"']\\/manager[\"'][^>]*>.*?<\\/Route>", "<!-- removed manager route -->"],
    ["<Route[^>]+element=\\{<ManagerDashboard \\/>\\}[^>]*\\/>", "<!-- removed manager route -->"],
    ["\\{FEATURES\\.MANAGER\\s*&&\\s*<Route[^>]+\\/manager[^>]+>.*?<\\/Route>\\}", "<!-- removed manager flag route -->"],
  ]);
}

// 2) Remove sidebar nav item in common sidebar files
const sidebarFiles = [
  "client/src/components/Sidebar.tsx",
  "client/src/components/Sidebar.jsx",
  "client/src/layout/Sidebar.tsx",
];
for (const sf of sidebarFiles) {
  tryPatch(path.join(process.cwd(), sf), [
    [">\\s*Manager Dashboard\\s*<", "><span><!-- Manager removed --></span><"],
    ["\\/manager", "/#"],
  ]);
}

// 3) Delete page file if present
const pagePaths = [
  "client/src/pages/ManagerDashboard.tsx",
  "client/src/pages/ManagerDashboard.jsx",
];
for (const p of pagePaths) {
  const abs = path.join(process.cwd(), p);
  if (fs.existsSync(abs)) {
    fs.rmSync(abs, { force: true });
    console.log("Deleted page:", p);
  }
}

console.log("Done. If something was missed, your app will still build; this script is conservative.");
