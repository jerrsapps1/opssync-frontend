import { Router } from "express";
import pg from "pg";

const { Pool } = pg;
const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Get current branding configuration
router.get("/config", async (req, res) => {
  try {
    const tenantId = req.headers["x-tenant-id"] || "default-tenant";
    
    const client = await pool.connect();
    const result = await client.query(
      "SELECT * FROM branding_configs WHERE tenant_id = $1",
      [tenantId]
    );
    client.release();
    
    if (result.rows.length === 0) {
      // Return default branding
      const defaultBranding = {
        app_name: "OpsSync.ai",
        primary_color: "#4A90E2",
        secondary_color: "#BB86FC",
        logo_url: null,
        favicon_url: null,
        custom_css: null
      };
      return res.json(defaultBranding);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get branding config error:", error);
    res.status(500).json({ error: "Failed to fetch branding configuration" });
  }
});

// Update branding configuration
router.put("/config", async (req, res) => {
  try {
    const tenantId = req.headers["x-tenant-id"] || "default-tenant";
    const { app_name, primary_color, secondary_color, logo_url, favicon_url, custom_css } = req.body;
    
    const client = await pool.connect();
    const result = await client.query(`
      INSERT INTO branding_configs (tenant_id, app_name, primary_color, secondary_color, logo_url, favicon_url, custom_css, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (tenant_id) 
      DO UPDATE SET 
        app_name = EXCLUDED.app_name,
        primary_color = EXCLUDED.primary_color,
        secondary_color = EXCLUDED.secondary_color,
        logo_url = EXCLUDED.logo_url,
        favicon_url = EXCLUDED.favicon_url,
        custom_css = EXCLUDED.custom_css,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [tenantId, app_name, primary_color, secondary_color, logo_url, favicon_url, custom_css]);
    
    client.release();
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update branding config error:", error);
    res.status(500).json({ error: "Failed to update branding configuration" });
  }
});

// Upload logo endpoint (would integrate with object storage)
router.post("/upload-logo", async (req, res) => {
  try {
    // This would integrate with the object storage system
    // For now, return a placeholder response
    res.json({ 
      success: true, 
      logo_url: "/api/branding/logo/placeholder.png",
      message: "Logo upload functionality requires object storage integration" 
    });
  } catch (error) {
    console.error("Logo upload error:", error);
    res.status(500).json({ error: "Failed to upload logo" });
  }
});

export default router;