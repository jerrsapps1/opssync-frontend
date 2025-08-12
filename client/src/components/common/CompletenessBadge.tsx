import React from "react";

export default function CompletenessBadge({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const color =
    pct === 100 ? "bg-green-600" : pct >= 70 ? "bg-yellow-600" : "bg-red-600";
  return (
    <div className="inline-flex items-center gap-2">
      <div className="w-24 h-2 bg-gray-700 rounded">
        <div className={`h-2 rounded ${color}`} style={{ width: pct + "%" }} />
      </div>
      <span className="text-xs text-gray-300">{pct}%</span>
    </div>
  );
}
