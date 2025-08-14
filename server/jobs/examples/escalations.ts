import { shouldRunForTenant } from "../utils/checkTenantFeature";
import { getAllTenants } from "../../utils/tenants";
import { runEscalationsForTenant } from "../../services/escalations";

export async function runEscalationsJob() {
  const tenants = await getAllTenants();
  for (const t of tenants) {
    if (!(await shouldRunForTenant(t.id, "ESCALATIONS"))) continue;
    await runEscalationsForTenant(t.id);
  }
}
