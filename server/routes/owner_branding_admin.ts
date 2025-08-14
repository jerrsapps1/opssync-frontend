import { Router } from "express";
import pg from "pg";
import { requirePlatformOwner } from "../middleware/authz";
import { ensureAddonOnSubscription } from "../services/stripe_addon";

const router = Router();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

router.patch("/branding-settings/:tenantId", requirePlatformOwner, async (req, res) => {
  const tenantId = req.params.tenantId;
  const { branding_enabled, white_label_enabled } = req.body || {};
  await pool.query(`
    insert into org_entitlements (tenant_id, branding_enabled, white_label_enabled)
    values ($1, coalesce($2,false), coalesce($3,false))
    on conflict (tenant_id) do update set
      branding_enabled = coalesce($2, org_entitlements.branding_enabled),
      white_label_enabled = coalesce($3, org_entitlements.white_label_enabled)
  `, [tenantId, branding_enabled, white_label_enabled]);

  const { rows } = await pool.query(`select stripe_subscription_id from org_subscriptions where tenant_id=$1`, [tenantId]);
  const subId = rows[0]?.stripe_subscription_id;
  const priceBranding = process.env.STRIPE_PRICE_BRANDING || "";
  const priceWhiteLabel = process.env.STRIPE_PRICE_WHITE_LABEL || "";

  try {
    if (subId && priceBranding && typeof branding_enabled === "boolean") {
      await ensureAddonOnSubscription({ subscriptionId: subId, priceId: priceBranding, enabled: !!branding_enabled });
    }
    if (subId && priceWhiteLabel && typeof white_label_enabled === "boolean") {
      await ensureAddonOnSubscription({ subscriptionId: subId, priceId: priceWhiteLabel, enabled: !!white_label_enabled });
    }
  } catch (e: any) {
    return res.status(200).json({ ok: true, stripe: "update_failed", message: e?.message || "Stripe update failed" });
  }
  res.json({ ok: true });
});

router.get("/branding-settings/:tenantId", requirePlatformOwner, async (req, res) => {
  const tenantId = req.params.tenantId;
  const { rows } = await pool.query(`select branding_enabled, white_label_enabled from org_entitlements where tenant_id=$1`, [tenantId]);
  res.json(rows[0] || { branding_enabled: false, white_label_enabled: false });
});

export default router;
