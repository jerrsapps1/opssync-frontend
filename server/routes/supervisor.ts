import { Router } from "express";
import { storage } from "../storage";
import { computeStatus, TimelinessStatus } from "../utils/timeliness";
import { sendEmail, sendSMS } from "../services/notifications";
import { db } from "../db";

const router = Router();

// ---- Types
type Project = { id: string; name: string; start_blocked: boolean; supervisor_email?: string; supervisor_phone?: string | null; };
type TimelinessItem = { id: string; project_id: string; project_name: string; type: "UPDATE" | "CHANGE_REQUEST"; title: string; due_at: string; submitted_at?: string | null; status: TimelinessStatus };

// ---- Helpers
async function fetchOverview(supervisorUserId?: string) {
  try {
    // Get projects using storage
    const allProjects = await storage.getProjects();
    const projects = allProjects.slice(0, 100).map(p => ({
      id: p.id,
      name: p.name,
      startBlocked: p.startBlocked ?? true,
    }));

    // For now, return empty items until timeliness_items table integration
    const items: TimelinessItem[] = [];

    return { projects, items };
  } catch (error) {
    console.error("Error fetching overview:", error);
    throw error;
  }
}

// ---- Routes

router.get("/overview", async (req, res) => {
  try {
    const data = await fetchOverview();
    res.json(data);
  } catch (e: any) {
    console.error(e);
    res.status(500).send(e.message);
  }
});

router.post("/ack/:itemId", async (req, res) => {
  const { itemId } = req.params;
  try {
    // For now, just return success - full implementation would update timeliness_items table
    console.log("Acknowledging item:", itemId);
    res.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    res.status(500).send(e.message);
  }
});

router.post("/projects/:projectId/checklist", async (req, res) => {
  const { projectId } = req.params;
  const { items, note } = req.body || {};
  try {
    // For now, just log the checklist submission - full implementation would save to database
    console.log("Checklist submitted for project:", projectId, { items, note });
    
    // Update project to unblock it
    const project = await storage.getProjectById(projectId);
    if (project) {
      await storage.updateProject(projectId, { startBlocked: false });
    }
    
    res.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    res.status(500).send(e.message);
  }
});

router.post("/projects/:projectId/change-requests", async (req, res) => {
  const { projectId } = req.params;
  const { title, description, dueAt } = req.body || {};
  if (!title) return res.status(400).send("title required");
  try {
    // For now, just log the change request - full implementation would save to timeliness_items table
    console.log("Change request created for project:", projectId, { title, description, dueAt });
    res.json({ ok: true, id: `cr-${Date.now()}` });
  } catch (e: any) {
    console.error(e);
    res.status(500).send(e.message);
  }
});

// Simple creation of an "update due" item for supervisors to complete by a time
router.post("/projects/:projectId/require-update", async (req, res) => {
  const { projectId } = req.params;
  const { title, dueAt } = req.body || {};
  try {
    // For now, just log the update requirement - full implementation would save to timeliness_items table
    console.log("Update requirement created for project:", projectId, { title, dueAt });
    res.json({ ok: true, id: `update-${Date.now()}` });
  } catch (e: any) {
    console.error(e);
    res.status(500).send(e.message);
  }
});

// ---- Reminder runner (can also be triggered by a cron or called manually)
router.post("/run-reminders", async (req, res) => {
  try {
    // For now, just return placeholder response - full implementation would query timeliness_items table
    console.log("Running reminders check...");
    res.json({ ok: true, scanned: 0, remindersSent: 0, now: new Date().toISOString() });
  } catch (e: any) {
    console.error(e);
    res.status(500).send(e.message);
  }
});

export default router;
