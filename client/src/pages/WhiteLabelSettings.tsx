import React, { useEffect, useState } from "react";
type WL = { custom_domain:string; from_email:string; domain_dns_status:string; email_spf_dkim_status:string };
export default function WhiteLabelSettings() {
  const [wl, setWL] = useState<WL | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  async function load() {
    setMsg(null);
    const r = await fetch("/api/white-label", { credentials: "include" });
    if (r.ok) setWL(await r.json()); else setMsg(await r.text());
  }
  useEffect(()=>{ load(); }, []);
  async function save(patch: Partial<WL>) {
    setMsg(null);
    const r = await fetch("/api/white-label", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    if (r.ok) { await load(); setMsg("Saved."); } else setMsg(await r.text());
  }
  if (!wl) return <div className="p-4 text-sm text-gray-500">Loading…</div>;
  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">White Label Settings</h1>
      <label className="block">
        <div className="text-sm text-gray-600 mb-1">Custom Domain (e.g., portal.yourco.com)</div>
        <input className="w-full rounded-xl border p-2" value={wl.custom_domain} onChange={e=>setWL({...wl, custom_domain:e.target.value})} onBlur={()=>save({ custom_domain: wl.custom_domain })} />
      </label>
      <label className="block">
        <div className="text-sm text-gray-600 mb-1">From Email (e.g., no-reply@yourco.com)</div>
        <input className="w-full rounded-xl border p-2" value={wl.from_email} onChange={e=>setWL({...wl, from_email:e.target.value})} onBlur={()=>save({ from_email: wl.from_email })} />
      </label>
      <div className="rounded-2xl border p-3 text-xs text-gray-600 space-y-1">
        <div>Domain status: <b>{wl.domain_dns_status || "pending"}</b></div>
        <div>Email SPF/DKIM: <b>{wl.email_spf_dkim_status || "pending"}</b></div>
        <div className="text-gray-500 mt-2">We'll guide you through DNS and email verification after you set these values.</div>
      </div>
      {msg && <div className="text-xs text-gray-500">{msg}</div>}
    </div>
  );
}
