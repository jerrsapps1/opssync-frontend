import { Router } from "express";
import type { Request, Response } from "express";
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

// Stripe webhook endpoint - raw body is already parsed by express.raw()
router.post("/", async (req: Request, res: Response) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Stripe webhook: Missing configuration");
    return res.status(400).send("Webhook configuration missing");
  }

  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("Stripe webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`Stripe webhook received: ${event.type}`);

  try {
    const client = await pool.connect();

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Get customer to find tenant_id
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const tenantId = customer.metadata?.tenant_id || "default-tenant";

        await client.query(`
          INSERT INTO billing_subscriptions (
            tenant_id, stripe_subscription_id, stripe_price_id, status,
            current_period_start, current_period_end, cancel_at_period_end
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (tenant_id)
          DO UPDATE SET 
            stripe_subscription_id = EXCLUDED.stripe_subscription_id,
            stripe_price_id = EXCLUDED.stripe_price_id,
            status = EXCLUDED.status,
            current_period_start = EXCLUDED.current_period_start,
            current_period_end = EXCLUDED.current_period_end,
            cancel_at_period_end = EXCLUDED.cancel_at_period_end,
            updated_at = CURRENT_TIMESTAMP
        `, [
          tenantId,
          subscription.id,
          (subscription.items.data[0]?.price as any)?.id,
          subscription.status,
          new Date((subscription as any).current_period_start * 1000),
          new Date((subscription as any).current_period_end * 1000),
          (subscription as any).cancel_at_period_end
        ]);

        console.log(`Updated subscription for tenant ${tenantId}: ${subscription.status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        await client.query(
          "UPDATE billing_subscriptions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE stripe_subscription_id = $2",
          ["canceled", subscription.id]
        );

        console.log(`Subscription canceled: ${subscription.id}`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string;
        
        if (subscriptionId) {
          await client.query(
            "UPDATE billing_subscriptions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE stripe_subscription_id = $2",
            ["active", subscriptionId]
          );

          console.log(`Payment succeeded for subscription: ${subscriptionId}`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string;
        
        if (subscriptionId) {
          await client.query(
            "UPDATE billing_subscriptions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE stripe_subscription_id = $2",
            ["past_due", subscriptionId]
          );

          console.log(`Payment failed for subscription: ${subscriptionId}`);
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    client.release();
    res.json({ received: true });

  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;