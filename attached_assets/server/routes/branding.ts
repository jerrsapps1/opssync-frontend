import { Router } from "express";
import { Pool } from "pg";
import { requireAuth } from "../middleware/authz";

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

router.get("/", requireAuth, async (req, res) => {
  const user = (req as any).user || {}; const tenantId = user?.tenantId;
  if (!tenantId) return res.status(400).send("Missing tenant");
  const { rows } = await pool.query("select logo_url, primary_color, accent_color, company_name from org_branding where tenant_id=$1", [tenantId]);
  res.json(rows[0] || { logo_url: "", primary_color: "#111827", accent_color: "#2563eb", company_name: "" });
});

router.post("/", requireAuth, async (req, res) => {
  const user = (req as any).user || {}; const tenantId = user?.tenantId;
  if (!tenantId) return res.status(400).send("Missing tenant");
  const fields = ["logo_url","primary_color","accent_color","company_name"];
  const payload: any = {}; for (const f of fields) if (f in req.body) payload[f] = req.body[f];
  const cols = Object.keys(payload);
  if (!cols.length) return res.status(400).send("No fields");
  const insertVals = ["$1"].concat(cols.map((_,i)=>`$${i+2}`)).join(", ");
  const updates = cols.map((k)=> `${k}=EXCLUDED.${k}`).join(", ");
  const vals = cols.map(k=>payload[k]);
  await pool.query(`insert into org_branding (tenant_id, ${cols.join(",")}) values (${insertVals}) on conflict (tenant_id) do update set ${updates}`, [tenantId, ...vals]);
  res.json({ ok: true });
});

export default router;
