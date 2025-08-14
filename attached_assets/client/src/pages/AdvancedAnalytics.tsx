import React, { useEffect, useMemo, useState } from "react";

export default function AdvancedAnalytics() {
  const [days, setDays] = useState(90);
  const [rows, setRows] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const t = await fetch(`/api/analytics/projects/trends?days=${days}`, { credentials: "include" }).then(r=>r.json());
    const s = await fetch(`/api/analytics/projects/summary?days=${days}`, { credentials: "include" }).then(r=>r.json());
    setRows(t.rows || []);
    setSummary(s.rows || []);
    if (!projectId && s.rows?.[0]?.project_id) setProjectId(s.rows[0].project_id);
    setLoading(false);
  }
  useEffect(()=>{ load(); }, [days]);

  const projects = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of summary) map.set(r.project_id, r.project_name);
    return Array.from(map.entries());
  }, [summary]);

  const trend = useMemo(() => rows.filter((r:any)=>r.project_id === projectId), [rows, projectId]);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Advanced Analytics</h1>
        <div className="flex items-center gap-2">
          <select className="rounded-xl border p-1.5 text-sm" value={days} onChange={e=>setDays(Number(e.target.value))}>
            <option value={30}>30d</option>
            <option value={60}>60d</option>
            <option value={90}>90d</option>
            <option value={180}>180d</option>
          </select>
          <select className="rounded-xl border p-1.5 text-sm" value={projectId ?? ""} onChange={e=>setProjectId(e.target.value)}>
            {projects.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
          <a className="px-3 py-1.5 rounded-lg border text-sm" href={`/api/manager/export-friendly.csv?days=${days}`}>Export CSV</a>
        </div>
      </div>

      {loading ? <div className="text-sm text-gray-500">Loading…</div> : (
        <div className="rounded-2xl border p-4 overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="py-2 pr-4">Project</th>
                <th className="py-2 pr-2">On time</th>
                <th className="py-2 pr-2">Due soon</th>
                <th className="py-2 pr-2">Late</th>
                <th className="py-2 pr-2">On‑time rate</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((r:any)=> (
                <tr key={r.project_id} className="border-t">
                  <td className="py-2 pr-4">{r.project_name}</td>
                  <td className="py-2 pr-2">{r.on_time}</td>
                  <td className="py-2 pr-2">{r.due_soon}</td>
                  <td className="py-2 pr-2">{r.late}</td>
                  <td className="py-2 pr-2">{Math.round((r.on_time/Math.max(1, r.total))*100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Simple trend placeholder per project (you can swap with your preferred chart lib) */}
      <div className="rounded-2xl border p-4">
        <div className="text-lg font-semibold mb-2">Daily activity (selected project)</div>
        <div className="text-xs text-gray-500 mb-2">On time / Due soon / Late counts per day</div>
        {/* Chart left as simple placeholder to avoid extra deps */}
        <div className="text-sm text-gray-500">Chart placeholder (swap with recharts if you prefer)</div>
      </div>
    </div>
  );
}
