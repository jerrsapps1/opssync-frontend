import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

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

  async function saveFeatures(patch: Partial<Features>) {
    setSaving(true);
    try {
      await api("/api/org-admin/features", { method: "POST", body: JSON.stringify({
        supervisor: patch.SUPERVISOR, manager: patch.MANAGER, sla: patch.SLA,
        reminders: patch.REMINDERS, escalations: patch.ESCALATIONS, weekly_digest: patch.WEEKLY_DIGEST
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

      <div className="rounded-2xl border p-4 space-y-3">
        <h2 className="text-lg font-semibold">Features</h2>
        {(["SUPERVISOR","MANAGER","SLA","REMINDERS","ESCALATIONS","WEEKLY_DIGEST"] as const).map(k => (
          <label key={k} className="flex items-center justify-between gap-3">
            <span className="text-sm">{k.replace("_"," ")}</span>
            <input
              type="checkbox"
              checked={features[k]}
              onChange={e => saveFeatures({ ...features, [k]: e.target.checked } as any)}
            />
          </label>
        ))}
        <div className="text-xs text-gray-500">These overrides apply only to your organization.</div>
      </div>

      <div className="rounded-2xl border p-4 space-y-3">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">Email</span>
          <input type="checkbox" checked={prefs.email_enabled} onChange={e => savePrefs({ email_enabled: e.target.checked })} />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">SMS</span>
          <input type="checkbox" checked={prefs.sms_enabled} onChange={e => savePrefs({ sms_enabled: e.target.checked })} />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">Daily Digest</span>
          <input type="checkbox" checked={prefs.daily_digest} onChange={e => savePrefs({ daily_digest: e.target.checked })} />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">Weekly Digest</span>
          <input type="checkbox" checked={prefs.weekly_digest} onChange={e => savePrefs({ weekly_digest: e.target.checked })} />
        </label>
        <div className="flex items-center gap-3">
          <label className="text-sm">Timezone</label>
          <input className="rounded-xl border p-2" value={prefs.timezone} onChange={e => setPrefs({ ...prefs, timezone: e.target.value })} onBlur={() => savePrefs({ timezone: prefs.timezone })} />
          <label className="text-sm">Escalation Hours</label>
          <input type="number" className="w-24 rounded-xl border p-2" value={prefs.escalation_after_hours} onChange={e => setPrefs({ ...prefs, escalation_after_hours: Number(e.target.value) })} onBlur={() => savePrefs({ escalation_after_hours: prefs.escalation_after_hours })} />
        </div>
      </div>
    </div>
  );
}
