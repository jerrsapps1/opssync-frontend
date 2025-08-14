import { Router } from "express";
import { Pool } from "pg";
import { computeStatus, TimelinessStatus } from "../utils/timeliness";
import { sendEmail, sendSMS } from "../services/notifications";

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ---- Types
type Project = { id: string; name: string; start_blocked: boolean; supervisor_email?: string; supervisor_phone?: string | null; };
type TimelinessItem = { id: string; project_id: string; project_name: string; type: "UPDATE" | "CHANGE_REQUEST"; title: string; due_at: string; submitted_at?: string | null; status: TimelinessStatus };

// ---- Helpers
async function fetchOverview(supervisorUserId?: string) {
  const client = await pool.connect();
  try {
    const projectsRes = await client.query<Project>(`
      SELECT id, name, start_blocked, supervisor_email, supervisor_phone
      FROM projects
      ORDER BY created_at DESC
      LIMIT 100
    `);

    const itemsRes = await client.query(`
      SELECT i.id, i.project_id, p.name as project_name, i.type, i.title, i.due_at, i.submitted_at
      FROM timeliness_items i
      JOIN projects p ON p.id = i.project_id
      WHERE i.deleted_at IS NULL
      ORDER BY i.due_at ASC
      LIMIT 200
    `);

    const warnMinutes = Number(process.env.REMINDER_MINUTES_BEFORE || 60);
    const items: TimelinessItem[] = itemsRes.rows.map((r: any) => ({
      id: r.id,
      project_id: r.project_id,
      project_name: r.project_name,
      type: r.type,
      title: r.title,
      due_at: r.due_at,
      submitted_at: r.submitted_at,
      status: computeStatus(r.due_at, r.submitted_at, warnMinutes),
    }));

    const projects = projectsRes.rows.map(p => ({
      id: p.id,
      name: p.name,
      startBlocked: p.start_blocked,
    }));

    return { projects, items };
  } finally {
    client.release();
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
  const client = await pool.connect();
  try {
    await client.query("UPDATE timeliness_items SET submitted_at = NOW() WHERE id = $1", [itemId]);
    res.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    res.status(500).send(e.message);
  } finally {
    client.release();
  }
});

router.post("/projects/:projectId/checklist", async (req, res) => {
  const { projectId } = req.params;
  const { items, note } = req.body || {};
  const client = await pool.connect();
  try {
    await client.query("INSERT INTO checklists (project_id, payload, note) VALUES ($1, $2, $3)", [projectId, items || {}, note || null]);
    await client.query("UPDATE projects SET start_blocked = FALSE WHERE id = $1", [projectId]);
    res.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    res.status(500).send(e.message);
  } finally {
    client.release();
  }
});

router.post("/projects/:projectId/change-requests", async (req, res) => {
  const { projectId } = req.params;
  const { title, description, dueAt } = req.body || {};
  if (!title) return res.status(400).send("title required");
  const client = await pool.connect();
  try {
    const row = await client.query(
      `INSERT INTO timeliness_items (project_id, type, title, description, due_at) 
       VALUES ($1, 'CHANGE_REQUEST', $2, $3, $4) RETURNING id`,
      [projectId, title, description || "", dueAt || new Date(Date.now() + 24*60*60*1000).toISOString()]
    );
    res.json({ ok: true, id: row.rows[0].id });
  } catch (e: any) {
    console.error(e);
    res.status(500).send(e.message);
  } finally {
    client.release();
  }
});

// Simple creation of an "update due" item for supervisors to complete by a time
router.post("/projects/:projectId/require-update", async (req, res) => {
  const { projectId } = req.params;
  const { title, dueAt } = req.body || {};
  const client = await pool.connect();
  try {
    const row = await client.query(
      `INSERT INTO timeliness_items (project_id, type, title, due_at) 
       VALUES ($1, 'UPDATE', $2, $3) RETURNING id`,
      [projectId, title || "Supervisor Update", dueAt || new Date(Date.now() + 60*60*1000).toISOString()]
    );
    res.json({ ok: true, id: row.rows[0].id });
  } catch (e: any) {
    console.error(e);
    res.status(500).send(e.message);
  } finally {
    client.release();
  }
});

// ---- Reminder runner (can also be triggered by a cron or called manually)
router.post("/run-reminders", async (req, res) => {
  const warnMinutes = Number(process.env.REMINDER_MINUTES_BEFORE || 60);
  const nowIso = new Date().toISOString();
  const client = await pool.connect();
  try {
    const rows = await client.query(
      `SELECT i.id, i.title, i.due_at, i.submitted_at, p.name as project_name, p.supervisor_email, p.supervisor_phone
       FROM timeliness_items i
       JOIN projects p ON p.id = i.project_id
       WHERE i.submitted_at IS NULL AND i.deleted_at IS NULL AND i.due_at <= (NOW() + make_interval(mins => $1))`,
      [warnMinutes]
    );

    let sent = 0;
    for (const r of rows.rows) {
      const status = computeStatus(r.due_at, r.submitted_at, warnMinutes);
      if (status === "AT_RISK" || status === "OVERDUE") {
        if (r.supervisor_email) {
          await sendEmail({
            to: r.supervisor_email,
            subject: `[Action Needed] ${r.title} — due ${new Date(r.due_at).toLocaleString()}`,
            html: `<p>Project: <b>${r.project_name}</b></p>
                   <p>Item: <b>${r.title}</b></p>
                   <p>Status: <b>${status}</b></p>
                   <p>Due: ${new Date(r.due_at).toLocaleString()}</p>`,
          });
        }
        if (r.supervisor_phone) {
          await sendSMS({
            to: r.supervisor_phone,
            message: `Reminder: ${r.title} for ${r.project_name} is ${status.replace("_", " ").lower()} and due ${new Date(r.due_at).toLocaleString()}.`,
          });
        }
        sent++;
      }
    }
    res.json({ ok: true, scanned: rows.rowCount, remindersSent: sent, now: nowIso });
  } catch (e: any) {
    console.error(e);
    res.status(500).send(e.message);
  } finally {
    client.release();
  }
});

export default router;
