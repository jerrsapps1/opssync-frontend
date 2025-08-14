import { shouldRunForTenant } from "../utils/checkTenantFeature";
import { getAllTenants } from "../../utils/tenants";
import { sendRemindersForTenant } from "../../services/reminders";

export async function runRemindersJob() {
  const tenants = await getAllTenants();
  for (const t of tenants) {
    if (!(await shouldRunForTenant(t.id, "REMINDERS"))) continue;
    await sendRemindersForTenant(t.id);
  }
}
