import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import Switch from "../components/Switch";

type Features = { SUPERVISOR:boolean; MANAGER:boolean; SLA:boolean; REMINDERS:boolean; ESCALATIONS:boolean; WEEKLY_DIGEST:boolean };
type Prefs = { email_enabled:boolean; sms_enabled:boolean; daily_digest:boolean; weekly_digest:boolean; timezone:string; escalation_after_hours:number };

export default function OrgSettings() {
  const [features, setFeatures] = useState<Features | null>(null);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const f = await api<{tenantId:string; features: Features}>("/api/org-admin/features");
    setFeatures(f.features);
    const p = await api<Prefs>("/api/org-admin/notifications");
    setPrefs(p);
  }

  useEffect(() => { load(); }, []);

  async function saveFeatures(p: Partial<Features>) {
    setSaving(true);
    try {
      await api("/api/org-admin/features", { method: "POST", body: JSON.stringify({
        supervisor: p.SUPERVISOR, manager: p.MANAGER, sla: p.SLA, reminders: p.REMINDERS, escalations: p.ESCALATIONS, weekly_digest: p.WEEKLY_DIGEST
      })});
      await load();
    } finally { setSaving(false); }
  }

  async function savePrefs(patch: Partial<Prefs>) {
    setSaving(true);
    try {
      await api("/api/org-admin/notifications", { method: "POST", body: JSON.stringify(patch) });
      await load();
    } finally { setSaving(false); }
  }

  if (!features || !prefs) return <div className="p-4 text-sm text-gray-500">Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Organization Settings</h1>

      <div className="rounded-2xl border p-4 space-y-4">
        <h2 className="text-lg font-semibold">Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(["SUPERVISOR","MANAGER","SLA","REMINDERS","ESCALATIONS","WEEKLY_DIGEST"] as const).map(k => (
            <Switch key={k} label={k.replace("_"," ")} checked={features[k]} onChange={v => saveFeatures({ ...features, [k]: v } as any)} />
          ))}
        </div>
        <div className="text-xs text-gray-500">Toggles here override global defaults for your organization only.</div>
      </div>

      <div className="rounded-2xl border p-4 space-y-4">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Switch label="Email" checked={prefs.email_enabled} onChange={v => savePrefs({ email_enabled: v })} />
          <Switch label="SMS" checked={prefs.sms_enabled} onChange={v => savePrefs({ sms_enabled: v })} />
          <Switch label="Daily Digest" checked={prefs.daily_digest} onChange={v => savePrefs({ daily_digest: v })} />
          <Switch label="Weekly Digest" checked={prefs.weekly_digest} onChange={v => savePrefs({ weekly_digest: v })} />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm">Timezone</label>
          <input className="rounded-xl border p-2" value={prefs.timezone} onChange={e => setPrefs({ ...prefs, timezone: e.target.value })} onBlur={() => savePrefs({ timezone: prefs.timezone })} />
          <label className="text-sm">Escalation After (hrs)</label>
          <input type="number" className="w-24 rounded-xl border p-2" value={prefs.escalation_after_hours} onChange={e => setPrefs({ ...prefs, escalation_after_hours: Number(e.target.value) })} onBlur={() => savePrefs({ escalation_after_hours: prefs.escalation_after_hours })} />
        </div>
      </div>
    </div>
  );
}
