import { Router } from "express";
import { runEscalations } from "../services/escalation";
import { runWeeklyDigest } from "../services/digest";

const router = Router();

// Development endpoints for manual triggering

router.post("/run-escalations", async (req, res) => {
  try {
    const result = await runEscalations();
    res.json({
      success: true,
      message: "Escalations completed",
      ...result,
    });
  } catch (error: any) {
    console.error("Error running escalations:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

router.post("/run-digest", async (req, res) => {
  try {
    const result = await runWeeklyDigest();
    res.json({
      success: true,
      message: "Weekly digest completed",
      ...result,
    });
  } catch (error: any) {
    console.error("Error running digest:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

export default router;