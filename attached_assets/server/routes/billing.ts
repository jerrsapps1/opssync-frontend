import { Router } from "express";
import { Pool } from "pg";
import Stripe from "stripe";
import { requireAuth } from "../middleware/authz";

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" }) : null;

// Submit a PO number to request activation
router.post("/po", requireAuth, async (req, res) => {
  const user = (req as any).user || {}; const tenantId = user?.tenantId;
  if (!tenantId) return res.status(400).send("Missing tenant");
  const po = String(req.body?.po_number || "").trim();
  if (!po) return res.status(400).send("PO required");
  await pool.query(`
    insert into org_subscriptions (tenant_id, status, po_number)
    values ($1, 'po_pending', $2)
    on conflict (tenant_id) do update set po_number=excluded.po_number, status='po_pending'
  `, [tenantId, po]);
  res.json({ ok: true, status: "po_pending" });
});

// Create a Stripe checkout session (if Stripe configured)
router.post("/checkout", requireAuth, async (req, res) => {
  if (!stripe) return res.status(400).send("Stripe not configured");
  const user = (req as any).user || {}; const tenantId = user?.tenantId; const email = user?.email;
  if (!tenantId) return res.status(400).send("Missing tenant");
  const priceId = String(req.body?.price_id || process.env.STRIPE_PRICE_ID || "");
  if (!priceId) return res.status(400).send("Missing price");
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.PUBLIC_URL || "http://localhost:3000"}/billing?success=true`,
    cancel_url: `${process.env.PUBLIC_URL || "http://localhost:3000"}/billing?canceled=true`,
  });
  res.json({ url: session.url });
});

export default router;
