import React, { useState } from "react";
import { useManagerOverview } from "../hooks/useManagerOverview";
import TrendBars from "../components/TrendBars";
import RAGBadge from "../components/RAGBadge";

export default function DashboardRAGPanel() {
  const [days, setDays] = useState(30);
  const { loading, error, summary, byProject, trend, reload } = useManagerOverview(days);

  return (
    <div className="rounded-2xl border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">SLA / RAG Overview</h3>
        <div className="flex items-center gap-2">
          <select className="rounded-xl border p-1.5 text-sm" value={days} onChange={e => setDays(Number(e.target.value))}>
            <option value={7}>7d</option>
            <option value={14}>14d</option>
            <option value={30}>30d</option>
            <option value={60}>60d</option>
            <option value={90}>90d</option>
          </select>
          <button onClick={reload} className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50">Refresh</button>
          <a href={`/api/manager/export.csv?days=${days}`} className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50">Export CSV</a>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {loading && <div className="text-sm text-gray-500">Loading…</div>}

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="rounded-xl border p-3">
            <div className="text-xs text-gray-500">Total</div>
            <div className="text-xl font-semibold">{summary.total}</div>
          </div>
          <div className="rounded-xl border p-3">
            <div className="text-xs text-gray-500">Green</div>
            <div className="text-xl font-semibold">{summary.GREEN}</div>
          </div>
          <div className="rounded-xl border p-3">
            <div className="text-xs text-gray-500">Amber</div>
            <div className="text-xl font-semibold">{summary.AMBER}</div>
          </div>
          <div className="rounded-xl border p-3">
            <div className="text-xs text-gray-500">Red</div>
            <div className="text-xl font-semibold">{summary.RED}</div>
          </div>
          <div className="rounded-xl border p-3">
            <div className="text-xs text-gray-500">On-Time Rate</div>
            <div className="text-xl font-semibold">{Math.round(summary.onTimeRate * 100)}%</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border p-3">
          <div className="text-sm font-medium mb-2">RAG Trend (Daily)</div>
          <TrendBars data={trend} />
        </div>

        <div className="rounded-xl border p-3 overflow-auto">
          <div className="text-sm font-medium mb-2">Projects</div>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="py-1 pr-4">Project</th>
                <th className="py-1 pr-2">G</th>
                <th className="py-1 pr-2">A</th>
                <th className="py-1 pr-2">R</th>
                <th className="py-1 pr-2">Overdue</th>
                <th className="py-1 pr-2">On-Time</th>
              </tr>
            </thead>
            <tbody>
              {byProject.map((row) => (
                <tr key={row.projectId} className="border-t">
                  <td className="py-1 pr-4">{row.projectName}</td>
                  <td className="py-1 pr-2">{row.GREEN}</td>
                  <td className="py-1 pr-2">{row.AMBER}</td>
                  <td className="py-1 pr-2">{row.RED}</td>
                  <td className="py-1 pr-2">{row.overdue}</td>
                  <td className="py-1 pr-2">{Math.round(row.onTimeRate * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
