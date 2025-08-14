import { Router } from "express";
import Stripe from "stripe";
import pg from "pg";

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

// Create Stripe Checkout session for subscription
router.post("/checkout", async (req, res) => {
  try {
    if (!stripe) {
      return res.status(400).json({ error: "Stripe not configured" });
    }

    const tenantId = req.headers["x-tenant-id"] || "default-tenant";
    const { email, name } = req.body;
    const priceId = process.env.STRIPE_PRICE_ID;
    const publicUrl = process.env.PUBLIC_URL || "http://localhost:5000";

    if (!priceId) {
      return res.status(400).json({ error: "STRIPE_PRICE_ID not configured" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: "subscription",
      success_url: `${publicUrl}/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${publicUrl}/billing`,
      customer_email: email,
      metadata: {
        tenant_id: tenantId,
        customer_name: Array.isArray(name) ? name[0] : name
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Checkout session creation error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Create billing portal session for existing customers
router.post("/portal/session", async (req, res) => {
  try {
    if (!stripe) {
      return res.status(400).json({ error: "Stripe not configured" });
    }

    const tenantId = req.headers["x-tenant-id"] || "default-tenant";
    const publicUrl = process.env.PUBLIC_URL || "http://localhost:5000";

    const client = await pool.connect();
    const customerResult = await client.query(
      "SELECT stripe_customer_id FROM billing_customers WHERE tenant_id = $1",
      [tenantId]
    );
    client.release();

    if (customerResult.rows.length === 0) {
      return res.status(404).json({ error: "No customer found" });
    }

    const stripeCustomerId = customerResult.rows[0].stripe_customer_id;

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${publicUrl}/billing`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Portal session creation error:", error);
    res.status(500).json({ error: "Failed to create portal session" });
  }
});

// Handle successful checkout completion
router.get("/checkout/success", async (req, res) => {
  try {
    if (!stripe) {
      return res.status(400).json({ error: "Stripe not configured" });
    }

    const sessionId = req.query.session_id as string;
    if (!sessionId) {
      return res.status(400).json({ error: "Session ID required" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const tenantId = session.metadata?.tenant_id || "default-tenant";
    const customerName = session.metadata?.customer_name;

    if (session.customer) {
      const client = await pool.connect();

      // Save customer information
      await client.query(`
        INSERT INTO billing_customers (tenant_id, stripe_customer_id, email, name)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (tenant_id) 
        DO UPDATE SET 
          stripe_customer_id = EXCLUDED.stripe_customer_id,
          email = EXCLUDED.email,
          name = EXCLUDED.name,
          updated_at = CURRENT_TIMESTAMP
      `, [tenantId, session.customer, session.customer_email, customerName]);

      client.release();
    }

    res.json({ 
      success: true, 
      customer_id: session.customer,
      subscription_id: session.subscription 
    });
  } catch (error) {
    console.error("Checkout success handling error:", error);
    res.status(500).json({ error: "Failed to process checkout success" });
  }
});

export default router;