import { Router } from "express";
import { requireAuth, requirePlatformOwner } from "../middleware/authz";
import { getGlobalFeatures, setGlobalFeature } from "../utils/global_features";

const router = Router();

// Read global flags (env defaults + overrides from DB)
router.get("/features", requireAuth, requirePlatformOwner, async (_req, res) => {
  const flags = await getGlobalFeatures();
  res.json(flags);
});

// Update a global feature { key: 'SLA', value: true }
router.post("/features", requireAuth, requirePlatformOwner, async (req, res) => {
  const { key, value } = req.body || {};
  const allowed = ["SUPERVISOR","MANAGER","SLA","REMINDERS","ESCALATIONS","WEEKLY_DIGEST"];
  if (!allowed.includes(key)) return res.status(400).send("Invalid key");
  await setGlobalFeature(key, !!value);
  res.json({ ok: true });
});

export default router;
