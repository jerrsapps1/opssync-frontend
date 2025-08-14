// Billing utilities for MVP optional addons
export const billingUtils = {
  // Open Stripe billing portal for existing customers
  async openPortal(): Promise<void> {
    try {
      const response = await fetch("/api/billing/portal/session", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-Id": "default-tenant"
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to create portal session");
      }
      
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Error opening billing portal:", error);
      throw error;
    }
  },

  // Create Stripe checkout session for new subscriptions
  async createCheckout(email: string, name: string): Promise<void> {
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-Id": "default-tenant"
        },
        body: JSON.stringify({ email, name })
      });
      
      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }
      
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      throw error;
    }
  },

  // Handle successful checkout completion
  async handleCheckoutSuccess(sessionId: string) {
    try {
      const response = await fetch(`/api/billing/checkout/success?session_id=${sessionId}`, {
        method: "GET",
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error("Failed to process checkout success");
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error handling checkout success:", error);
      throw error;
    }
  }
};

// Environment variable helpers
export const stripeConfig = {
  publicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY || "",
  isConfigured: () => Boolean(stripeConfig.publicKey)
};

// Usage example for component integration:
/*
import { billingUtils } from '@/lib/billing';

// In a component:
const handleStartSubscription = async () => {
  try {
    await billingUtils.createCheckout(
      'customer@example.com',
      'Customer Name'
    );
  } catch (error) {
    // Handle error
  }
};

const handleManageBilling = async () => {
  try {
    await billingUtils.openPortal();
  } catch (error) {
    // Handle error - maybe redirect to subscription creation
  }
};
*/