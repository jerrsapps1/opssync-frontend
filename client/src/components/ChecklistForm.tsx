import React, { useState } from "react";
import { api } from "../lib/api";

type ChecklistItem = { key: string; label: string; required?: boolean };
type Props = {
  projectId: string;
  items?: ChecklistItem[];
  onSubmitted?: () => void;
};

const DEFAULT_ITEMS: ChecklistItem[] = [
  { key: "scopeDefined", label: "Scope defined & approved", required: true },
  { key: "crewAssigned", label: "Crew assigned & briefed", required: true },
  { key: "permitsReady", label: "Permits acquired/posted", required: true },
  { key: "siteHazards", label: "Site hazards reviewed", required: true },
  { key: "materialsStaged", label: "Materials staged", required: false },
];

export default function ChecklistForm({ projectId, items = DEFAULT_ITEMS, onSubmitted }: Props) {
  const [state, setState] = useState<Record<string, boolean>>(
    Object.fromEntries(items.map(i => [i.key, false]))
  );
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      await api(`/api/supervisor/projects/${projectId}/checklist`, {
        method: "POST",
        body: JSON.stringify({ items: state, note }),
      });
      onSubmitted?.();
    } finally {
      setSaving(false);
    }
  }

  const allRequiredMet = items.every(i => !i.required || state[i.key]);

  return (
    <div className="rounded-2xl border p-4 space-y-4">
      <h3 className="text-lg font-semibold">Pre-Start Checklist</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map(i => (
          <label key={i.key} className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={!!state[i.key]}
              onChange={e => setState(s => ({ ...s, [i.key]: e.target.checked }))}
            />
            <span className="text-sm">
              {i.label} {i.required && <span className="text-red-500">*</span>}
            </span>
          </label>
        ))}
      </div>
      <textarea
        placeholder="Notes (optional)"
        value={note}
        onChange={e => setNote(e.target.value)}
        className="w-full rounded-xl border p-2"
        rows={3}
      />
      <div className="flex items-center justify-between">
        {!allRequiredMet && (
          <div className="text-xs text-red-600">Complete all required items to enable project start.</div>
        )}
        <button
          onClick={submit}
          disabled={saving || !allRequiredMet}
          className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Submit Checklist"}
        </button>
      </div>
    </div>
  );
}
