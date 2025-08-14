import { Router } from "express";
import { storage } from "../storage";
import { SLARules, defaultSLARules, scoreBySLA } from "../utils/sla";

const router = Router();

// Get SLA policy for a project
router.get("/projects/:projectId/policy", async (req, res) => {
  const { projectId } = req.params;
  try {
    // For now, return default SLA rules - full implementation would query sla_policies table
    res.json(defaultSLARules);
  } catch (error) {
    console.error("Error fetching SLA policy:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update SLA policy for a project
router.put("/projects/:projectId/policy", async (req, res) => {
  const { projectId } = req.params;
  const { atRiskMinutes, redMinutes } = req.body;
  
  try {
    // Validate inputs
    if (typeof atRiskMinutes !== "number" || typeof redMinutes !== "number") {
      return res.status(400).json({ error: "atRiskMinutes and redMinutes must be numbers" });
    }
    
    if (atRiskMinutes < 0 || redMinutes < 0) {
      return res.status(400).json({ error: "Minutes must be positive" });
    }
    
    // For now, just log the update - full implementation would update sla_policies table
    console.log("SLA policy updated for project:", projectId, { atRiskMinutes, redMinutes });
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating SLA policy:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get SLA scores for all projects
router.get("/scores", async (req, res) => {
  try {
    const projects = await storage.getProjects();
    
    const scores = projects.map(project => ({
      projectId: project.id,
      projectName: project.name,
      score: "GREEN" as const, // Placeholder - real implementation would calculate based on timeliness items
      policy: defaultSLARules,
    }));
    
    res.json(scores);
  } catch (error) {
    console.error("Error fetching SLA scores:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;