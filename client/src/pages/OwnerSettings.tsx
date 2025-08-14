import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

type Flags = { [key: string]: boolean };

export default function OwnerSettings() {
  const [flags, setFlags] = useState<Flags | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  async function load() {
    const f = await api<Flags>("/api/owner-admin/features");
    setFlags(f);
  }

  useEffect(() => { load(); }, []);

  async function setFlag(key: keyof Flags, value: boolean) {
    setSavingKey(key as string);
    try {
      await api("/api/owner-admin/features", { method: "POST", body: JSON.stringify({ key, value }) });
      await load();
    } finally { setSavingKey(null); }
  }

  if (!flags) return <div className="p-4 text-sm text-gray-500">Loading…</div>;

  const keys = Object.keys(flags) as (keyof Flags)[];
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Platform (Owner) Features</h1>
      <div className="rounded-2xl border p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {keys.map(k => (
          <label key={k} className="flex items-center justify-between gap-3">
            <span className="text-sm">{String(k).replace("_"," ")}</span>
            <input type="checkbox" checked={flags[k]} onChange={e => setFlag(k, e.target.checked)} disabled={savingKey === k} />
          </label>
        ))}
      </div>
      <div className="text-xs text-gray-500">Only visible to the platform owner (checked server-side by email match).</div>
    </div>
  );
}
