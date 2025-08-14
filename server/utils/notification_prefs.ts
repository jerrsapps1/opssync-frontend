import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export type NotificationPrefs = {
  email_enabled: boolean;
  sms_enabled: boolean;
  daily_digest: boolean;
  weekly_digest: boolean;
  timezone: string | null;
  escalation_after_hours: number;
};

export async function getNotificationPrefs(tenantId: string): Promise<NotificationPrefs> {
  try {
    const { rows } = await pool.query<NotificationPrefs>(`
      select email_enabled, sms_enabled, daily_digest, weekly_digest, timezone, escalation_after_hours
      from notification_prefs where tenant_id=$1
    `, [tenantId]);
    
    if (!rows.length) {
      // Default preferences for development
      return { 
        email_enabled: true, 
        sms_enabled: false, 
        daily_digest: false, 
        weekly_digest: true, 
        timezone: "America/Chicago", 
        escalation_after_hours: 4 
      };
    }
    return rows[0];
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    // Return safe defaults
    return { 
      email_enabled: true, 
      sms_enabled: false, 
      daily_digest: false, 
      weekly_digest: true, 
      timezone: "America/Chicago", 
      escalation_after_hours: 4 
    };
  }
}