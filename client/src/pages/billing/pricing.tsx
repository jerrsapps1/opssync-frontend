import React from "react";

const plans = [
  { key: "starter", name: "Starter", price: 199, unit: "/mo", blurb: "Up to 20 employees & 20 assets", features: ["Real-time dashboard", "Import/Export", "Archive & History"] },
  { key: "growth", name: "Growth", price: 399, unit: "/mo", blurb: "Up to 75 employees & 75 assets", features: ["Everything in Starter", "White-label branding", "Priority support"] },
  { key: "enterprise", name: "Enterprise", price: 799, unit: "/mo", blurb: "Unlimited employees & assets", features: ["SLA & SSO options", "Custom limits", "Dedicated support"] },
];

export default function PricingPage() {
  const [orgId, setOrgId] = React.useState("demo-org");
  const [interval, setInterval] = React.useState<"month"|"year">("month");

  async function checkout(plan: string) {
    const r = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-org-id": orgId },
      body: JSON.stringify({ plan, interval }),
    });
    const json = await r.json();
    if (json.url) window.location.href = json.url;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">Choose your plan</h1>
      <div className="text-sm text-gray-400 mb-4">Set org id (for demo):</div>
      <input value={orgId} onChange={e=>setOrgId(e.target.value)} className="px-3 py-2 rounded bg-gray-800 text-white mb-6" />
      <div className="mb-6">
        <label className="mr-3 text-sm">Billing:</label>
        <select value={interval} onChange={e=>setInterval(e.target.value as any)} className="px-2 py-1 rounded bg-gray-800 text-white">
          <option value="month">Monthly</option>
          <option value="year">Yearly</option>
        </select>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map(p => (
          <div key={p.key} className="rounded border border-gray-800 p-4 bg-[#0b1220]">
            <div className="text-lg font-medium">{p.name}</div>
            <div className="text-2xl font-bold mt-2">${p.price}<span className="text-base text-gray-400">{p.unit}</span></div>
            <div className="text-sm text-gray-400 mt-1">{p.blurb}</div>
            <ul className="text-sm mt-3 space-y-1">
              {p.features.map((f,i)=>(<li key={i}>• {f}</li>))}
            </ul>
            <button onClick={()=>checkout(p.key)} className="mt-4 px-3 py-2 rounded bg-[color:var(--brand-primary)] text-white">Start {p.name}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
