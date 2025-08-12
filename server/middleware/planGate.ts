import { Request, Response, NextFunction } from "express";
import { getByOrgId } from "../stripe/store";

export function planGate(required: "starter"|"growth"|"enterprise") {
  const order = { starter: 1, growth: 2, enterprise: 3 } as const;
  return (req: Request, res: Response, next: NextFunction) => {
    const orgId = (req.headers["x-org-id"] as string) || (req.query.orgId as string) || "demo-org";
    const rec = getByOrgId(orgId);
    if (!rec || !rec.status || rec.status === "canceled" || rec.status === "incomplete") {
      return res.status(402).json({ error: "Subscription required", plan: required });
    }
    if (order[rec.plan ?? "starter"] < order[required]) {
      return res.status(403).json({ error: "Upgrade required", plan: required });
    }
    (req as any).orgId = orgId;
    next();
  };
}
