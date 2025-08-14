import { Router } from "express";
import pg from "pg";
import Stripe from "stripe";

const { Pool } = pg;
const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Initialize Stripe if secret key is available
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-07-30.basil",
  });
}

// Get billing status for tenant
router.get("/status", async (req, res) => {
  try {
    const tenantId = req.headers["x-tenant-id"] || "default-tenant";
    
    const client = await pool.connect();
    const customerResult = await client.query(
      "SELECT * FROM billing_customers WHERE tenant_id = $1",
      [tenantId]
    );
    
    let subscription = null;
    if (customerResult.rows.length > 0) {
      const subscriptionResult = await client.query(
        "SELECT * FROM billing_subscriptions WHERE tenant_id = $1",
        [tenantId]
      );
      subscription = subscriptionResult.rows[0] || null;
    }
    
    client.release();
    
    res.json({
      has_customer: customerResult.rows.length > 0,
      customer: customerResult.rows[0] || null,
      subscription,
      stripe_configured: !!stripe
    });
  } catch (error) {
    console.error("Get billing status error:", error);
    res.status(500).json({ error: "Failed to fetch billing status" });
  }
});

// Create Stripe customer and subscription
router.post("/create-subscription", async (req, res) => {
  try {
    if (!stripe) {
      return res.status(400).json({ error: "Stripe not configured" });
    }
    
    const tenantId = req.headers["x-tenant-id"] || "default-tenant";
    const { email, name } = req.body;
    const priceId = process.env.STRIPE_PRICE_ID;
    
    if (!priceId) {
      return res.status(400).json({ error: "STRIPE_PRICE_ID not configured" });
    }
    
    const client = await pool.connect();
    
    try {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: Array.isArray(email) ? email[0] : email,
        name: Array.isArray(name) ? name[0] : name,
        metadata: { tenant_id: tenantId }
      });
      
      // Save customer to database
      await client.query(`
        INSERT INTO billing_customers (tenant_id, stripe_customer_id, email, name)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (tenant_id) 
        DO UPDATE SET 
          stripe_customer_id = EXCLUDED.stripe_customer_id,
          email = EXCLUDED.email,
          name = EXCLUDED.name,
          updated_at = CURRENT_TIMESTAMP
      `, [tenantId, customer.id, email, name]);
      
      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });
      
      // Save subscription to database
      await client.query(`
        INSERT INTO billing_subscriptions (
          tenant_id, stripe_subscription_id, stripe_price_id, status,
          current_period_start, current_period_end
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (tenant_id) 
        DO UPDATE SET 
          stripe_subscription_id = EXCLUDED.stripe_subscription_id,
          stripe_price_id = EXCLUDED.stripe_price_id,
          status = EXCLUDED.status,
          current_period_start = EXCLUDED.current_period_start,
          current_period_end = EXCLUDED.current_period_end,
          updated_at = CURRENT_TIMESTAMP
      `, [
        tenantId, 
        subscription.id, 
        priceId, 
        subscription.status,
        new Date((subscription as any).current_period_start * 1000),
        new Date((subscription as any).current_period_end * 1000)
      ]);
      
      client.release();
      
      const latestInvoice = (subscription as any).latest_invoice as Stripe.Invoice;
      const paymentIntent = (latestInvoice as any)?.payment_intent as Stripe.PaymentIntent;
      
      res.json({
        subscription_id: subscription.id,
        client_secret: paymentIntent?.client_secret,
        status: subscription.status
      });
      
    } catch (stripeError) {
      client.release();
      throw stripeError;
    }
    
  } catch (error) {
    console.error("Create subscription error:", error);
    res.status(500).json({ error: "Failed to create subscription" });
  }
});

// Get usage metrics
router.get("/usage", async (req, res) => {
  try {
    const tenantId = req.headers["x-tenant-id"] || "default-tenant";
    
    const client = await pool.connect();
    
    // Get current month usage
    const usageResult = await client.query(`
      SELECT metric_name, value 
      FROM billing_usage_metrics 
      WHERE tenant_id = $1 
        AND period_start <= CURRENT_DATE 
        AND period_end >= CURRENT_DATE
    `, [tenantId]);
    
    // Calculate real-time metrics
    const projectsResult = await client.query(
      "SELECT COUNT(*) as count FROM projects WHERE tenant_id = $1",
      [tenantId]
    );
    const employeesResult = await client.query(
      "SELECT COUNT(*) as count FROM employees WHERE tenant_id = $1",
      [tenantId]
    );
    const equipmentResult = await client.query(
      "SELECT COUNT(*) as count FROM equipment WHERE tenant_id = $1",
      [tenantId]
    );
    
    client.release();
    
    const usage = {
      stored_metrics: usageResult.rows,
      current_usage: {
        projects: parseInt(projectsResult.rows[0].count),
        employees: parseInt(employeesResult.rows[0].count),
        equipment: parseInt(equipmentResult.rows[0].count)
      }
    };
    
    res.json(usage);
  } catch (error) {
    console.error("Get usage error:", error);
    res.status(500).json({ error: "Failed to fetch usage metrics" });
  }
});

export default router;