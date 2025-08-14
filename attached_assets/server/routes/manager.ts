import { Router } from "express";
import { Pool } from "pg";
import { scoreBySLA, SLARules } from "../utils/sla";
import { toCSV } from "../utils/csv";

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

type Grade = "GREEN" | "AMBER" | "RED";

function dayKey(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
}

router.get("/overview", async (req, res) => {
  const days = Math.max(1, Math.min(180, Number(req.query.days) || 30));
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT i.id, i.type, i.title, i.due_at, i.submitted_at, i.project_id, p.name AS project_name,
        coalesce(s.at_risk_minutes, 60) as at_risk_minutes,
        coalesce(s.red_minutes, 120) as red_minutes
      FROM timeliness_items i
      JOIN projects p ON p.id = i.project_id
      LEFT JOIN sla_policies s ON s.project_id = i.project_id
      WHERE i.deleted_at IS NULL
        AND i.due_at >= (NOW() - ($1::int || ' days')::interval)
      ORDER BY i.due_at ASC
    `, [days]);

    const byProject = new Map<string, any>();
    const trend = new Map<string, { GREEN: number; AMBER: number; RED: number; total: number }>();
    let summary = { total: 0, GREEN: 0, AMBER: 0, RED: 0, overdue: 0, onTimeRate: 0 };

    for (const r of rows) {
      const rules: SLARules = { atRiskMinutes: r.at_risk_minutes, redMinutes: r.red_minutes };
      const grade: Grade = scoreBySLA(r.due_at, r.submitted_at, rules);
      const isOnTime = grade === "GREEN";
      const isOverdue = !r.submitted_at && new Date(r.due_at).getTime() < Date.now();

      summary.total++;
      summary[grade]++;
      if (isOverdue) summary.overdue++;

      // per project
      const key = r.project_id;
      const row = byProject.get(key) || { projectId: key, projectName: r.project_name, GREEN: 0, AMBER: 0, RED: 0, overdue: 0, onTimeCount: 0, count: 0 };
      row[grade]++;
      if (isOverdue) row.overdue++;
      if (isOnTime) row.onTimeCount++;
      row.count++;
      byProject.set(key, row);

      // trend
      const dk = dayKey(new Date(r.due_at));
      const t = trend.get(dk) || { GREEN: 0, AMBER: 0, RED: 0, total: 0 };
      t[grade]++;
      t.total++;
      trend.set(dk, t);
    }

    summary.onTimeRate = summary.total ? (summary.GREEN / summary.total) : 0;

    const byProjectArr = Array.from(byProject.values()).map(r => ({
      projectId: r.projectId,
      projectName: r.projectName,
      GREEN: r.GREEN,
      AMBER: r.AMBER,
      RED: r.RED,
      overdue: r.overdue,
      onTimeRate: r.count ? r.onTimeCount / r.count : 0,
    }));

    const trendArr = Array.from(trend.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([day, v]) => ({ day, ...v }));

    res.json({ summary, byProject: byProjectArr, trend: trendArr });
  } catch (e: any) {
    console.error(e);
    res.status(500).send(e.message);
  } finally {
    client.release();
  }
});

router.get("/projects/:projectId/metrics", async (req, res) => {
  const { projectId } = req.params;
  const days = Math.max(1, Math.min(180, Number(req.query.days) || 30));
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT i.id, i.type, i.title, i.due_at, i.submitted_at,
        coalesce(s.at_risk_minutes, 60) as at_risk_minutes,
        coalesce(s.red_minutes, 120) as red_minutes
      FROM timeliness_items i
      LEFT JOIN sla_policies s ON s.project_id = i.project_id
      WHERE i.project_id = $1
        AND i.deleted_at IS NULL
        AND i.due_at >= (NOW() - ($2::int || ' days')::interval)
      ORDER BY i.due_at ASC
    `, [projectId, days]);

    let GREEN = 0, AMBER = 0, RED = 0, overdue = 0, onTimeCount = 0;
    const items: any[] = [];
    for (const r of rows) {
      const rules: SLARules = { atRiskMinutes: r.at_risk_minutes, redMinutes: r.red_minutes };
      const grade: Grade = scoreBySLA(r.due_at, r.submitted_at, rules);
      if (grade === "GREEN") GREEN++;
      if (grade === "AMBER") AMBER++;
      if (grade === "RED") RED++;
      if (!r.submitted_at && new Date(r.due_at).getTime() < Date.now()) overdue++;
      if (grade === "GREEN") onTimeCount++;
      items.push({ id: r.id, title: r.title, type: r.type, dueAt: r.due_at, submittedAt: r.submitted_at, grade });
    }
    const total = rows.length;
    res.json({ total, GREEN, AMBER, RED, overdue, onTimeRate: total ? onTimeCount/total : 0, items });
  } catch (e: any) {
    console.error(e);
    res.status(500).send(e.message);
  } finally {
    client.release();
  }
});

router.get("/export.csv", async (req, res) => {
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
        item_id: r.id,
        project: r.project,
        type: r.type,
        title: r.title,
        due_at: r.due_at,
        submitted_at: r.submitted_at || "",
        sla_grade: grade,
      };
    });

    const csv = toCSV(rowsOut);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="manager_export.csv"');
    res.send(csv);
  } catch (e: any) {
    console.error(e);
    res.status(500).send(e.message);
  } finally {
    client.release();
  }
});

export default router;
