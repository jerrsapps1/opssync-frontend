import { Router } from "express";
import { Pool } from "pg";
import { resolveTenantFeatures } from "../utils/tenant_features";

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * GET /api/analytics/projects/trends?days=90
 * Returns per-project counts by status per day.
 */
router.get("/projects/trends", async (req, res) => {
  const user = (req as any).user || {};
  const tenantId = user?.tenantId;
  if (!tenantId) return res.status(400).send("Missing tenant");
  const days = Math.max(7, Math.min(365, Number(req.query.days) || 90));

  const { rows } = await pool.query(`
    with d as (
      select generate_series::date as day
      from generate_series((now() - ($1::int || ' days')::interval)::date, now()::date, '1 day')
    ),
    items as (
      select i.id, i.due_at::date as day, p.id as project_id, p.name as project_name,
             case
               when i.submitted_at is not null and i.submitted_at <= i.due_at then 'On time'
               when i.submitted_at is null and i.due_at >= now() then 'Due soon'
               else 'Late'
             end as status
      from timeliness_items i
      join projects p on p.id = i.project_id
      where p.tenant_id = $2 and i.deleted_at is null and i.due_at >= now() - ($1::int || ' days')::interval
    )
    select i.project_id, i.project_name, i.day,
           sum(case when i.status='On time' then 1 else 0 end) as on_time,
           sum(case when i.status='Due soon' then 1 else 0 end) as due_soon,
           sum(case when i.status='Late' then 1 else 0 end) as late
    from d left join items i on i.day = d.day
    group by i.project_id, i.project_name, i.day
    order by i.project_name asc, i.day asc;
  `, [days, tenantId]);

  res.json({ days, rows });
});

/**
 * GET /api/analytics/projects/summary?days=90
 * Returns per-project aggregate and on-time rate.
 */
router.get("/projects/summary", async (req, res) => {
  const user = (req as any).user || {};
  const tenantId = user?.tenantId;
  if (!tenantId) return res.status(400).send("Missing tenant");
  const days = Math.max(7, Math.min(365, Number(req.query.days) || 90));

  const { rows } = await pool.query(`
    select p.id as project_id, p.name as project_name,
      count(*) as total,
      sum(case when i.submitted_at is not null and i.submitted_at <= i.due_at then 1 else 0 end) as on_time,
      sum(case when i.submitted_at is null and i.due_at >= now() then 1 else 0 end) as due_soon,
      sum(case when (i.submitted_at is null and i.due_at < now()) or (i.submitted_at is not null and i.submitted_at > i.due_at) then 1 else 0 end) as late
    from timeliness_items i
    join projects p on p.id = i.project_id
    where p.tenant_id = $1 and i.deleted_at is null and i.due_at >= now() - ($2::int || ' days')::interval
    group by p.id, p.name
    order by p.name asc;
  `, [tenantId, days]);

  res.json({ days, rows });
});

export default router;
