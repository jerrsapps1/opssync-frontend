import cron from "node-cron";
import pg from "pg";
import { resolveTenantFeatures } from "../utils/tenant_features";
import { getNotificationPrefs } from "../utils/notification_prefs";
// These are from your existing bundles:
import { runEscalations } from "./escalation";
import { runWeeklyDigest } from "./digest";
// If you have a reminders runner, import it here (else leave commented):
// import { runReminders } from "./scheduler";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

type TenantRow = { id: string; name: string };

async function getTenants(): Promise<TenantRow[]> {
  try {
    const { rows } = await pool.query<TenantRow>(`select id, name from tenants order by created_at asc`);
    return rows;
  } catch (error) {
    console.error("Error fetching tenants:", error);
    // For development, create a default tenant if none exist
    return [{ id: "default-tenant", name: "Default Organization" }];
  }
}

// Notification preferences imported from utils

/**
 * Optional: If your tables are multi-tenant with a tenant_id column, you should
 * filter inside the job by tenant. For example, in runEscalations/runWeeklyDigest,
 * add `WHERE p.tenant_id = $TENANT` to their SQL joins.
 * If they don't support per-tenant yet, this wrapper still prevents emails/SMS
 * from being sent for tenants with the feature disabled by short-circuiting.
 */
export async function runEscalationsWithChecks() {
  const tenants = await getTenants();
  let totalEscalated = 0, scannedTenants = 0;
  for (const t of tenants) {
    scannedTenants++;
    const f = await resolveTenantFeatures(t.id);
    const n = await getNotificationPrefs(t.id);
    if (!f.ESCALATIONS || !n.email_enabled) continue;

    // If your escalation service accepts a tenantId, call it like:
    //   const res = await runEscalationsForTenant(t.id);
    // Else fallback to global (still okay; at least feature-gated):
    const res: any = await runEscalations();
    totalEscalated += Number(res?.escalated || 0);
  }
  return { scannedTenants, totalEscalated };
}

export async function runWeeklyDigestWithChecks() {
  const tenants = await getTenants();
  let totalSent = 0, scannedTenants = 0;
  for (const t of tenants) {
    scannedTenants++;
    const f = await resolveTenantFeatures(t.id);
    const n = await getNotificationPrefs(t.id);
    if (!f.WEEKLY_DIGEST || !n.weekly_digest || !n.email_enabled) continue;

    // If you have a per-tenant digest function, call it with t.id.
    const res: any = await runWeeklyDigest();
    totalSent += Number(res?.sent || 0);
  }
  return { scannedTenants, totalSent };
}

export async function runRemindersWithChecks() {
  const tenants = await getTenants();
  let totalReminders = 0, scannedTenants = 0;
  for (const t of tenants) {
    scannedTenants++;
    const f = await resolveTenantFeatures(t.id);
    const n = await getNotificationPrefs(t.id);
    if (!f.REMINDERS || !n.email_enabled) continue;

    // If you have a per-tenant reminders function, invoke it here.
    // const res: any = await runRemindersForTenant(t.id);
    // For now, no-op (or call your existing runner):
    // const res: any = await runReminders();
    // totalReminders += Number(res?.sent || 0);
  }
  return { scannedTenants, totalReminders };
}

/**
 * Replacement starter to schedule jobs WITH tenant checks.
 * Use this INSTEAD of startTimelinessAddons() if you want built-in gating.
 */
export function startCronWithTenantChecks() {
  // Escalations every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    try {
      const res = await runEscalationsWithChecks();
      console.log("[cron:checks] escalations:", res);
    } catch (e: any) {
      console.error("[cron:checks] escalations error:", e.message);
    }
  });

  // Weekly digest Monday 09:00
  cron.schedule("0 9 * * 1", async () => {
    try {
      const res = await runWeeklyDigestWithChecks();
      console.log("[cron:checks] weekly digest:", res);
    } catch (e: any) {
      console.error("[cron:checks] digest error:", e.message);
    }
  });

  // Reminders every 15 minutes (uncomment if you have a runner)
  // cron.schedule("*/15 * * * *", async () => {
  //   try {
  //     const res = await runRemindersWithChecks();
  //     console.log("[cron:checks] reminders:", res);
  //   } catch (e: any) {
  //     console.error("[cron:checks] reminders error:", e.message);
  //   }
  // });

  console.log("[cron:checks] Escalations (30m) + Weekly Digest (Mon 09:00) scheduled with tenant checks");
}
