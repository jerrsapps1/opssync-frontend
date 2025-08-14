import { Router } from "express";
import pg from "pg";
import { requireRole, requireTenant, getTenantId, AuthenticatedRequest } from "../middleware/authz";

const { Pool } = pg;
const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Get current tenant feature settings
router.get("/features", requireRole(['OWNER', 'ADMIN']), requireTenant(), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    
    const { rows } = await pool.query(`
      select supervisor, manager, sla, reminders, escalations, weekly_digest
      from feature_overrides where tenant_id = $1
    `, [tenantId]);
    
    if (rows.length === 0) {
      // Return defaults if no overrides exist
      return res.json({
        supervisor: null,
        manager: null,
        sla: null,
        reminders: null,
        escalations: null,
        weekly_digest: null
      });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching tenant features:', error);
    res.status(500).json({ error: 'Failed to fetch feature settings' });
  }
});

// Update tenant feature settings
router.put("/features", requireRole(['OWNER', 'ADMIN']), requireTenant(), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { supervisor, manager, sla, reminders, escalations, weekly_digest } = req.body;
    
    // Upsert feature overrides
    await pool.query(`
      insert into feature_overrides (tenant_id, supervisor, manager, sla, reminders, escalations, weekly_digest)
      values ($1, $2, $3, $4, $5, $6, $7)
      on conflict (tenant_id) do update set
        supervisor = excluded.supervisor,
        manager = excluded.manager, 
        sla = excluded.sla,
        reminders = excluded.reminders,
        escalations = excluded.escalations,
        weekly_digest = excluded.weekly_digest,
        updated_at = now()
    `, [tenantId, supervisor, manager, sla, reminders, escalations, weekly_digest]);
    
    res.json({ success: true, message: 'Feature settings updated' });
  } catch (error) {
    console.error('Error updating tenant features:', error);
    res.status(500).json({ error: 'Failed to update feature settings' });
  }
});

// Get notification preferences
router.get("/notifications", requireRole(['OWNER', 'ADMIN']), requireTenant(), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    
    const { rows } = await pool.query(`
      select email_enabled, sms_enabled, daily_digest, weekly_digest, timezone, escalation_after_hours
      from notification_prefs where tenant_id = $1
    `, [tenantId]);
    
    if (rows.length === 0) {
      // Return defaults if no preferences exist
      return res.json({
        email_enabled: true,
        sms_enabled: false,
        daily_digest: false,
        weekly_digest: true,
        timezone: 'America/Chicago',
        escalation_after_hours: 4
      });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ error: 'Failed to fetch notification preferences' });
  }
});

// Update notification preferences
router.put("/notifications", requireRole(['OWNER', 'ADMIN']), requireTenant(), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { email_enabled, sms_enabled, daily_digest, weekly_digest, timezone, escalation_after_hours } = req.body;
    
    // Upsert notification preferences
    await pool.query(`
      insert into notification_prefs (tenant_id, email_enabled, sms_enabled, daily_digest, weekly_digest, timezone, escalation_after_hours)
      values ($1, $2, $3, $4, $5, $6, $7)
      on conflict (tenant_id) do update set
        email_enabled = excluded.email_enabled,
        sms_enabled = excluded.sms_enabled,
        daily_digest = excluded.daily_digest,
        weekly_digest = excluded.weekly_digest,
        timezone = excluded.timezone,
        escalation_after_hours = excluded.escalation_after_hours,
        updated_at = now()
    `, [tenantId, email_enabled, sms_enabled, daily_digest, weekly_digest, timezone, escalation_after_hours]);
    
    res.json({ success: true, message: 'Notification preferences updated' });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

// Get tenant info
router.get("/tenant", requireRole(['OWNER', 'ADMIN']), requireTenant(), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    
    const { rows } = await pool.query(`
      select id, name, slug, created_at from tenants where id = $1
    `, [tenantId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching tenant info:', error);
    res.status(500).json({ error: 'Failed to fetch tenant information' });
  }
});

export default router;