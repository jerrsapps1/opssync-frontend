import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-07-30.basil",
});

export const APP_URL = process.env.APP_URL || "http://localhost:3000";
export const STARTER_PRICE_ID = process.env.STRIPE_PRICE_STARTER as string;
export const GROWTH_PRICE_ID = process.env.STRIPE_PRICE_GROWTH as string;
export const ENTERPRISE_PRICE_ID = process.env.STRIPE_PRICE_ENTERPRISE as string;
