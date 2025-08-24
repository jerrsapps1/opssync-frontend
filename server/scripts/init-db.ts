import { ensureSchema, createDefaultOrgAndOwner } from "../startup";

async function initDatabase() {
  try {
    await ensureSchema();
    await createDefaultOrgAndOwner();
    console.log("Database initialization complete");
    process.exit(0);
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  }
}

initDatabase();