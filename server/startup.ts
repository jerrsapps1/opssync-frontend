import { query } from "./db";
import * as fs from "fs";
import * as path from "path";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export async function ensureSchema() {
  const schemaPath = path.join(process.cwd(), "server", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  await query(schema);
  console.log("Database schema ensured");
}

export async function createDefaultOrgAndOwner() {
  const orgName = process.env.ORG_NAME || "OpsSync";
  const ownerEmail = process.env.OWNER_EMAIL || "owner@example.com";
  const ownerPassword = process.env.OWNER_PASSWORD || "Admin123!";

  try {
    // Check if org exists
    const orgResult = await query("SELECT id FROM organizations LIMIT 1");
    if (orgResult.rows.length > 0) {
      console.log("Default organization already exists");
      return;
    }

    // Create organization
    const orgId = uuidv4();
    await query(
      "INSERT INTO organizations (id, name, plan, seat_limit) VALUES ($1, $2, $3, $4)",
      [orgId, orgName, "single", 1]
    );

    // Create owner user
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(ownerPassword, 10);
    await query(
      "INSERT INTO users (id, org_id, email, name, password_hash, role) VALUES ($1, $2, $3, $4, $5, $6)",
      [userId, orgId, ownerEmail, "Owner", hashedPassword, "owner"]
    );

    console.log(`Default org '${orgName}' and owner '${ownerEmail}' created`);
  } catch (error) {
    console.error("Error creating default org/owner:", error);
  }
}