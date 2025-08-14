import pg from "pg";
import { resolveGlobalFeatures } from "./global_features";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export type TenantFeatures = {
  SUPERVISOR: boolean;
  MANAGER: boolean;
  SLA: boolean;
  REMINDERS: boolean;
  ESCALATIONS: boolean;
  WEEKLY_DIGEST: boolean;
};

export async function resolveTenantFeatures(tenantId?: string): Promise<TenantFeatures> {
  // Start with global features (env → global_features table)
  const globalFeatures = await resolveGlobalFeatures();
  const f = {
    SUPERVISOR: globalFeatures.SUPERVISOR,
    MANAGER: globalFeatures.MANAGER,
    SLA: globalFeatures.SLA,
    REMINDERS: globalFeatures.REMINDERS,
    ESCALATIONS: globalFeatures.ESCALATIONS,
    WEEKLY_DIGEST: globalFeatures.WEEKLY_DIGEST,
  };
  
  if (!tenantId) return f;
  
  try {
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
  } catch (error) {
    console.error('Error resolving tenant features:', error);
    return f;
  }
}

export async function getTenantNotificationPrefs(tenantId: string) {
  try {
    const { rows } = await pool.query(`
      select email_enabled, sms_enabled, daily_digest, weekly_digest, 
             timezone, escalation_after_hours
      from notification_prefs where tenant_id = $1
    `, [tenantId]);
    
    return rows[0] || {
      email_enabled: true,
      sms_enabled: false,
      daily_digest: false,
      weekly_digest: true,
      timezone: 'America/Chicago',
      escalation_after_hours: 4
    };
  } catch (error) {
    console.error('Error getting tenant notification prefs:', error);
    return {
      email_enabled: true,
      sms_enabled: false,
      daily_digest: false,
      weekly_digest: true,
      timezone: 'America/Chicago',
      escalation_after_hours: 4
    };
  }
}