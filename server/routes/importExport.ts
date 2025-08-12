import express from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import fetch from "node-fetch";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper to fetch JSON from our own API (fallback if data layer isn't imported)
async function getJSON(path: string) {
  const base = process.env.INTERNAL_BASE_URL || "http://localhost:" + (process.env.PORT || 3000);
  const res = await fetch(base + path);
  if (!res.ok) throw new Error("Failed to fetch " + path + ": " + res.status);
  return res.json();
}

function toCSV<T extends Record<string, any>>(rows: T[], headers?: string[]): string {
  if (!rows.length) return (headers || []).join(",") + "\n";
  const keys = headers && headers.length ? headers : Object.keys(rows[0]);
  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (s.includes(',') || s.includes('\n') || s.includes('"')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const head = keys.join(",");
  const body = rows.map(r => keys.map(k => esc(r[k])).join(",")).join("\n");
  return head + "\n" + body + "\n";
}

// --------- EQUIPMENT ---------
router.get("/equipment/export", async (req, res) => {
  try {
    const list = await getJSON("/api/equipment");
    const csv = toCSV(list, ["id","name","type","make","model","year","serialNumber","currentProjectId","notes"]);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=equipment_export.csv");
    res.send(csv);
  } catch (e:any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/equipment/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const text = req.file.buffer.toString("utf-8");
    const rows = parse(text, { columns: true, skip_empty_lines: true });
    const base = process.env.INTERNAL_BASE_URL || "http://localhost:" + (process.env.PORT || 3000);
    let created = 0, updated = 0;
    for (const r of rows) {
      // Upsert by id or serialNumber+name
      const id = r.id?.trim();
      const body = {
        name: r.name,
        type: r.type,
        make: r.make || null,
        model: r.model || null,
        year: r.year ? Number(r.year) : null,
        serialNumber: r.serialNumber || null,
        currentProjectId: r.currentProjectId || null,
        notes: r.notes || null,
      };
      const url = id ? `/api/equipment/${id}` : `/api/equipment`;
      const method = id ? "PATCH" : "POST";
      const resp = await fetch(base + url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (resp.ok) {
        if (id) updated++; else created++;
      }
    }
    res.json({ created, updated });
  } catch (e:any) {
    res.status(500).json({ error: e.message });
  }
});

// --------- EMPLOYEES ---------
router.get("/employees/export", async (req, res) => {
  try {
    const list = await getJSON("/api/employees");
    const csv = toCSV(list, ["id","name","role","email","phone","currentProjectId","certs","notes"]);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=employees_export.csv");
    res.send(csv);
  } catch (e:any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/employees/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const text = req.file.buffer.toString("utf-8");
    const rows = parse(text, { columns: true, skip_empty_lines: true });
    const base = process.env.INTERNAL_BASE_URL || "http://localhost:" + (process.env.PORT || 3000);
    let created = 0, updated = 0;
    for (const r of rows) {
      const id = r.id?.trim();
      const body = {
        name: r.name,
        role: r.role || null,
        email: r.email || null,
        phone: r.phone || null,
        currentProjectId: r.currentProjectId || null,
        certs: r.certs || null,
        notes: r.notes || null,
      };
      const url = id ? `/api/employees/${id}` : `/api/employees`;
      const method = id ? "PATCH" : "POST";
      const resp = await fetch(base + url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (resp.ok) {
        if (id) updated++; else created++;
      }
    }
    res.json({ created, updated });
  } catch (e:any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
