import pg from "pg";
import { features as envFeatures } from "../config/features";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export type GlobalFeatures = {
  SUPERVISOR: boolean;
  MANAGER: boolean;
  SLA: boolean;
  REMINDERS: boolean;
  ESCALATIONS: boolean;
  WEEKLY_DIGEST: boolean;
};

export async function resolveGlobalFeatures(): Promise<GlobalFeatures> {
  // Start with environment defaults
  const features = {
    SUPERVISOR: envFeatures.SUPERVISOR,
    MANAGER: envFeatures.MANAGER,
    SLA: envFeatures.SLA,
    REMINDERS: envFeatures.REMINDERS,
    ESCALATIONS: envFeatures.ESCALATIONS,
    WEEKLY_DIGEST: envFeatures.WEEKLY_DIGEST,
  };

  try {
    // Override with global_features table values
    const { rows } = await pool.query(`
      select key, value from global_features
      where key in ('SUPERVISOR', 'MANAGER', 'SLA', 'REMINDERS', 'ESCALATIONS', 'WEEKLY_DIGEST')
    `);

    for (const row of rows) {
      if (row.key in features) {
        (features as any)[row.key] = row.value;
      }
    }

    return features;
  } catch (error) {
    console.error('Error resolving global features:', error);
    return features;
  }
}

export async function setGlobalFeature(key: string, value: boolean): Promise<void> {
  try {
    await pool.query(`
      insert into global_features (key, value)
      values ($1, $2)
      on conflict (key) do update set
        value = excluded.value,
        updated_at = now()
    `, [key, value]);
  } catch (error) {
    console.error('Error updating global feature:', error);
    throw error;
  }
}

export async function getGlobalFeatures(): Promise<Record<string, boolean>> {
  try {
    const { rows } = await pool.query(`
      select key, value from global_features
      order by key
    `);

    const result: Record<string, boolean> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }

    return result;
  } catch (error) {
    console.error('Error getting global features:', error);
    return {};
  }
}