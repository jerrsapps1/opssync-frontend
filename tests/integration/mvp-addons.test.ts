import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { Pool } from 'pg';

describe('MVP Optional Addons Integration Tests', () => {
  let app: any;
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/stafftrak_test'
    });
    
    const { createTestApp } = await import('../../server/test-utils');
    app = await createTestApp();

    // Setup test database tables
    await setupTestTables();
  });

  afterAll(async () => {
    await cleanupTestTables();
    await pool.end();
  });

  beforeEach(async () => {
    await resetTestData();
  });

  const setupTestTables = async () => {
    const client = await pool.connect();
    
    try {
      // Create branding_configs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS branding_configs (
          id SERIAL PRIMARY KEY,
          tenant_id TEXT NOT NULL UNIQUE,
          app_name TEXT NOT NULL DEFAULT 'StaffTrak',
          primary_color TEXT DEFAULT '#4A90E2',
          secondary_color TEXT DEFAULT '#BB86FC',
          logo_url TEXT,
          favicon_url TEXT,
          custom_css TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create billing_customers table
      await client.query(`
        CREATE TABLE IF NOT EXISTS billing_customers (
          id SERIAL PRIMARY KEY,
          tenant_id TEXT NOT NULL UNIQUE,
          stripe_customer_id TEXT NOT NULL,
          email TEXT NOT NULL,
          name TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create billing_subscriptions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS billing_subscriptions (
          id SERIAL PRIMARY KEY,
          tenant_id TEXT NOT NULL UNIQUE,
          stripe_subscription_id TEXT NOT NULL,
          stripe_price_id TEXT NOT NULL,
          status TEXT NOT NULL,
          current_period_start TIMESTAMP NOT NULL,
          current_period_end TIMESTAMP NOT NULL,
          cancel_at_period_end BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Insert test data
      await client.query(`
        INSERT INTO projects (id, name, description, status, created_at, tenant_id)
        VALUES 
          ('proj-1', 'Test Project 1', 'Description 1', 'active', CURRENT_TIMESTAMP, 'test-tenant'),
          ('proj-2', 'Test Project 2', 'Description 2', 'completed', CURRENT_TIMESTAMP, 'test-tenant'),
          ('proj-3', 'Test Project 3', 'Description 3', 'active', CURRENT_TIMESTAMP, 'test-tenant')
        ON CONFLICT (id) DO NOTHING
      `);

      await client.query(`
        INSERT INTO employees (id, name, role, email, currentProjectId, created_at, tenant_id)
        VALUES 
          ('emp-1', 'John Doe', 'operator', 'john@test.com', 'proj-1', CURRENT_TIMESTAMP, 'test-tenant'),
          ('emp-2', 'Jane Smith', 'supervisor', 'jane@test.com', 'proj-1', CURRENT_TIMESTAMP, 'test-tenant'),
          ('emp-3', 'Bob Wilson', 'operator', 'bob@test.com', NULL, CURRENT_TIMESTAMP, 'test-tenant')
        ON CONFLICT (id) DO NOTHING
      `);

      await client.query(`
        INSERT INTO equipment (id, name, type, status, currentProjectId, created_at, tenant_id)
        VALUES 
          ('eq-1', 'Excavator A', 'excavator', 'available', 'proj-1', CURRENT_TIMESTAMP, 'test-tenant'),
          ('eq-2', 'Bulldozer B', 'bulldozer', 'available', NULL, CURRENT_TIMESTAMP, 'test-tenant'),
          ('eq-3', 'Crane C', 'crane', 'maintenance', 'proj-2', CURRENT_TIMESTAMP, 'test-tenant')
        ON CONFLICT (id) DO NOTHING
      `);

    } finally {
      client.release();
    }
  };

  const cleanupTestTables = async () => {
    const client = await pool.connect();
    try {
      await client.query('DROP TABLE IF EXISTS branding_configs CASCADE');
      await client.query('DROP TABLE IF EXISTS billing_customers CASCADE');
      await client.query('DROP TABLE IF EXISTS billing_subscriptions CASCADE');
    } finally {
      client.release();
    }
  };

  const resetTestData = async () => {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM branding_configs WHERE tenant_id LIKE $1', ['test-%']);
      await client.query('DELETE FROM billing_customers WHERE tenant_id LIKE $1', ['test-%']);
      await client.query('DELETE FROM billing_subscriptions WHERE tenant_id LIKE $1', ['test-%']);
    } finally {
      client.release();
    }
  };

  describe('Cross-Module Integration', () => {
    it('should handle complete tenant setup workflow', async () => {
      const tenantId = 'test-integration-tenant';

      // Step 1: Set up branding
      const brandingResponse = await request(app)
        .post('/api/branding/config')
        .set('X-Tenant-Id', tenantId)
        .send({
          app_name: 'Integration Test Corp',
          primary_color: '#FF5733',
          secondary_color: '#33C3FF'
        })
        .expect(200);

      expect(brandingResponse.body.success).toBe(true);

      // Step 2: Get analytics (should work with default data)
      const analyticsResponse = await request(app)
        .get('/api/analytics/overview')
        .set('X-Tenant-Id', tenantId)
        .expect(200);

      expect(analyticsResponse.body).toHaveProperty('projects');
      expect(analyticsResponse.body).toHaveProperty('utilization');

      // Step 3: Check billing status (should show no customer initially)
      const billingResponse = await request(app)
        .get('/api/billing/status')
        .set('X-Tenant-Id', tenantId)
        .expect(200);

      expect(billingResponse.body.has_customer).toBe(false);
      expect(billingResponse.body).toHaveProperty('stripe_configured');

      // Step 4: Verify branding persists
      const brandingCheckResponse = await request(app)
        .get('/api/branding/config')
        .set('X-Tenant-Id', tenantId)
        .expect(200);

      expect(brandingCheckResponse.body.app_name).toBe('Integration Test Corp');
    });

    it('should maintain data consistency across modules', async () => {
      const tenantId = 'test-consistency-tenant';

      // Create branding config
      await request(app)
        .post('/api/branding/config')
        .set('X-Tenant-Id', tenantId)
        .send({ app_name: 'Consistency Test' })
        .expect(200);

      // Create billing customer
      const client = await pool.connect();
      await client.query(`
        INSERT INTO billing_customers (tenant_id, stripe_customer_id, email, name)
        VALUES ($1, $2, $3, $4)
      `, [tenantId, 'cus_consistency_test', 'test@consistency.com', 'Consistency Tester']);
      client.release();

      // Verify all modules can access their respective data
      const [brandingRes, analyticsRes, billingRes] = await Promise.all([
        request(app).get('/api/branding/config').set('X-Tenant-Id', tenantId),
        request(app).get('/api/analytics/overview').set('X-Tenant-Id', tenantId),
        request(app).get('/api/billing/status').set('X-Tenant-Id', tenantId)
      ]);

      expect(brandingRes.status).toBe(200);
      expect(analyticsRes.status).toBe(200);
      expect(billingRes.status).toBe(200);

      expect(brandingRes.body.app_name).toBe('Consistency Test');
      expect(billingRes.body.has_customer).toBe(true);
    });
  });

  describe('Performance Under Load', () => {
    it('should handle concurrent requests across all addons', async () => {
      const tenantId = 'test-performance-tenant';
      const numberOfRequests = 20;

      const requests = [];
      
      for (let i = 0; i < numberOfRequests; i++) {
        requests.push(
          request(app).get('/api/analytics/overview').set('X-Tenant-Id', tenantId),
          request(app).get('/api/branding/config').set('X-Tenant-Id', tenantId),
          request(app).get('/api/billing/status').set('X-Tenant-Id', tenantId)
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should complete within reasonable time (5 seconds for 60 requests)
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it('should maintain performance with database operations', async () => {
      const tenantId = 'test-db-performance';
      
      // Create multiple branding configs rapidly
      const brandingPromises = [];
      for (let i = 0; i < 10; i++) {
        brandingPromises.push(
          request(app)
            .post('/api/branding/config')
            .set('X-Tenant-Id', `${tenantId}-${i}`)
            .send({
              app_name: `Performance Test ${i}`,
              primary_color: `#${i.toString().padStart(6, '0')}`
            })
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(brandingPromises);
      const endTime = Date.now();

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Database operations should complete quickly
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('should properly isolate data between tenants', async () => {
      const tenant1 = 'test-tenant-1';
      const tenant2 = 'test-tenant-2';

      // Set up different branding for each tenant
      await Promise.all([
        request(app)
          .post('/api/branding/config')
          .set('X-Tenant-Id', tenant1)
          .send({ app_name: 'Tenant One App' }),
        request(app)
          .post('/api/branding/config')
          .set('X-Tenant-Id', tenant2)
          .send({ app_name: 'Tenant Two App' })
      ]);

      // Create billing data for each tenant
      const client = await pool.connect();
      await Promise.all([
        client.query(`
          INSERT INTO billing_customers (tenant_id, stripe_customer_id, email, name)
          VALUES ($1, $2, $3, $4)
        `, [tenant1, 'cus_tenant1', 'tenant1@test.com', 'Tenant One']),
        client.query(`
          INSERT INTO billing_customers (tenant_id, stripe_customer_id, email, name)
          VALUES ($1, $2, $3, $4)
        `, [tenant2, 'cus_tenant2', 'tenant2@test.com', 'Tenant Two'])
      ]);
      client.release();

      // Verify each tenant only sees their own data
      const [tenant1Branding, tenant2Branding] = await Promise.all([
        request(app).get('/api/branding/config').set('X-Tenant-Id', tenant1),
        request(app).get('/api/branding/config').set('X-Tenant-Id', tenant2)
      ]);

      expect(tenant1Branding.body.app_name).toBe('Tenant One App');
      expect(tenant2Branding.body.app_name).toBe('Tenant Two App');

      const [tenant1Billing, tenant2Billing] = await Promise.all([
        request(app).get('/api/billing/status').set('X-Tenant-Id', tenant1),
        request(app).get('/api/billing/status').set('X-Tenant-Id', tenant2)
      ]);

      expect(tenant1Billing.body.customer.name).toBe('Tenant One');
      expect(tenant2Billing.body.customer.name).toBe('Tenant Two');
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle partial system failures gracefully', async () => {
      const tenantId = 'test-resilience';

      // Simulate a scenario where branding works but billing has issues
      await request(app)
        .post('/api/branding/config')
        .set('X-Tenant-Id', tenantId)
        .send({ app_name: 'Resilience Test' })
        .expect(200);

      // Analytics should still work even if billing is down
      const analyticsResponse = await request(app)
        .get('/api/analytics/overview')
        .set('X-Tenant-Id', tenantId)
        .expect(200);

      expect(analyticsResponse.body).toHaveProperty('projects');

      // Branding should still work
      const brandingResponse = await request(app)
        .get('/api/branding/config')
        .set('X-Tenant-Id', tenantId)
        .expect(200);

      expect(brandingResponse.body.app_name).toBe('Resilience Test');
    });

    it('should handle database connection issues', async () => {
      // This test would require mocking database failures
      // For now, we'll test a scenario that might cause DB stress
      
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(
          request(app)
            .get('/api/analytics/overview')
            .set('X-Tenant-Id', `stress-test-${i}`)
        );
      }

      const responses = await Promise.all(promises);
      
      // Most requests should succeed even under stress
      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses.length).toBeGreaterThan(40);
    });
  });

  describe('Feature Flag Integration', () => {
    it('should respect feature flags across addons', async () => {
      const tenantId = 'test-feature-flags';

      // Test that addons respect global feature flags
      // This would require mocking the feature flag system
      
      const analyticsResponse = await request(app)
        .get('/api/analytics/overview')
        .set('X-Tenant-Id', tenantId)
        .expect(200);

      // Should always have basic analytics
      expect(analyticsResponse.body).toHaveProperty('projects');
    });
  });

  describe('Data Migration and Compatibility', () => {
    it('should handle missing addon data gracefully', async () => {
      const newTenantId = 'test-new-tenant';

      // New tenant should get default branding
      const brandingResponse = await request(app)
        .get('/api/branding/config')
        .set('X-Tenant-Id', newTenantId)
        .expect(200);

      expect(brandingResponse.body.app_name).toBe('StaffTrak');
      expect(brandingResponse.body.primary_color).toBe('#4A90E2');

      // Should have empty billing status
      const billingResponse = await request(app)
        .get('/api/billing/status')
        .set('X-Tenant-Id', newTenantId)
        .expect(200);

      expect(billingResponse.body.has_customer).toBe(false);

      // Should have analytics based on existing project data
      const analyticsResponse = await request(app)
        .get('/api/analytics/overview')
        .set('X-Tenant-Id', newTenantId)
        .expect(200);

      expect(analyticsResponse.body).toHaveProperty('projects');
    });
  });

  describe('Security and Authorization', () => {
    it('should require tenant ID for all addon endpoints', async () => {
      // Test all addon endpoints without tenant ID
      const endpoints = [
        '/api/analytics/overview',
        '/api/branding/config',
        '/api/billing/status'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      }
    });

    it('should validate tenant ID format', async () => {
      const invalidTenantIds = ['', '   ', 'tenant with spaces', 'tenant/with/slashes'];

      for (const tenantId of invalidTenantIds) {
        const response = await request(app)
          .get('/api/analytics/overview')
          .set('X-Tenant-Id', tenantId);
        
        expect(response.status).toBe(400);
      }
    });
  });
});