/**
 * Auto-mounts Owner & Org admin APIs in server/routes.ts:
 *   import ownerAdminRouter from "./routes/owner_admin";
 *   app.use("/api/owner-admin", ownerAdminRouter);
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

ensureImport("ownerAdminRouter", "./routes/owner_admin");
ensureImport("orgAdminRouter", "./routes/org_admin");

const registerRegex = /registerRoutes\\s*\\(\\s*app\\s*:\\s*Express\\s*\\)\\s*{([\\s\\S]*?)return\\s+httpServer\\s*;/m;
const match = src.match(registerRegex);
if (!match) {
  console.error("[wireup] Could not find registerRoutes(app: Express) block.");
  process.exit(2);
}
const block = match[0];

function ensureMount(pathStr, varName) {
  const mountRe = new RegExp(`app\\.use\\(\\s*[\"']${pathStr}[\"']\\s*,\\s*${varName}\\s*\\)`);
  if (!mountRe.test(block)) {
    const replaced = block.replace(/return\\s+httpServer\\s*;/, `  app.use("${pathStr}", ${varName});\n\n  return httpServer;`);
    src = src.replace(block, replaced);
    changed = true;
  }
}

ensureMount("/api/owner-admin", "ownerAdminRouter");
ensureMount("/api/org-admin", "orgAdminRouter");

if (changed) {
  fs.writeFileSync(filePath, src, "utf8");
  console.log("[wireup] Mounted /api/owner-admin and /api/org-admin");
} else {
  console.log("[wireup] No changes needed.");
}
