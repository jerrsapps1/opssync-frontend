import express from "express";
import fetch from "node-fetch";
import { broadcast } from "../realtime/stream";

const router = express.Router();
const BASE = process.env.INTERNAL_BASE_URL || "http://localhost:" + (process.env.PORT || 3000);

// PATCH /api/employees/:id/assignment { currentProjectId }
router.patch("/employees/:id/assignment", async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const { currentProjectId } = req.body || {};
    const r = await fetch(`${BASE}/api/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentProjectId }),
    });
    if (!r.ok) throw new Error(`Upstream error ${r.status}`);
    const payload = await r.json();
    broadcast({ type: "assignment.updated", entity: "employee", id, currentProjectId });
    res.json(payload);
  } catch (e:any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/equipment/:id/assignment { currentProjectId }
router.patch("/equipment/:id/assignment", async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const { currentProjectId } = req.body || {};
    const r = await fetch(`${BASE}/api/equipment/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentProjectId }),
    });
    if (!r.ok) throw new Error(`Upstream error ${r.status}`);
    const payload = await r.json();
    broadcast({ type: "assignment.updated", entity: "equipment", id, currentProjectId });
    res.json(payload);
  } catch (e:any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
