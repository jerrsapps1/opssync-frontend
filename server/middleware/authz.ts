import { Request, Response, NextFunction } from "express";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    tenantId: string;
    [key: string]: any;
  };
}

export function requireRole(roles: string | string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

export function requireTenant() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user?.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }
    
    next();
  };
}

export function getTenantId(req: AuthenticatedRequest): string | undefined {
  return req.user?.tenantId;
}

// Middleware to check if user has access to tenant features
export function requireTenantFeature(featureName: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant context required' });
      }
      
      const { resolveTenantFeatures } = await import('../utils/tenant_features');
      const features = await resolveTenantFeatures(tenantId);
      
      if (!(features as any)[featureName.toUpperCase()]) {
        return res.status(403).json({ error: `Feature ${featureName} not enabled for this tenant` });
      }
      
      next();
    } catch (error) {
      console.error('Error checking tenant feature:', error);
      res.status(500).json({ error: 'Error checking feature access' });
    }
  };
}

// Mock authentication middleware for development
export function mockAuth() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // For development, simulate a logged-in admin user
    if (!req.user) {
      req.user = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        role: 'OWNER', 
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
        email: 'admin@demo.com'
      };
    }
    next();
  };
}