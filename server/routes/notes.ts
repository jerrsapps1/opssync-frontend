import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();
const DATA = path.join(process.cwd(), "data");
const FILE = path.join(DATA, "notes.json");

function load(): any[] {
  if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify([]), "utf-8");
  try { return JSON.parse(fs.readFileSync(FILE, "utf-8")); } catch { return []; }
}
function save(list: any[]) {
  if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2), "utf-8");
}

router.post("/notes", (req, res) => {
  const all = load();
  const item = { id: String(Date.now()), at: new Date().toISOString(), ...req.body };
  all.push(item);
  save(all);
  res.json(item);
});

export default router;
