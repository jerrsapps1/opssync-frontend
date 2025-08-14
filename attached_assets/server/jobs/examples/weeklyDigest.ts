import { shouldRunForTenant } from "../utils/checkTenantFeature";
import { getAllTenants } from "../../utils/tenants";
import { sendWeeklyDigestForTenant } from "../../services/weeklyDigest";

export async function runWeeklyDigestJob() {
  const tenants = await getAllTenants();
  for (const t of tenants) {
    if (!(await shouldRunForTenant(t.id, "WEEKLY_DIGEST"))) continue;
    await sendWeeklyDigestForTenant(t.id);
  }
}
