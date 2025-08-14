import React, { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

type Props = {
  projectId: string;
  onSubmitted?: () => void;
};
export default function ChangeRequestForm({ projectId, onSubmitted }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      await apiRequest("POST", `/api/supervisor/projects/${projectId}/change-requests`, { title, description, dueAt });
      setTitle(""); setDescription(""); setDueAt("");
      onSubmitted?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <h3 className="text-lg font-semibold">New Change Request</h3>
      <input
        placeholder="Short title"
        className="w-full rounded-xl border p-2"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Describe the change"
        className="w-full rounded-xl border p-2"
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <label className="text-sm">Due:</label>
        <input
          type="datetime-local"
          className="rounded-xl border p-2"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
        />
      </div>
      <button
        onClick={submit}
        disabled={saving || !title}
        className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
      >
        {saving ? "Submitting..." : "Submit Change Request"}
      </button>
    </div>
  );
}
