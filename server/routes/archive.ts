import express from "express";
import { appendHistory } from "../utils/audit";
import fetch from "node-fetch";

const router = express.Router();
const BASE = process.env.INTERNAL_BASE_URL || "http://localhost:" + (process.env.PORT || 3000);

type Entity = "employees" | "equipment" | "projects";
function singular(e: Entity): "employee"|"equipment"|"project" {
  return e === "employees" ? "employee" : e === "equipment" ? "equipment" : "project";
}

// Soft archive
router.post("/:entity/:id/archive", async (req, res) => {
  const { entity, id } = req.params as { entity: Entity; id: string };
  try {
    const r = await fetch(`${BASE}/api/${entity}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "archived", archivedAt: new Date().toISOString() }),
    });
    if (!r.ok) throw new Error(`Failed to archive ${entity}/${id}`);
    appendHistory({ id: String(Date.now()), entity: singular(entity), entityId: id, action: "archive", at: new Date().toISOString(), payload: {} });
    res.json(await r.json());
  } catch (e:any) {
    res.status(500).json({ error: e.message });
  }
});

// Restore
router.post("/:entity/:id/restore", async (req, res) => {
  const { entity, id } = req.params as { entity: Entity; id: string };
  try {
    const r = await fetch(`${BASE}/api/${entity}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active", archivedAt: null }),
    });
    if (!r.ok) throw new Error(`Failed to restore ${entity}/${id}`);
    appendHistory({ id: String(Date.now()), entity: singular(entity), entityId: id, action: "restore", at: new Date().toISOString(), payload: {} });
    res.json(await r.json());
  } catch (e:any) {
    res.status(500).json({ error: e.message });
  }
});

// Soft delete (mark removed)
router.delete("/:entity/:id", async (req, res) => {
  const { entity, id } = req.params as { entity: Entity; id: string };
  try {
    const r = await fetch(`${BASE}/api/${entity}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "removed", removedAt: new Date().toISOString() }),
    });
    if (!r.ok) throw new Error(`Failed to remove ${entity}/${id}`);
    appendHistory({ id: String(Date.now()), entity: singular(entity), entityId: id, action: "delete", at: new Date().toISOString(), payload: {} });
    res.json(await r.json());
  } catch (e:any) {
    res.status(500).json({ error: e.message });
  }
});

// History feed
router.get("/history", async (req, res) => {
  try {
    const fs = await import("fs");
    const path = await import("path");
    const file = path.join(process.cwd(), "data", "history.json");
    if (!fs.existsSync(file)) return res.json([]);
    const list = JSON.parse(fs.readFileSync(file, "utf-8"));
    res.json(list);
  } catch (e:any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
