import { Router } from "express";
import { runEscalations } from "../services/escalation";
import { runWeeklyDigest } from "../services/digest";

const router = Router();

router.post("/run-escalations", async (_req, res) => {
  const out = await runEscalations();
  res.json(out);
});

router.post("/run-weekly-digest", async (_req, res) => {
  const out = await runWeeklyDigest();
  res.json(out);
});

export default router;
