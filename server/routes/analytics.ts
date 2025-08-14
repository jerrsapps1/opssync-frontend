import { Router } from "express";
import pg from "pg";

const { Pool } = pg;
const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Get analytics overview
router.get("/overview", async (req, res) => {
  try {
    const tenantId = req.headers["x-tenant-id"] || "default-tenant";
    const days = parseInt(req.query.days as string) || 30;
    
    const client = await pool.connect();
    
    // Project completion metrics
    const projectsQuery = `
      SELECT 
        COUNT(*) as total_projects,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as active_projects
      FROM projects 
      WHERE tenant_id = $1 
        AND created_at >= NOW() - INTERVAL '${days} days'
    `;
    
    // Employee utilization
    const utilizationQuery = `
      SELECT 
        COUNT(DISTINCT e.id) as total_employees,
        COUNT(DISTINCT CASE WHEN e.current_project_id IS NOT NULL THEN e.id END) as assigned_employees
      FROM employees e
      WHERE e.tenant_id = $1
    `;
    
    // Equipment usage
    const equipmentQuery = `
      SELECT 
        COUNT(DISTINCT eq.id) as total_equipment,
        COUNT(DISTINCT CASE WHEN eq.current_project_id IS NOT NULL THEN eq.id END) as assigned_equipment
      FROM equipment eq
      WHERE eq.tenant_id = $1
    `;
    
    const [projectsResult, utilizationResult, equipmentResult] = await Promise.all([
      client.query(projectsQuery, [tenantId]),
      client.query(utilizationQuery, [tenantId]),
      client.query(equipmentQuery, [tenantId])
    ]);
    
    client.release();
    
    const analytics = {
      projects: projectsResult.rows[0],
      utilization: utilizationResult.rows[0],
      equipment: equipmentResult.rows[0],
      period_days: days
    };
    
    res.json(analytics);
  } catch (error) {
    console.error("Analytics overview error:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// Get usage trends
router.get("/trends", async (req, res) => {
  try {
    const tenantId = req.headers["x-tenant-id"] || "default-tenant";
    const days = parseInt(req.query.days as string) || 30;
    
    const client = await pool.connect();
    
    const trendsQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as projects_created
      FROM projects 
      WHERE tenant_id = $1 
        AND created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `;
    
    const result = await client.query(trendsQuery, [tenantId]);
    client.release();
    
    res.json({ trends: result.rows });
  } catch (error) {
    console.error("Analytics trends error:", error);
    res.status(500).json({ error: "Failed to fetch trends" });
  }
});

export default router;