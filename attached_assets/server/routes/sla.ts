import { Router } from "express";
import { Pool } from "pg";
import { SLARules, SLAScore, scoreBySLA } from "../utils/sla";

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Get/Set project-level SLA rules
router.get("/projects/:projectId", async (req, res) => {
  const { projectId } = req.params;
  const { rows } = await pool.query(`
    SELECT project_id, at_risk_minutes, red_minutes
    FROM sla_policies WHERE project_id = $1
  `, [projectId]);
  if (!rows.length) return res.json({ projectId, atRiskMinutes: 60, redMinutes: 120 }); // defaults
  const r = rows[0];
  res.json({ projectId: r.project_id, atRiskMinutes: r.at_risk_minutes, redMinutes: r.red_minutes });
});

router.post("/projects/:projectId", async (req, res) => {
  const { projectId } = req.params;
  const { atRiskMinutes = 60, redMinutes = 120 } = req.body || {};
  await pool.query(`
    INSERT INTO sla_policies (project_id, at_risk_minutes, red_minutes)
    VALUES ($1,$2,$3)
    ON CONFLICT (project_id) DO UPDATE SET at_risk_minutes = EXCLUDED.at_risk_minutes, red_minutes = EXCLUDED.red_minutes
  `, [projectId, atRiskMinutes, redMinutes]);
  res.json({ ok: true, projectId, atRiskMinutes, redMinutes });
});

// Compute SLA score for a given item
router.get("/items/:itemId/score", async (req, res) => {
  const { itemId } = req.params;
  const { rows } = await pool.query(`
    SELECT i.id, i.due_at, i.submitted_at, i.project_id,
      coalesce(s.at_risk_minutes, 60) as at_risk_minutes,
      coalesce(s.red_minutes, 120) as red_minutes
    FROM timeliness_items i
    LEFT JOIN sla_policies s ON s.project_id = i.project_id
    WHERE i.id = $1
  `, [itemId]);
  if (!rows.length) return res.status(404).send("Item not found");
  const r = rows[0];
  const rules: SLARules = { atRiskMinutes: r.at_risk_minutes, redMinutes: r.red_minutes };
  const grade: SLAScore = scoreBySLA(r.due_at, r.submitted_at, rules);
  res.json({ itemId, grade, rules });
});

export default router;
