import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import RAGBadge from "../components/RAGBadge";
import TrendBars from "../components/TrendBars";

type Summary = { total: number; GREEN: number; AMBER: number; RED: number; overdue: number; onTimeRate: number };
type ProjectRow = { projectId: string; projectName: string; GREEN: number; AMBER: number; RED: number; overdue: number; onTimeRate: number };
type TrendPoint = { day: string; GREEN: number; AMBER: number; RED: number; total: number };

export default function ManagerDashboard() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [byProject, setByProject] = useState<ProjectRow[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);

  async function load() {
    setLoading(true);
    try {
      const data = await api<{ summary: Summary; byProject: ProjectRow[]; trend: TrendPoint[] }>(`/api/manager/overview?days=${days}`);
      setSummary(data.summary);
      setByProject(data.byProject);
      setTrend(data.trend);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [days]);

  const csvUrl = useMemo(() => `/api/manager/export.csv?days=${days}`, [days]);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manager Dashboard</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Range:</label>
          <select className="rounded-xl border p-2 text-sm" value={days} onChange={e => setDays(Number(e.target.value))}>
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
          </select>
          <a href={csvUrl} className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50">Export CSV</a>
          <button onClick={load} className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50">Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : (
        <>
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="rounded-2xl border p-4">
                <div className="text-xs text-gray-500">Total</div>
                <div className="text-2xl font-semibold">{summary.total}</div>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="text-xs text-gray-500">Green</div>
                <div className="text-2xl font-semibold">{summary.GREEN}</div>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="text-xs text-gray-500">Amber</div>
                <div className="text-2xl font-semibold">{summary.AMBER}</div>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="text-xs text-gray-500">Red</div>
                <div className="text-2xl font-semibold">{summary.RED}</div>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="text-xs text-gray-500">On-Time Rate</div>
                <div className="text-2xl font-semibold">{Math.round(summary.onTimeRate * 100)}%</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border p-4">
              <h3 className="text-lg font-semibold mb-2">RAG Trend (Daily)</h3>
              <TrendBars data={trend} />
            </div>

            <div className="rounded-2xl border p-4 overflow-auto">
              <h3 className="text-lg font-semibold mb-2">Projects</h3>
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500">
                    <th className="py-2 pr-4">Project</th>
                    <th className="py-2 pr-2">Green</th>
                    <th className="py-2 pr-2">Amber</th>
                    <th className="py-2 pr-2">Red</th>
                    <th className="py-2 pr-2">Overdue</th>
                    <th className="py-2 pr-2">On-Time Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {byProject.map((row) => (
                    <tr key={row.projectId} className="border-t">
                      <td className="py-2 pr-4">{row.projectName}</td>
                      <td className="py-2 pr-2">{row.GREEN}</td>
                      <td className="py-2 pr-2">{row.AMBER}</td>
                      <td className="py-2 pr-2">{row.RED}</td>
                      <td className="py-2 pr-2">{row.overdue}</td>
                      <td className="py-2 pr-2">{Math.round(row.onTimeRate * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
