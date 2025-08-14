/**
 * Adds org-admin API mount to server/routes.ts:
 *   import orgAdminRouter from "./routes/org_admin";
 *   app.use("/api/org-admin", orgAdminRouter);
 */
const fs = require("fs");
const path = require("path");

const filePath = path.join(process.cwd(), "server", "routes.ts");
if (!fs.existsSync(filePath)) {
  console.error("[wireup] server/routes.ts not found at", filePath);
  process.exit(1);
}

let src = fs.readFileSync(filePath, "utf8");
let changed = false;

function ensureImport(what, from) {
  const re = new RegExp(`import\\s+${what}\\s+from\\s+[\"']${from}[\"']\\s*;`);
  if (!re.test(src)) {
    src = `import ${what} from "${from}";\n` + src;
    changed = true;
  }
}
ensureImport("orgAdminRouter", "./routes/org_admin");

const registerRegex = /registerRoutes\\s*\\(\\s*app\\s*:\\s*Express\\s*\\)\\s*{([\\s\\S]*?)return\\s+httpServer\\s*;/m;
const match = src.match(registerRegex);
if (!match) {
  console.error("[wireup] Could not find registerRoutes(app: Express) block.");
  process.exit(2);
}
const block = match[0];
const mountRe = /app\\.use\\(\\s*[\"']\\/api\\/org-admin[\"']\\s*,\\s*orgAdminRouter\\s*\\)/;
if (!mountRe.test(block)) {
  const replaced = block.replace(/return\\s+httpServer\\s*;/, `  // Org Admin (tenant controls)\n  app.use("/api/org-admin", orgAdminRouter);\n\n  return httpServer;`);
  src = src.replace(block, replaced);
  changed = true;
}

if (changed) {
  fs.writeFileSync(filePath, src, "utf8");
  console.log("[wireup] Updated server/routes.ts with /api/org-admin mount.");
} else {
  console.log("[wireup] No changes needed.");
}
