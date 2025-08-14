import { Pool } from "pg";
import { features as globalFeatures } from "../config/features";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export type TenantFeatures = {
  SUPERVISOR: boolean;
  MANAGER: boolean;
  SLA: boolean;
  REMINDERS: boolean;
  ESCALATIONS: boolean;
  WEEKLY_DIGEST: boolean;
};

export async function resolveTenantFeatures(tenantId: string): Promise<TenantFeatures> {
  const f = {
    SUPERVISOR: globalFeatures.SUPERVISOR,
    MANAGER: globalFeatures.MANAGER,
    SLA: globalFeatures.SLA,
    REMINDERS: globalFeatures.REMINDERS,
    ESCALATIONS: globalFeatures.ESCALATIONS,
    WEEKLY_DIGEST: globalFeatures.WEEKLY_DIGEST,
  };
  if (!tenantId) return f;
  const { rows } = await pool.query(`
    select supervisor, manager, sla, reminders, escalations, weekly_digest
    from feature_overrides where tenant_id = $1
  `, [tenantId]);
  if (!rows.length) return f;
  const o = rows[0];
  // Only override when not null
  if (o.supervisor !== null && o.supervisor !== undefined) f.SUPERVISOR = !!o.supervisor;
  if (o.manager !== null && o.manager !== undefined) f.MANAGER = !!o.manager;
  if (o.sla !== null && o.sla !== undefined) f.SLA = !!o.sla;
  if (o.reminders !== null && o.reminders !== undefined) f.REMINDERS = !!o.reminders;
  if (o.escalations !== null && o.escalations !== undefined) f.ESCALATIONS = !!o.escalations;
  if (o.weekly_digest !== null && o.weekly_digest !== undefined) f.WEEKLY_DIGEST = !!o.weekly_digest;
  return f;
}
