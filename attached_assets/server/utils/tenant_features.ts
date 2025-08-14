import { Pool } from "pg";
import { getGlobalFeatures } from "./global_features";

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
  const base = await getGlobalFeatures();
  if (!tenantId) return base as TenantFeatures;
  const { rows } = await pool.query(`
    select supervisor, manager, sla, reminders, escalations, weekly_digest
    from feature_overrides where tenant_id=$1
  `, [tenantId]);
  if (!rows.length) return base as TenantFeatures;
  const o = rows[0];
  const f: any = { ...base };
  if (o.supervisor !== null && o.supervisor !== undefined) f.SUPERVISOR = !!o.supervisor;
  if (o.manager !== null && o.manager !== undefined) f.MANAGER = !!o.manager;
  if (o.sla !== null && o.sla !== undefined) f.SLA = !!o.sla;
  if (o.reminders !== null && o.reminders !== undefined) f.REMINDERS = !!o.reminders;
  if (o.escalations !== null && o.escalations !== undefined) f.ESCALATIONS = !!o.escalations;
  if (o.weekly_digest !== null && o.weekly_digest !== undefined) f.WEEKLY_DIGEST = !!o.weekly_digest;
  return f as TenantFeatures;
}
