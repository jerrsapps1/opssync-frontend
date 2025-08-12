import React from "react";

export default function BillingHome() {
  async function openPortal() {
    const r = await fetch("/api/billing/portal", { method: "POST" });
    const json = await r.json();
    if (json.url) window.location.href = json.url;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">Billing</h1>
      <div className="text-sm text-gray-400 mb-4">Manage your subscription, payment methods, and invoices.</div>
      <button onClick={openPortal} className="px-3 py-2 rounded bg-[color:var(--brand-primary)] text-white">Open Customer Portal</button>
    </div>
  );
}
