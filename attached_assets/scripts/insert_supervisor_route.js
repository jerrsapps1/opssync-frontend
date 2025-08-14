/**
 * insert_supervisor_route.js
 * Usage:
 *   node scripts/insert_supervisor_route.js
 * 
 * Assumes project root. Edits server/routes.ts in-place:
 *  - Adds: import supervisorRouter from "./routes/supervisor";
 *  - Adds mount: app.use("/api/supervisor", supervisorRouter);
 * Places mount just before `return httpServer;` in registerRoutes.
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

// 1) Ensure import exists
if (!src.match(/import\s+supervisorRouter\s+from\s+["']\.\/routes\/supervisor["'];?/)) {
  // place after last import line
  const importIdx = src.lastIndexOf("import ");
  if (importIdx >= 0) {
    // Insert after the last import line block
    const importBlockEnd = src.indexOf("\n", src.lastIndexOf("\n", importIdx) + 1);
    const insertionPoint = importBlockEnd === -1 ? 0 : importBlockEnd + 1;
    src = src.slice(0, insertionPoint) + `import supervisorRouter from "./routes/supervisor";\n` + src.slice(insertionPoint);
    changed = true;
  } else {
    // No imports? Prepend
    src = `import supervisorRouter from "./routes/supervisor";\n` + src;
    changed = true;
  }
}

// 2) Insert mount inside registerRoutes() before return httpServer;
const registerRegex = /registerRoutes\s*\(\s*app\s*:\s*Express\s*\)\s*{([\s\S]*?)return\s+httpServer\s*;/m;
const match = src.match(registerRegex);
if (!match) {
  console.error("[wireup] Could not find registerRoutes(app: Express) { ... return httpServer; } block.");
  process.exit(2);
}

const block = match[0];
if (!/app\.use\(\s*["']\/api\/supervisor["']\s*,\s*supervisorRouter\s*\)/.test(block)) {
  const replaced = block.replace(/return\s+httpServer\s*;/, `  // Supervisor Portal & Timeliness\n  app.use("/api/supervisor", supervisorRouter);\n\n  return httpServer;`);
  src = src.replace(block, replaced);
  changed = true;
}

if (!changed) {
  console.log("[wireup] No changes made (import and mount already present).");
} else {
  fs.writeFileSync(filePath, src, "utf8");
  console.log("[wireup] Updated server/routes.ts successfully.");
}
