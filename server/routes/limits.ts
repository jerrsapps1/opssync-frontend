import express from "express";
import { planGate } from "../middleware/planGate";

const router = express.Router();

// Example: AI / white-label endpoints only for Growth+
router.get("/feature/white-label", planGate("growth"), (req, res) => {
  res.json({ ok: true, message: "White-label config available" });
});

// Example: Real-time options only for Starter+ (everyone in paid tiers)
router.get("/feature/realtime", planGate("starter"), (req, res) => {
  res.json({ ok: true, message: "Realtime enabled" });
});

export default router;
