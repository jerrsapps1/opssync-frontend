import { Pool } from "pg";
import { features as envDefaults } from "../config/features";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export type GlobalFlags = typeof envDefaults;

const keys = ["SUPERVISOR","MANAGER","SLA","REMINDERS","ESCALATIONS","WEEKLY_DIGEST"] as const;

export async function getGlobalFeatures(): Promise<GlobalFlags> {
  const res = await pool.query(`select key, value from global_features where key in (${keys.map((_,i)=>'$'+(i+1)).join(',')})`, keys as any);
  const map = new Map(res.rows.map((r: any) => [String(r.key).toUpperCase(), !!r.value]));
  const out: any = { ...envDefaults };
  for (const k of keys) {
    if (map.has(k)) out[k] = map.get(k);
  }
  return out;
}

export async function setGlobalFeature(key: keyof GlobalFlags, value: boolean) {
  await pool.query(
    `insert into global_features (key, value) values ($1,$2)
     on conflict (key) do update set value=excluded.value`,
    [key, value]
  );
}
