import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { Pool } from 'pg';

// Mock data for testing
const mockAnalyticsData = {
  projects: [
    { id: 'p1', name: 'Project Alpha', status: 'active', progress: 75 },
    { id: 'p2', name: 'Project Beta', status: 'completed', progress: 100 },
    { id: 'p3', name: 'Project Gamma', status: 'active', progress: 25 }
  ],
  employees: [
    { id: 'e1', name: 'John Doe', currentProjectId: 'p1' },
    { id: 'e2', name: 'Jane Smith', currentProjectId: 'p2' },
    { id: 'e3', name: 'Bob Wilson', currentProjectId: null }
  ],
  equipment: [
    { id: 'eq1', name: 'Excavator A', currentProjectId: 'p1' },
    { id: 'eq2', name: 'Bulldozer B', currentProjectId: null },
    { id: 'eq3', name: 'Crane C', currentProjectId: 'p3' }
  ]
};

describe('Analytics API Tests', () => {
  let app: any;
  let pool: Pool;

  beforeAll(async () => {
    // Initialize test database connection
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/stafftrak_test'
    });
    
    // Import app after setting up test environment
    const { createTestApp } = await import('../../server/test-utils');
    app = await createTestApp();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /api/analytics/overview', () => {
    it('should return analytics overview with default 30-day period', async () => {
      const response = await request(app)
        .get('/api/analytics/overview')
        .expect(200);

      expect(response.body).toHaveProperty('projects');
      expect(response.body).toHaveProperty('utilization');
      expect(response.body).toHaveProperty('equipment');
      expect(response.body).toHaveProperty('period_days', 30);

      // Validate projects metrics
      expect(response.body.projects).toHaveProperty('total_projects');
      expect(response.body.projects).toHaveProperty('completed_projects');
      expect(response.body.projects).toHaveProperty('active_projects');

      // Validate utilization metrics
      expect(response.body.utilization).toHaveProperty('total_employees');
      expect(response.body.utilization).toHaveProperty('assigned_employees');

      // Validate equipment metrics
      expect(response.body.equipment).toHaveProperty('total_equipment');
      expect(response.body.equipment).toHaveProperty('assigned_equipment');
    });

    it('should return analytics for custom time period', async () => {
      const response = await request(app)
        .get('/api/analytics/overview?days=7')
        .expect(200);

      expect(response.body.period_days).toBe(7);
    });

    it('should handle invalid time period gracefully', async () => {
      const response = await request(app)
        .get('/api/analytics/overview?days=invalid')
        .expect(200);

      expect(response.body.period_days).toBe(30); // Should default to 30
    });

    it('should return numeric values for all metrics', async () => {
      const response = await request(app)
        .get('/api/analytics/overview')
        .expect(200);

      const { projects, utilization, equipment } = response.body;

      // All values should be numeric (string numbers from SQL are acceptable)
      expect(typeof projects.total_projects).toMatch(/string|number/);
      expect(typeof utilization.total_employees).toMatch(/string|number/);
      expect(typeof equipment.total_equipment).toMatch(/string|number/);
    });
  });

  describe('GET /api/analytics/trends', () => {
    it('should return trend data for projects over time', async () => {
      const response = await request(app)
        .get('/api/analytics/trends?type=projects&days=30')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const trendData = response.body[0];
        expect(trendData).toHaveProperty('date');
        expect(trendData).toHaveProperty('value');
      }
    });

    it('should return utilization trends', async () => {
      const response = await request(app)
        .get('/api/analytics/trends?type=utilization&days=14')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle invalid trend type', async () => {
      const response = await request(app)
        .get('/api/analytics/trends?type=invalid')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Analytics Data Accuracy', () => {
    it('should calculate utilization rates correctly', async () => {
      const response = await request(app)
        .get('/api/analytics/overview')
        .expect(200);

      const { utilization } = response.body;
      const totalEmployees = parseInt(utilization.total_employees);
      const assignedEmployees = parseInt(utilization.assigned_employees);

      // Assigned should never exceed total
      expect(assignedEmployees).toBeLessThanOrEqual(totalEmployees);

      // Values should be non-negative
      expect(totalEmployees).toBeGreaterThanOrEqual(0);
      expect(assignedEmployees).toBeGreaterThanOrEqual(0);
    });

    it('should maintain data consistency between endpoints', async () => {
      const overviewResponse = await request(app)
        .get('/api/analytics/overview')
        .expect(200);

      const projectsResponse = await request(app)
        .get('/api/projects')
        .expect(200);

      const totalFromOverview = parseInt(overviewResponse.body.projects.total_projects);
      const totalFromProjects = projectsResponse.body.length;

      expect(totalFromOverview).toBe(totalFromProjects);
    });
  });

  describe('Performance Tests', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/analytics/overview')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should respond within 1 second
      expect(responseTime).toBeLessThan(1000);
    });

    it('should handle concurrent requests', async () => {
      const promises = Array(5).fill(null).map(() => 
        request(app).get('/api/analytics/overview')
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('projects');
      });
    });
  });
});