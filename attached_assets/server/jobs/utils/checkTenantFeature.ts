import { resolveTenantFeatures } from "../../utils/tenant_features";
import { getNotificationPrefs } from "../../utils/notification_prefs";

/**
 * Checks whether a tenant has a given feature and relevant notification prefs enabled.
 * @param tenantId - the tenant ID
 * @param feature - one of "REMINDERS" | "ESCALATIONS" | "WEEKLY_DIGEST"
 * @returns boolean indicating if job should run for this tenant
 */
export async function shouldRunForTenant(tenantId: string, feature: "REMINDERS" | "ESCALATIONS" | "WEEKLY_DIGEST"): Promise<boolean> {
  const features = await resolveTenantFeatures(tenantId);
  if (!features[feature]) return false;
  const prefs = await getNotificationPrefs(tenantId);
  switch (feature) {
    case "REMINDERS":
      return prefs.email_enabled || prefs.sms_enabled;
    case "ESCALATIONS":
      return prefs.email_enabled || prefs.sms_enabled;
    case "WEEKLY_DIGEST":
      return prefs.weekly_digest && prefs.email_enabled;
    default:
      return false;
  }
}
