/**
 * Adds SLA API mount to server/routes.ts:
 *   import slaRouter from "./routes/sla";
 *   app.use("/api/sla", slaRouter);
 * Also adds optional dev endpoints:
 *   import devRouter from "./routes/dev";
 *   app.use("/api/dev", devRouter);
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

ensureImport("slaRouter", "./routes/sla");
ensureImport("devRouter", "./routes/dev");

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
ensureMount("/api/sla", "slaRouter");
ensureMount("/api/dev", "devRouter");

if (changed) {
  fs.writeFileSync(filePath, src, "utf8");
  console.log("[wireup] Updated server/routes.ts with /api/sla and /api/dev mounts.");
} else {
  console.log("[wireup] No changes needed.");
}
