import express from "express";
import fetch from "node-fetch";
import { broadcast } from "../realtime/stream";

const router = express.Router();
const BASE = process.env.INTERNAL_BASE_URL || "http://localhost:" + (process.env.PORT || 5000);

router.patch("/employees/:id/assignment", async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const { projectId } = req.body || {};  // Frontend sends projectId
    const r = await fetch(`${BASE}/api/employees/${id}/assignment`, {  // Call assignment endpoint
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),  // Send projectId as expected by assignment endpoint
    });
    if (!r.ok) throw new Error(`Upstream error ${r.status}`);
    const payload = await r.json();
    broadcast({ type: "assignment.updated", entity: "employee", id, currentProjectId: projectId });
    res.json(payload);
  } catch (e:any) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/equipment/:id/assignment", async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const { projectId } = req.body || {};  // Frontend sends projectId
    const r = await fetch(`${BASE}/api/equipment/${id}/assignment`, {  // Call assignment endpoint
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),  // Send projectId as expected by assignment endpoint
    });
    if (!r.ok) throw new Error(`Upstream error ${r.status}`);
    const payload = await r.json();
    broadcast({ type: "assignment.updated", entity: "equipment", id, currentProjectId: projectId });
    res.json(payload);
  } catch (e:any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
