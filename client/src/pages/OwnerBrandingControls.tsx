import React, { useState } from "react";
export default function OwnerBrandingControls() {
  const [tenantId, setTenantId] = useState("");
  const [branding, setBranding] = useState<boolean | null>(null);
  const [whiteLabel, setWhiteLabel] = useState<boolean | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  async function load() {
    setMsg(null);
    const r = await fetch(`/api/owner-admin/branding-settings/${tenantId}`, { credentials: "include" });
    if (r.ok) { const j = await r.json(); setBranding(j.branding_enabled); setWhiteLabel(j.white_label_enabled); }
    else setMsg(await r.text());
  }
  async function save() {
    setMsg(null);
    const r = await fetch(`/api/owner-admin/branding-settings/${tenantId}`, {
      method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branding_enabled: branding, white_label_enabled: whiteLabel })
    });
    setMsg(r.ok ? "Saved." : await r.text());
  }
  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Branding & White Label (Owner)</h1>
      <input className="w-full rounded-xl border p-2" placeholder="Tenant ID" value={tenantId} onChange={e=>setTenantId(e.target.value)} />
      <div className="rounded-2xl border p-4 space-y-3">
        <label className="flex items-center gap-2"><input type="checkbox" checked={!!branding} onChange={e=>setBranding(e.target.checked)} /><span>Branding Enabled</span></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={!!whiteLabel} onChange={e=>setWhiteLabel(e.target.checked)} /><span>White Label Enabled</span></label>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-lg border text-sm" onClick={load}>Load</button>
          <button className="px-3 py-1.5 rounded-lg border text-sm" onClick={save}>Save</button>
        </div>
        {msg && <div className="text-xs text-gray-500">{msg}</div>}
      </div>
      <div className="text-xs text-gray-500">If Stripe price IDs are configured, toggling will add/remove add-on items automatically.</div>
    </div>
  );
}
