const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "server", "routes.ts");
if (!fs.existsSync(file)) { console.log("server/routes.ts not found; please mount routes manually."); process.exit(0); }
let src = fs.readFileSync(file, "utf8");
let changed = false;

// Add imports if missing
const imports = [
  'import ownerBrandingAdminRouter from "./routes/owner_branding_admin";',
  'import orgEntitlementsRouter from "./routes/org_entitlements";',
  'import whiteLabelRouter from "./routes/white_label";'
];
for (const imp of imports) {
  if (!src.includes(imp)) {
    const insertPoint = src.lastIndexOf('import ');
    const lineEnd = src.indexOf('\n', insertPoint);
    src = src.slice(0, lineEnd + 1) + imp + '\n' + src.slice(lineEnd + 1);
    changed = true;
  }
}

// Add route mounts if missing
const routes = [
  '  app.use("/api/owner-admin", ownerBrandingAdminRouter);',
  '  app.use("/api/org-entitlements", orgEntitlementsRouter);',
  '  app.use("/api/white-label", whiteLabelRouter);'
];
for (const route of routes) {
  if (!src.includes(route)) {
    const insertPoint = src.lastIndexOf('const httpServer = createServer(app);');
    src = src.slice(0, insertPoint) + route + '\n\n  ' + src.slice(insertPoint);
    changed = true;
  }
}

if (changed) {
  fs.writeFileSync(file, src);
  console.log("✓ Routes added to server/routes.ts");
} else {
  console.log("✓ Routes already exist in server/routes.ts");
}
