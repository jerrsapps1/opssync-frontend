import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import RAGBadge from "../components/RAGBadge";
import TrendBars from "../components/TrendBars";

type Summary = { total: number; GREEN: number; AMBER: number; RED: number; overdue: number; onTimeRate: number };
type ProjectRow = { projectId: string; projectName: string; GREEN: number; AMBER: number; RED: number; overdue: number; onTimeRate: number };
type TrendPoint = { day: string; GREEN: number; AMBER: number; RED: number; total: number };

export default function ManagerDashboard() {
  const [days, setDays] = useState(30);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/manager/overview", days],
    queryFn: async () => {
      const response = await fetch(`/api/manager/overview?days=${days}`);
      if (!response.ok) throw new Error("Failed to fetch manager overview");
      return response.json() as Promise<{ summary: Summary; byProject: ProjectRow[]; trend: TrendPoint[] }>;
    }
  });

  const csvUrl = useMemo(() => `/api/manager/export.csv?days=${days}`, [days]);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Manager Dashboard</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Range:</label>
          <select 
            className="rounded-xl border p-2 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" 
            value={days} 
            onChange={e => setDays(Number(e.target.value))}
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
          </select>
          <a 
            href={csvUrl} 
            className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          >
            Export CSV
          </a>
          <button 
            onClick={() => refetch()} 
            className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          >
            Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : data ? (
        <>
          {data.summary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="rounded-2xl border p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{data.summary.total}</div>
              </div>
              <div className="rounded-2xl border p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">Green</div>
                <div className="text-2xl font-semibold text-green-600">{data.summary.GREEN}</div>
              </div>
              <div className="rounded-2xl border p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">Amber</div>
                <div className="text-2xl font-semibold text-amber-600">{data.summary.AMBER}</div>
              </div>
              <div className="rounded-2xl border p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">Red</div>
                <div className="text-2xl font-semibold text-red-600">{data.summary.RED}</div>
              </div>
              <div className="rounded-2xl border p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">On-Time Rate</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{Math.round(data.summary.onTimeRate * 100)}%</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Daily Trend</h2>
              <TrendBars data={data.trend} height={80} />
            </div>

            <div className="rounded-2xl border p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Project Performance</h2>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {data.byProject.map((project) => (
                  <div key={project.projectId} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{project.projectName}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        On-time: {Math.round(project.onTimeRate * 100)}%
                        {project.overdue > 0 && ` • ${project.overdue} overdue`}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-4">
                      {project.GREEN > 0 && <RAGBadge grade="GREEN" count={project.GREEN} size="sm" />}
                      {project.AMBER > 0 && <RAGBadge grade="AMBER" count={project.AMBER} size="sm" />}
                      {project.RED > 0 && <RAGBadge grade="RED" count={project.RED} size="sm" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-sm text-gray-500">No data available</div>
      )}
    </div>
  );
}