import express from "express";
import { stripe } from "../stripe/config";
import { upsertCustomer, getByCustomerId } from "../stripe/store";

const router = express.Router();

// Stripe sends raw body for signature verification
router.post("/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
  } catch (err:any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        const customerId = sub.customer as string;
        const rec = getByCustomerId(customerId);
        if (rec) {
          upsertCustomer({
            ...rec,
            stripeSubscriptionId: sub.id,
            status: sub.status,
          });
        }
        break;
      }
      case "checkout.session.completed": {
        const cs = event.data.object as any;
        const customerId = cs.customer as string;
        const rec = getByCustomerId(customerId);
        if (rec) {
          upsertCustomer({
            ...rec,
            status: "active",
          });
        }
        break;
      }
      default:
        // Ignore others for now
        break;
    }
    res.json({ received: true });
  } catch (e:any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
