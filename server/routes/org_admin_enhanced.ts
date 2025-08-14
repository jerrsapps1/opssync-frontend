import { Router } from "express";
import { Pool } from "pg";
import { requireAuth, requireOrgAdmin, requireTenant, getTenantId } from "../middleware/authz";
import { resolveTenantFeatures } from "../utils/tenant_features";

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

router.get("/features", requireAuth, requireTenant, requireOrgAdmin, async (req, res) => {
  const tenantId = getTenantId(req)!;
  const features = await resolveTenantFeatures(tenantId);
  res.json({ tenantId, features });
});

router.post("/features", requireAuth, requireTenant, requireOrgAdmin, async (req, res) => {
  const tenantId = getTenantId(req)!;
  const allowed = ["supervisor","manager","sla","reminders","escalations","weekly_digest"];
  const payload: any = {};
  for (const k of allowed) if (k in req.body) payload[k] = !!req.body[k];

  const cols = Object.keys(payload);
  if (!cols.length) return res.status(400).send("No fields to update");

  const vals = cols.map(k => payload[k]);
  const insertVals = ["$1"].concat(cols.map((_,i)=>`$${i+2}`)).join(", ");
  const updates = cols.map((k)=> `${k}=EXCLUDED.${k}`).join(", ");
  await pool.query(
    `insert into feature_overrides (tenant_id, ${cols.join(",")}) values (${insertVals})
     on conflict (tenant_id) do update set ${updates}`,
    [tenantId, ...vals]
  );
  res.json({ ok: true });
});

router.get("/notifications", requireAuth, requireTenant, requireOrgAdmin, async (req, res) => {
  const tenantId = getTenantId(req)!;
  const { rows } = await pool.query(`
    select email_enabled, sms_enabled, daily_digest, weekly_digest, timezone, escalation_after_hours
    from notification_prefs where tenant_id=$1
  `, [tenantId]);
  if (!rows.length) {
    return res.json({ email_enabled: true, sms_enabled: false, daily_digest: false, weekly_digest: true, timezone: "America/Chicago", escalation_after_hours: 4 });
  }
  res.json(rows[0]);
});

router.post("/notifications", requireAuth, requireTenant, requireOrgAdmin, async (req, res) => {
  const tenantId = getTenantId(req)!;
  const fields = ["email_enabled","sms_enabled","daily_digest","weekly_digest","timezone","escalation_after_hours"];
  const payload: any = {};
  for (const f of fields) if (f in req.body) payload[f] = req.body[f];

  const cols = Object.keys(payload);
  if (!cols.length) return res.status(400).send("No fields to update");

  const vals = cols.map(k => payload[k]);
  const insertVals = ["$1"].concat(cols.map((_,i)=>`$${i+2}`)).join(", ");
  const updates = cols.map((k)=> `${k}=EXCLUDED.${k}`).join(", ");
  await pool.query(
    `insert into notification_prefs (tenant_id, ${cols.join(",")}) values (${insertVals})
     on conflict (tenant_id) do update set ${updates}`,
    [tenantId, ...vals]
  );
  res.json({ ok: true });
});

export default router;
