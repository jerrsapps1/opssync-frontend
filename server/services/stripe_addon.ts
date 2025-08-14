import Stripe from "stripe";
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" })
  : null;

export async function ensureAddonOnSubscription(opts: {
  subscriptionId: string;
  priceId: string;
  enabled: boolean;
}) {
  if (!stripe) throw new Error("Stripe not configured");
  const sub = await stripe.subscriptions.retrieve(opts.subscriptionId, { expand: ["items.data.price"] });
  const items = sub.items.data;
  const existing = items.find(i => i.price?.id === opts.priceId);
  if (opts.enabled && !existing) {
    await stripe.subscriptionItems.create({ subscription: sub.id, price: opts.priceId, quantity: 1 });
  } else if (!opts.enabled && existing) {
    await stripe.subscriptionItems.del(existing.id);
  }
  return true;
}
