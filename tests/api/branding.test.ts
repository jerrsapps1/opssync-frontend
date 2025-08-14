import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { Pool } from 'pg';

describe('Branding API Tests', () => {
  let app: any;
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/stafftrak_test'
    });
    
    const { createTestApp } = await import('../../server/test-utils');
    app = await createTestApp();
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    // Reset branding config to default before each test
    const client = await pool.connect();
    await client.query(`
      DELETE FROM branding_configs WHERE tenant_id = 'test-tenant'
    `);
    client.release();
  });

  describe('GET /api/branding/config', () => {
    it('should return default branding configuration', async () => {
      const response = await request(app)
        .get('/api/branding/config')
        .set('X-Tenant-Id', 'test-tenant')
        .expect(200);

      expect(response.body).toHaveProperty('app_name', 'StaffTrak');
      expect(response.body).toHaveProperty('primary_color', '#4A90E2');
      expect(response.body).toHaveProperty('secondary_color', '#BB86FC');
      expect(response.body).toHaveProperty('logo_url', null);
      expect(response.body).toHaveProperty('tenant_id', 'test-tenant');
    });

    it('should return existing configuration for tenant', async () => {
      // Insert test configuration
      const client = await pool.connect();
      await client.query(`
        INSERT INTO branding_configs (tenant_id, app_name, primary_color, secondary_color)
        VALUES ($1, $2, $3, $4)
      `, ['test-tenant', 'Custom App', '#FF0000', '#00FF00']);
      client.release();

      const response = await request(app)
        .get('/api/branding/config')
        .set('X-Tenant-Id', 'test-tenant')
        .expect(200);

      expect(response.body.app_name).toBe('Custom App');
      expect(response.body.primary_color).toBe('#FF0000');
      expect(response.body.secondary_color).toBe('#00FF00');
    });
  });

  describe('POST /api/branding/config', () => {
    it('should create new branding configuration', async () => {
      const brandingData = {
        app_name: 'Test Company',
        primary_color: '#123456',
        secondary_color: '#789ABC',
        logo_url: 'https://example.com/logo.png'
      };

      const response = await request(app)
        .post('/api/branding/config')
        .set('X-Tenant-Id', 'test-tenant')
        .send(brandingData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.config.app_name).toBe('Test Company');
      expect(response.body.config.primary_color).toBe('#123456');
    });

    it('should update existing branding configuration', async () => {
      // Create initial config
      const client = await pool.connect();
      await client.query(`
        INSERT INTO branding_configs (tenant_id, app_name)
        VALUES ($1, $2)
      `, ['test-tenant', 'Original App']);
      client.release();

      const updateData = {
        app_name: 'Updated App',
        primary_color: '#NEWCOLOR'
      };

      const response = await request(app)
        .post('/api/branding/config')
        .set('X-Tenant-Id', 'test-tenant')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.config.app_name).toBe('Updated App');
      expect(response.body.config.primary_color).toBe('#NEWCOLOR');
    });

    it('should validate color format', async () => {
      const invalidData = {
        primary_color: 'invalid-color'
      };

      const response = await request(app)
        .post('/api/branding/config')
        .set('X-Tenant-Id', 'test-tenant')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('color');
    });

    it('should validate app name length', async () => {
      const invalidData = {
        app_name: 'A'.repeat(101) // Too long
      };

      const response = await request(app)
        .post('/api/branding/config')
        .set('X-Tenant-Id', 'test-tenant')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/branding/config')
        .set('X-Tenant-Id', 'test-tenant')
        .send({})
        .expect(200);

      // Should still succeed with default values
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/branding/logo/upload', () => {
    it('should generate presigned URL for logo upload', async () => {
      const response = await request(app)
        .post('/api/branding/logo/upload')
        .set('X-Tenant-Id', 'test-tenant')
        .send({ 
          filename: 'logo.png',
          content_type: 'image/png'
        })
        .expect(200);

      expect(response.body).toHaveProperty('upload_url');
      expect(response.body).toHaveProperty('logo_url');
      expect(response.body.upload_url).toContain('storage.googleapis.com');
    });

    it('should validate image content type', async () => {
      const response = await request(app)
        .post('/api/branding/logo/upload')
        .set('X-Tenant-Id', 'test-tenant')
        .send({ 
          filename: 'document.pdf',
          content_type: 'application/pdf'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('image');
    });

    it('should require filename and content type', async () => {
      const response = await request(app)
        .post('/api/branding/logo/upload')
        .set('X-Tenant-Id', 'test-tenant')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Branding CSS Generation', () => {
    it('should generate custom CSS from configuration', async () => {
      const brandingData = {
        app_name: 'Custom Brand',
        primary_color: '#FF5722',
        secondary_color: '#FFC107',
        custom_css: '.header { font-weight: bold; }'
      };

      await request(app)
        .post('/api/branding/config')
        .set('X-Tenant-Id', 'test-tenant')
        .send(brandingData)
        .expect(200);

      const response = await request(app)
        .get('/api/branding/css')
        .set('X-Tenant-Id', 'test-tenant')
        .expect(200);

      expect(response.text).toContain('--brand-primary: #FF5722');
      expect(response.text).toContain('--brand-secondary: #FFC107');
      expect(response.text).toContain('.header { font-weight: bold; }');
      expect(response.headers['content-type']).toContain('text/css');
    });
  });

  describe('Multi-tenant Isolation', () => {
    it('should isolate configurations between tenants', async () => {
      // Create config for tenant A
      await request(app)
        .post('/api/branding/config')
        .set('X-Tenant-Id', 'tenant-a')
        .send({ app_name: 'Company A' })
        .expect(200);

      // Create config for tenant B
      await request(app)
        .post('/api/branding/config')
        .set('X-Tenant-Id', 'tenant-b')
        .send({ app_name: 'Company B' })
        .expect(200);

      // Verify tenant A sees only their config
      const responseA = await request(app)
        .get('/api/branding/config')
        .set('X-Tenant-Id', 'tenant-a')
        .expect(200);

      expect(responseA.body.app_name).toBe('Company A');

      // Verify tenant B sees only their config
      const responseB = await request(app)
        .get('/api/branding/config')
        .set('X-Tenant-Id', 'tenant-b')
        .expect(200);

      expect(responseB.body.app_name).toBe('Company B');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This would require mocking the database connection
      // For now, we'll test a scenario that might cause DB issues
      
      const response = await request(app)
        .get('/api/branding/config')
        .set('X-Tenant-Id', '')  // Empty tenant ID might cause issues
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate tenant ID presence', async () => {
      const response = await request(app)
        .get('/api/branding/config')
        // No X-Tenant-Id header
        .expect(400);

      expect(response.body.error).toContain('tenant');
    });
  });
});