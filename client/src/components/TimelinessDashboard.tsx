import React from "react";
import StatusPill from "./StatusPill";

export type TimelinessItem = {
  id: string;
  projectName: string;
  type: "UPDATE" | "CHANGE_REQUEST";
  title: string;
  dueAt: string; // ISO
  submittedAt?: string | null;
  status: "ON_TIME" | "AT_RISK" | "OVERDUE";
};

type Props = {
  items: TimelinessItem[];
  onAcknowledge?: (id: string) => void;
};

export default function TimelinessDashboard({ items, onAcknowledge }: Props) {
  return (
    <div className="rounded-2xl border">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="text-lg font-semibold">Timeliness Monitor</h3>
        <div className="text-xs text-gray-500">Auto-refreshes when you take actions</div>
      </div>
      <div className="divide-y">
        {items.map((i) => (
          <div key={i.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3">
            <div className="space-y-1">
              <div className="text-sm font-medium">{i.title}</div>
              <div className="text-xs text-gray-500">
                {i.projectName} • Due {new Date(i.dueAt).toLocaleString()}
                {i.submittedAt && ` • Submitted ${new Date(i.submittedAt).toLocaleString()}`}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusPill status={i.status} />
              <button
                onClick={() => onAcknowledge?.(i.id)}
                className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
              >
                Mark Done
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="px-4 py-6 text-sm text-gray-500">No pending items. You're all set.</div>
        )}
      </div>
    </div>
  );
}
