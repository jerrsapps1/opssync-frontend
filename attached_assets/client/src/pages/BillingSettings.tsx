import React, { useState } from "react";

export default function BillingSettings() {
  const [po, setPo] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function submitPO() {
    const res = await fetch("/api/billing/po", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ po_number: po })
    });
    const j = await res.json();
    setStatus(j.status || null);
    setMsg("PO submitted. We'll review and activate your account.");
  }

  async function startCheckout() {
    const res = await fetch("/api/billing/checkout", { method: "POST", credentials: "include" });
    if (res.ok) {
      const j = await res.json();
      if (j.url) window.location.href = j.url;
    } else {
      setMsg("Card checkout is not configured for this environment.");
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Billing</h1>

      <div className="rounded-2xl border p-4 space-y-3">
        <div className="text-sm text-gray-700">Pay with a Purchase Order (PO)</div>
        <input className="w-full rounded-xl border p-2" placeholder="Enter PO number" value={po} onChange={e=>setPo(e.target.value)} />
        <button className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50" onClick={submitPO}>Submit PO</button>
        {status === "po_pending" && <div className="text-xs text-gray-500">Status: Pending review</div>}
      </div>

      <div className="rounded-2xl border p-4 space-y-3">
        <div className="text-sm text-gray-700">Or pay by card</div>
        <button className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50" onClick={startCheckout}>Start checkout</button>
        {msg && <div className="text-xs text-gray-500">{msg}</div>}
      </div>
    </div>
  );
}
