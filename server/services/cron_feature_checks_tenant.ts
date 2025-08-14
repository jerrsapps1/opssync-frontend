import cron from "node-cron";
import pg from "pg";

const { Pool } = pg;
import { resolveTenantFeatures } from "../utils/tenant_features";
import { runEscalationsForTenant } from "./escalation_tenant";
import { runWeeklyDigestForTenant } from "./digest_tenant";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

type TenantRow = { id: string; name: string };
async function getTenants(): Promise<TenantRow[]> {
  try {
    const { rows } = await pool.query<TenantRow>(`select id, name from tenants order by created_at asc`);
    return rows.length > 0 ? rows : [{ id: "default-tenant", name: "Default Organization" }];
  } catch (error) {
    console.error("Error fetching tenants:", error);
    // For development, create a default tenant if none exist
    return [{ id: "default-tenant", name: "Default Organization" }];
  }
}

async function runEscalationsForAllTenants() {
  const tenants = await getTenants();
  let total = 0;
  for (const t of tenants) {
    const f = await resolveTenantFeatures(t.id);
    if (!f.ESCALATIONS) continue;
    const res = await runEscalationsForTenant(t.id);
    total += Number(res?.escalated || 0);
  }
  console.log("[cron:tenant] escalations total sent:", total);
}

async function runWeeklyDigestForAllTenants() {
  const tenants = await getTenants();
  let total = 0;
  for (const t of tenants) {
    const f = await resolveTenantFeatures(t.id);
    if (!f.WEEKLY_DIGEST) continue;
    const res = await runWeeklyDigestForTenant(t.id);
    total += Number(res?.sent || 0);
  }
  console.log("[cron:tenant] weekly digest total sent:", total);
}

export function startCronPerTenant() {
  // Every 30 min for escalations
  cron.schedule("*/30 * * * *", runEscalationsForAllTenants);
  // Monday 09:00 for weekly digest
  cron.schedule("0 9 * * 1", runWeeklyDigestForAllTenants);
  console.log("[cron:tenant] scheduled escalations + weekly digest with per-tenant runners");
}
