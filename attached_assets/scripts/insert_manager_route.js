/**
 * Adds Manager API mount to server/routes.ts:
 *   import managerRouter from "./routes/manager";
 *   app.use("/api/manager", managerRouter);
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
ensureImport("managerRouter", "./routes/manager");

const registerRegex = /registerRoutes\\s*\\(\\s*app\\s*:\\s*Express\\s*\\)\\s*{([\\s\\S]*?)return\\s+httpServer\\s*;/m;
const match = src.match(registerRegex);
if (!match) {
  console.error("[wireup] Could not find registerRoutes(app: Express) block.");
  process.exit(2);
}
const block = match[0];

const mountRe = /app\\.use\\(\\s*[\"']\\/api\\/manager[\"']\\s*,\\s*managerRouter\\s*\\)/;
if (!mountRe.test(block)) {
  const replaced = block.replace(/return\\s+httpServer\\s*;/, `  // Manager Dashboard\n  app.use("/api/manager", managerRouter);\n\n  return httpServer;`);
  src = src.replace(block, replaced);
  changed = true;
}

if (changed) {
  fs.writeFileSync(filePath, src, "utf8");
  console.log("[wireup] Updated server/routes.ts with /api/manager mount.");
} else {
  console.log("[wireup] No changes needed.");
}
