import fs from "fs";
import path from "path";

const DATA = path.join(process.cwd(), "data");
const files = ["customers.json", "project-contacts.json", "notes.json", "history.json"];

if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });
for (const f of files) {
  const p = path.join(DATA, f);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

fs.writeFileSync(path.join(DATA, "customers.json"), JSON.stringify({ byCustomerId: {}, byOrgId: {} }, null, 2));
console.log("Demo data reset.");
