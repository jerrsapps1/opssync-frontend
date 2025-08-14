import { Request, Response, NextFunction } from "express";

/**
 * Assumes upstream auth populates req.user = { id, email, role, tenantId }
 * Roles: OWNER, ADMIN, MANAGER, SUPERVISOR, VIEWER
 */

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user) return res.status(401).send("Unauthorized");
  next();
}

export function requirePlatformOwner(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  const ownerEmail = process.env.OWNER_EMAIL?.toLowerCase();
  if (!user || !user.email || user.email.toLowerCase() !== ownerEmail) {
    return res.status(403).send("Forbidden");
  }
  next();
}

export function requireOrgAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || !["OWNER","ADMIN"].includes(user.role)) {
    return res.status(403).send("Forbidden");
  }
  next();
}

export function requireTenant(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user?.tenantId) return res.status(400).send("Missing tenant");
  next();
}

export function getTenantId(req: Request): string | null {
  const user = (req as any).user || {};
  return user.tenantId || null;
}
