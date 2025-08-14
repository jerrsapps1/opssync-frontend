import React, { useEffect, useState } from "react";

type Branding = { logo_url:string; primary_color:string; accent_color:string; company_name:string };

export default function BrandingSettings() {
  const [b, setB] = useState<Branding | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const r = await fetch("/api/branding", { credentials: "include" }).then(r=>r.json());
    setB(r);
  }
  useEffect(()=>{ load(); }, []);

  async function save(patch: Partial<Branding>) {
    setSaving(true);
    try {
      await fetch("/api/branding", { method: "POST", credentials: "include", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(patch) });
      await load();
    } finally { setSaving(false); }
  }

  if (!b) return <div className="p-4 text-sm text-gray-500">Loading…</div>;

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Branding</h1>

      <label className="block">
        <div className="text-sm text-gray-600 mb-1">Company Name</div>
        <input className="w-full rounded-xl border p-2" value={b.company_name} onChange={e=>setB({...b, company_name:e.target.value})} onBlur={()=>save({ company_name: b.company_name })} />
      </label>

      <label className="block">
        <div className="text-sm text-gray-600 mb-1">Logo URL</div>
        <input className="w-full rounded-xl border p-2" value={b.logo_url} onChange={e=>setB({...b, logo_url:e.target.value})} onBlur={()=>save({ logo_url: b.logo_url })} />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <div className="text-sm text-gray-600 mb-1">Primary Color</div>
          <input type="color" className="w-full rounded-xl border p-2 h-10" value={b.primary_color} onChange={e=>{ setB({...b, primary_color:e.target.value}); save({ primary_color: e.target.value }); }} />
        </label>
        <label className="block">
          <div className="text-sm text-gray-600 mb-1">Accent Color</div>
          <input type="color" className="w-full rounded-xl border p-2 h-10" value={b.accent_color} onChange={e=>{ setB({...b, accent_color:e.target.value}); save({ accent_color: e.target.value }); }} />
        </label>
      </div>

      <div className="text-xs text-gray-500">These settings affect your org only.</div>
    </div>
  );
}
