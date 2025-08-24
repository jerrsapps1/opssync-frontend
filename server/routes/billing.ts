import { Router } from "express";
import { getOrg, updatePlan } from "../startup";

const r = Router();

r.get("/org", async (_req, res) => {
  const org = await getOrg();
  res.json({ org });
});

r.post("/upgrade", async (req, res) => {
  const { plan } = req.body || {};
  if (!plan) return res.status(400).json({ error: "plan required" });

  const updated = await updatePlan(plan);
  res.json({ ok: true, org: updated });
});

export default r;