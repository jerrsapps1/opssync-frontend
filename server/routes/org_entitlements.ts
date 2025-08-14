import { Router } from "express";
import pg from "pg";
import { requireOrgAdmin } from "../middleware/authz";

const router = Router();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

router.get("/status", requireOrgAdmin, async (req, res) => {
  const user = (req as any).user || {}; const tenantId = user?.tenantId;
  if (!tenantId) return res.status(400).send("Missing tenant");
  const { rows } = await pool.query(`select branding_enabled, white_label_enabled from org_entitlements where tenant_id=$1`, [tenantId]);
  res.json(rows[0] || { branding_enabled: false, white_label_enabled: false });
});

export default router;
