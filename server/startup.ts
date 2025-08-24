import { query } from "./db";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function ensureSchema() {
  const sql = await (await import("fs/promises")).readFile(process.cwd()+"/server/schema.sql","utf-8");
  await query(sql);
}

export async function createDefaultOrgAndOwner() {
  const orgName = process.env.ORG_NAME || "OpsSync";
  const ownerEmail = process.env.OWNER_EMAIL || "owner@example.com";
  const ownerPassword = process.env.OWNER_PASSWORD || "Admin123!";

  const org = await query("SELECT * FROM organizations LIMIT 1");
  if (org.rows.length === 0) {
    const orgId = crypto.randomUUID();
    await query(
      "INSERT INTO organizations (id, name, plan, seat_limit) VALUES ($1,$2,$3,$4)",
      [orgId, orgName, "single", 1]
    );
    const hash = await bcrypt.hash(ownerPassword, 10);
    await query(
      "INSERT INTO users (id, org_id, email, name, password_hash, role) VALUES ($1,$2,$3,$4,$5,$6)",
      [crypto.randomUUID(), orgId, ownerEmail, "Owner", hash, "owner"]
    );
    console.log("Created default organization and owner:", ownerEmail);
  }
}

export async function getOrg() {
  const res = await query(
    "SELECT o.*, (SELECT COUNT(*)::int FROM users WHERE org_id = o.id) as seats_used FROM organizations o LIMIT 1"
  );
  return res.rows[0];
}

export async function updatePlan(plan: "single"|"five"|"ten") {
  const seat_limit = plan === "single" ? 1 : (plan === "five" ? 5 : 10);
  const org = await getOrg();
  await query(
    "UPDATE organizations SET plan=$1, seat_limit=$2 WHERE id=$3",
    [plan, seat_limit, org.id]
  );
  return getOrg();
}