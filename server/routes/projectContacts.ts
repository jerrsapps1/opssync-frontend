import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();
const DATA = path.join(process.cwd(), "data");
const FILE = path.join(DATA, "project-contacts.json");

function load(): Record<string, any[]> {
  if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify({}), "utf-8");
  try { return JSON.parse(fs.readFileSync(FILE, "utf-8")); } catch { return {}; }
}
function save(db: Record<string, any[]>) {
  if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2), "utf-8");
}

// List contacts for a project
router.get("/projects/:id/contacts", (req, res) => {
  const db = load();
  const list = db[req.params.id] || [];
  res.json(list);
});

// Add/Update a contact (simple append for now; could add IDs)
router.post("/projects/:id/contacts", (req, res) => {
  const db = load();
  const id = req.params.id;
  const list = db[id] || [];
  const next = { id: String(Date.now()), projectId: id, ...req.body };
  list.push(next);
  db[id] = list;
  save(db);
  res.json(next);
});

export default router;
