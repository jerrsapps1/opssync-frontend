import { useEffect, useState } from "react";

type Summary = { total: number; GREEN: number; AMBER: number; RED: number; overdue: number; onTimeRate: number };
type ProjectRow = { projectId: string; projectName: string; GREEN: number; AMBER: number; RED: number; overdue: number; onTimeRate: number };
type TrendPoint = { day: string; GREEN: number; AMBER: number; RED: number; total: number };

export function useManagerOverview(days = 30) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [byProject, setByProject] = useState<ProjectRow[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/manager/overview?days=${days}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSummary(data.summary);
      setByProject(data.byProject);
      setTrend(data.trend);
    } catch (e: any) {
      setError(e?.message || "Failed to load manager overview");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [days]);

  return { loading, error, summary, byProject, trend, reload: load };
}
