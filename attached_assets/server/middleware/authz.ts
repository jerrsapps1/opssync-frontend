import { Request, Response, NextFunction } from "express";

/**
 * Minimal helpers to access tenant and require roles.
 * Assumes your auth middleware attaches { userId, role, tenantId } to req.user.
 */

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user || {};
    if (!user || !roles.includes(user.role)) {
      return res.status(403).send("Forbidden");
    }
    next();
  };
}

export function requireTenant(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user || {};
  if (!user?.tenantId) return res.status(400).send("Missing tenant");
  next();
}

export function getTenantId(req: Request): string | null {
  const user = (req as any).user || {};
  return user.tenantId || null;
}
