import { Router } from "express";
import pg from "pg";

const { Pool } = pg;
import { scoreBySLA, SLARules } from "../utils/sla";
import { toCSV } from "../utils/csv";

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function gradeToPlain(grade: "GREEN" | "AMBER" | "RED") {
  if (grade === "GREEN") return "On time";
  if (grade === "AMBER") return "Due soon";
  return "Late";
}

/**
 * Field-friendly CSV with plain headers and statuses.
 * GET /api/manager/export-friendly.csv?days=30
 */
router.get("/export-friendly.csv", async (req, res) => {
  const days = Math.max(1, Math.min(365, Number(req.query.days) || 30));
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT i.id, p.name AS project, i.type, i.title, i.due_at, i.submitted_at,
        coalesce(s.at_risk_minutes, 60) as at_risk_minutes,
        coalesce(s.red_minutes, 120) as red_minutes
      FROM timeliness_items i
      JOIN projects p ON p.id = i.project_id
      LEFT JOIN sla_policies s ON s.project_id = i.project_id
      WHERE i.deleted_at IS NULL
        AND i.due_at >= (NOW() - ($1::int || ' days')::interval)
      ORDER BY p.name ASC, i.due_at ASC
    `, [days]);

    const rowsOut = rows.map((r: any) => {
      const grade = scoreBySLA(r.due_at, r.submitted_at, { atRiskMinutes: r.at_risk_minutes, redMinutes: r.red_minutes });
      return {
        "Item ID": r.id,
        "Project": r.project,
        "Type": r.type,
        "Task": r.title,
        "Due": r.due_at,
        "Completed": r.submitted_at || "",
        "Status": gradeToPlain(grade)
      };
    });

    const csv = toCSV(rowsOut);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="schedule_export.csv"');
    res.send(csv);
  } catch (e: any) {
    console.error(e);
    res.status(500).send(e.message);
  } finally {
    client.release();
  }
});

/**
 * Optional alias for overview JSON with a friendly top-level name.
 * GET /api/manager/schedule-health?days=30
 * Returns the same structure as /api/manager/overview for compatibility.
 */
router.get("/schedule-health", async (req, res, next) => {
  // Reuse the existing handler by forwarding to /overview
  (req as any).url = `/overview?days=${encodeURIComponent(String(req.query.days ?? ""))}`;
  next();
});

export default router;
