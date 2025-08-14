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
  const onTimeCount = items.filter(i => i.status === "ON_TIME").length;
  const atRiskCount = items.filter(i => i.status === "AT_RISK").length;
  const overdueCount = items.filter(i => i.status === "OVERDUE").length;

  return (
    <div className="rounded-xl border border-gray-700 bg-gradient-to-r from-[#1a1a2e] to-[#16213e] shadow-xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
        <div>
          <h3 className="text-lg font-semibold text-white">Timeliness Monitor</h3>
          <p className="text-xs text-gray-400">Real-time project status tracking</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-400">{onTimeCount} On Time</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-yellow-400">{atRiskCount} At Risk</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-red-400">{overdueCount} Overdue</span>
          </div>
        </div>
      </div>
      
      <div className="divide-y divide-gray-700">
        {items.map((i) => (
          <div key={i.id} className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 px-6 py-4 hover:bg-white/5 transition-colors">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium text-white">{i.title}</div>
                <span className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300">
                  {i.type.replace('_', ' ')}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                <span className="text-blue-400">{i.projectName}</span>
                <span className="mx-2">•</span>
                <span>Due {new Date(i.dueAt).toLocaleDateString()} at {new Date(i.dueAt).toLocaleTimeString()}</span>
                {i.submittedAt && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="text-green-400">Submitted {new Date(i.submittedAt).toLocaleString()}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusPill status={i.status} />
              {!i.submittedAt && (
                <button
                  onClick={() => onAcknowledge?.(i.id)}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 text-sm font-medium transition-all duration-200 shadow-lg"
                  data-testid={`button-mark-done-${i.id}`}
                >
                  Mark Done
                </button>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="px-6 py-12 text-center">
            <div className="text-gray-500 mb-2">🎉</div>
            <div className="text-sm text-gray-400">No pending items. All projects are on track!</div>
          </div>
        )}
      </div>
    </div>
  );
}