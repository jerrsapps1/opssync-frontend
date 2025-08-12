import { useState } from "react";

type Action =
  | { type: "move_employee"; employee_query: string; project: string }
  | { type: "assign_equipment"; equipment_query: string; project: string }
  | { type: "list_unassigned"; date?: string };

export default function CommandBar({
  runActions,
}: {
  runActions: (actions: Action[]) => void;
}) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    try {
      const r = await fetch("/api/nl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: q }),
      });
      const data = await r.json();
      runActions(Array.isArray(data.actions) ? data.actions : []);
      setQ("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex gap-2 mb-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder='Try: "move John Smith to Downtown Mall"'
        className="flex-1 px-3 py-2 rounded bg-gray-800 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        className="px-3 py-2 rounded text-white disabled:opacity-60"
        style={{ backgroundColor: 'var(--brand-primary)', color: 'var(--brand-primary-foreground)' }}
        disabled={loading}
      >
        {loading ? "…" : "Run"}
      </button>
    </form>
  );
}