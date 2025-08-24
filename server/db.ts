import pkg from "pg";
const { Pool } = pkg;
const connectionString = process.env.DATABASE_URL || "";
export const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("render.com") ? { rejectUnauthorized: false } : undefined
});
export async function query<T=any>(text: string, params?: any[]) {
  return pool.query<T>(text, params);
}