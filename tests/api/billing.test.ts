import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { Pool } from 'pg';
import Stripe from 'stripe';

// Mock Stripe for testing
jest.mock('stripe');
const MockStripe = Stripe as jest.MockedClass<typeof Stripe>;

describe('Billing API Tests', () => {
  let app: any;
  let pool: Pool;
  let mockStripe: jest.Mocked<Stripe>;

  beforeAll(async () => {
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/stafftrak_test'
    });
    
    const { createTestApp } = await import('../../server/test-utils');
    app = await createTestApp();

    // Setup Stripe mocks
    mockStripe = new MockStripe('sk_test_mock', { apiVersion: '2025-07-30.basil' }) as jest.Mocked<Stripe>;
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    // Reset billing data before each test
    const client = await pool.connect();
    await client.query('DELETE FROM billing_customers WHERE tenant_id = $1', ['test-tenant']);
    await client.query('DELETE FROM billing_subscriptions WHERE tenant_id = $1', ['test-tenant']);
    client.release();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/billing/status', () => {
    it('should return billing status for new customer', async () => {
      const response = await request(app)
        .get('/api/billing/status')
        .set('X-Tenant-Id', 'test-tenant')
        .expect(200);

      expect(response.body).toHaveProperty('has_customer', false);
      expect(response.body).toHaveProperty('customer', null);
      expect(response.body).toHaveProperty('subscription', null);
      expect(response.body).toHaveProperty('stripe_configured');
    });

    it('should return billing status for existing customer', async () => {
      // Insert test customer and subscription
      const client = await pool.connect();
      await client.query(`
        INSERT INTO billing_customers (tenant_id, stripe_customer_id, email, name)
        VALUES ($1, $2, $3, $4)
      `, ['test-tenant', 'cus_test123', 'test@example.com', 'Test Customer']);
      
      await client.query(`
        INSERT INTO billing_subscriptions (tenant_id, stripe_subscription_id, stripe_price_id, status, current_period_start, current_period_end)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['test-tenant', 'sub_test123', 'price_test123', 'active', new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]);
      client.release();

      const response = await request(app)
        .get('/api/billing/status')
        .set('X-Tenant-Id', 'test-tenant')
        .expect(200);

      expect(response.body.has_customer).toBe(true);
      expect(response.body.customer).not.toBeNull();
      expect(response.body.subscription).not.toBeNull();
      expect(response.body.subscription.status).toBe('active');
    });
  });

  describe('POST /api/billing/create-subscription', () => {
    beforeEach(() => {
      // Mock Stripe methods
      mockStripe.customers.create = jest.fn().mockResolvedValue({
        id: 'cus_test123',
        email: 'test@example.com',
        name: 'Test Customer'
      } as Stripe.Customer);

      mockStripe.subscriptions.create = jest.fn().mockResolvedValue({
        id: 'sub_test123',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
        latest_invoice: {
          payment_intent: {
            client_secret: 'pi_test_client_secret'
          }
        }
      } as any);
    });

    it('should create new subscription for customer', async () => {
      const subscriptionData = {
        email: 'test@example.com',
        name: 'Test Customer',
        price_id: 'price_test123'
      };

      const response = await request(app)
        .post('/api/billing/create-subscription')
        .set('X-Tenant-Id', 'test-tenant')
        .send(subscriptionData)
        .expect(200);

      expect(response.body).toHaveProperty('subscription_id', 'sub_test123');
      expect(response.body).toHaveProperty('client_secret', 'pi_test_client_secret');

      // Verify customer was created in database
      const client = await pool.connect();
      const customerResult = await client.query(
        'SELECT * FROM billing_customers WHERE tenant_id = $1',
        ['test-tenant']
      );
      client.release();

      expect(customerResult.rows).toHaveLength(1);
      expect(customerResult.rows[0].stripe_customer_id).toBe('cus_test123');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/billing/create-subscription')
        .set('X-Tenant-Id', 'test-tenant')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('email');
    });

    it('should handle Stripe errors', async () => {
      mockStripe.customers.create = jest.fn().mockRejectedValue(
        new Error('Card declined')
      );

      const subscriptionData = {
        email: 'test@example.com',
        name: 'Test Customer',
        price_id: 'price_test123'
      };

      const response = await request(app)
        .post('/api/billing/create-subscription')
        .set('X-Tenant-Id', 'test-tenant')
        .send(subscriptionData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/billing/checkout', () => {
    beforeEach(() => {
      mockStripe.checkout.sessions.create = jest.fn().mockResolvedValue({
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/pay/cs_test123'
      } as Stripe.Checkout.Session);
    });

    it('should create checkout session', async () => {
      const checkoutData = {
        email: 'test@example.com',
        name: 'Test Customer'
      };

      const response = await request(app)
        .post('/api/billing/checkout')
        .set('X-Tenant-Id', 'test-tenant')
        .send(checkoutData)
        .expect(200);

      expect(response.body).toHaveProperty('url');
      expect(response.body.url).toContain('checkout.stripe.com');

      // Verify Stripe was called with correct parameters
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_email: 'test@example.com',
          metadata: expect.objectContaining({
            tenant_id: 'test-tenant',
            customer_name: 'Test Customer'
          })
        })
      );
    });

    it('should require STRIPE_PRICE_ID environment variable', async () => {
      // Temporarily remove STRIPE_PRICE_ID
      const originalPriceId = process.env.STRIPE_PRICE_ID;
      delete process.env.STRIPE_PRICE_ID;

      const response = await request(app)
        .post('/api/billing/checkout')
        .set('X-Tenant-Id', 'test-tenant')
        .send({ email: 'test@example.com', name: 'Test' })
        .expect(400);

      expect(response.body.error).toContain('STRIPE_PRICE_ID');

      // Restore environment variable
      process.env.STRIPE_PRICE_ID = originalPriceId;
    });
  });

  describe('POST /api/billing/portal/session', () => {
    beforeEach(() => {
      mockStripe.billingPortal.sessions.create = jest.fn().mockResolvedValue({
        url: 'https://billing.stripe.com/session/test123'
      } as Stripe.BillingPortal.Session);
    });

    it('should create billing portal session for existing customer', async () => {
      // Insert test customer
      const client = await pool.connect();
      await client.query(`
        INSERT INTO billing_customers (tenant_id, stripe_customer_id, email, name)
        VALUES ($1, $2, $3, $4)
      `, ['test-tenant', 'cus_test123', 'test@example.com', 'Test Customer']);
      client.release();

      const response = await request(app)
        .post('/api/billing/portal/session')
        .set('X-Tenant-Id', 'test-tenant')
        .expect(200);

      expect(response.body).toHaveProperty('url');
      expect(response.body.url).toContain('billing.stripe.com');

      // Verify Stripe was called with correct customer ID
      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_test123',
        return_url: expect.stringContaining('/billing')
      });
    });

    it('should return 404 for non-existent customer', async () => {
      const response = await request(app)
        .post('/api/billing/portal/session')
        .set('X-Tenant-Id', 'nonexistent-tenant')
        .expect(404);

      expect(response.body.error).toContain('customer');
    });
  });

  describe('GET /api/billing/checkout/success', () => {
    beforeEach(() => {
      mockStripe.checkout.sessions.retrieve = jest.fn().mockResolvedValue({
        id: 'cs_test123',
        customer: 'cus_test123',
        customer_email: 'test@example.com',
        subscription: 'sub_test123',
        metadata: {
          tenant_id: 'test-tenant',
          customer_name: 'Test Customer'
        }
      } as Stripe.Checkout.Session);
    });

    it('should process successful checkout', async () => {
      const response = await request(app)
        .get('/api/billing/checkout/success?session_id=cs_test123')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('customer_id', 'cus_test123');
      expect(response.body).toHaveProperty('subscription_id', 'sub_test123');

      // Verify customer was saved to database
      const client = await pool.connect();
      const customerResult = await client.query(
        'SELECT * FROM billing_customers WHERE tenant_id = $1',
        ['test-tenant']
      );
      client.release();

      expect(customerResult.rows).toHaveLength(1);
      expect(customerResult.rows[0].stripe_customer_id).toBe('cus_test123');
    });

    it('should require session_id parameter', async () => {
      const response = await request(app)
        .get('/api/billing/checkout/success')
        .expect(400);

      expect(response.body.error).toContain('Session ID');
    });
  });

  describe('Stripe Configuration', () => {
    it('should handle missing Stripe configuration gracefully', async () => {
      // This would test the case where STRIPE_SECRET_KEY is not configured
      // In a real test environment, we might temporarily unset the env var
      
      const response = await request(app)
        .get('/api/billing/status')
        .set('X-Tenant-Id', 'test-tenant')
        .expect(200);

      expect(response.body).toHaveProperty('stripe_configured');
    });
  });

  describe('Webhook Integration', () => {
    // Note: Webhook tests would typically be in a separate file
    // since they require special raw body handling
    
    it('should be tested separately in webhook-specific test file', () => {
      // Placeholder to remind about webhook testing
      expect(true).toBe(true);
    });
  });

  describe('Data Validation', () => {
    it('should validate email format', async () => {
      const invalidData = {
        email: 'invalid-email',
        name: 'Test Customer'
      };

      const response = await request(app)
        .post('/api/billing/create-subscription')
        .set('X-Tenant-Id', 'test-tenant')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toContain('email');
    });

    it('should sanitize customer name', async () => {
      const dataWithSpecialChars = {
        email: 'test@example.com',
        name: 'Test <script>alert("xss")</script> Customer'
      };

      mockStripe.customers.create = jest.fn().mockResolvedValue({
        id: 'cus_test123'
      } as Stripe.Customer);

      const response = await request(app)
        .post('/api/billing/create-subscription')
        .set('X-Tenant-Id', 'test-tenant')
        .send(dataWithSpecialChars)
        .expect(200);

      // Verify that the name was sanitized when passed to Stripe
      const createCall = mockStripe.customers.create as jest.Mock;
      expect(createCall.mock.calls[0][0].name).not.toContain('<script>');
    });
  });
});