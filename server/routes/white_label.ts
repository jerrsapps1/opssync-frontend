import { Router } from "express";
import pg from "pg";
import { requireOrgAdmin } from "../middleware/authz";

const router = Router();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

router.get("/", requireOrgAdmin, async (req, res) => {
  const user = (req as any).user || {}; const tenantId = user?.tenantId;
  if (!tenantId) return res.status(400).send("Missing tenant");
  const ent = await pool.query(`select white_label_enabled from org_entitlements where tenant_id=$1`, [tenantId]);
  if (!ent.rows[0]?.white_label_enabled) return res.status(403).send("White label not enabled for this org");
  const { rows } = await pool.query(`select custom_domain, from_email, domain_dns_status, email_spf_dkim_status from org_white_label where tenant_id=$1`, [tenantId]);
  res.json(rows[0] || { custom_domain: "", from_email: "", domain_dns_status: "pending", email_spf_dkim_status: "pending" });
});

router.post("/", requireOrgAdmin, async (req, res) => {
  const user = (req as any).user || {}; const tenantId = user?.tenantId;
  if (!tenantId) return res.status(400).send("Missing tenant");
  const ent = await pool.query(`select white_label_enabled from org_entitlements where tenant_id=$1`, [tenantId]);
  if (!ent.rows[0]?.white_label_enabled) return res.status(403).send("White label not enabled for this org");
  const fields = ["custom_domain","from_email","domain_dns_status","email_spf_dkim_status"];
  const payload: any = {}; for (const f of fields) if (f in req.body) payload[f] = req.body[f];
  const cols = Object.keys(payload);
  if (!cols.length) return res.status(400).send("No fields");
  const insertVals = ["$1"].concat(cols.map((_,i)=>`$${i+2}`)).join(", ");
  const updates = cols.map((k)=> `${k}=EXCLUDED.${k}`).join(", ");
  const vals = cols.map(k=>payload[k]);
  await pool.query(`insert into org_white_label (tenant_id, ${cols.join(",")}) values (${insertVals}) on conflict (tenant_id) do update set ${updates}`, [tenantId, ...vals]);
  res.json({ ok: true });
});

export default router;
