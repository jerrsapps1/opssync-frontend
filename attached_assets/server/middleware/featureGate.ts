import { Request, Response, NextFunction } from "express";
import { resolveTenantFeatures } from "../utils/tenant_features";

/**
 * Gate an API by a tenant feature.
 * Usage:
 *   app.use("/api/manager", featureGate("MANAGER", "SLA"), managerRouter);
 * If any of the listed features are enabled, access is allowed.
 */
export function featureGate(...required: Array<"SUPERVISOR" | "MANAGER" | "SLA" | "REMINDERS" | "ESCALATIONS" | "WEEKLY_DIGEST">) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user || {};
      const tenantId = user?.tenantId;
      if (!tenantId) return res.status(400).send("Missing tenant");
      const ft = await resolveTenantFeatures(tenantId);
      const ok = required.some((k) => (ft as any)[k]);
      if (!ok) return res.status(403).send("Feature disabled for tenant");
      return next();
    } catch (e: any) {
      return res.status(500).send(e?.message || "featureGate error");
    }
  };
}
