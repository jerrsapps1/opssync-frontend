import React from "react";

type DayPoint = { day: string; GREEN: number; AMBER: number; RED: number; total: number };

export default function TrendBars({ data }: { data: DayPoint[] }) {
  if (!data?.length) return <div className="text-sm text-gray-500">No data</div>;
  return (
    <div className="space-y-2">
      {data.map((d) => {
        const gPct = d.total ? (d.GREEN / d.total) * 100 : 0;
        const aPct = d.total ? (d.AMBER / d.total) * 100 : 0;
        const rPct = d.total ? (d.RED / d.total) * 100 : 0;
        return (
          <div key={d.day}>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>{new Date(d.day).toLocaleDateString()}</span>
              <span>{d.total} items</span>
            </div>
            <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden ring-1 ring-inset ring-gray-200">
              <div className="h-full bg-green-500" style={{ width: `${gPct}%` }} />
              <div className="h-full bg-yellow-500" style={{ width: `${aPct}%`, marginTop: "-0.75rem" }} />
              <div className="h-full bg-red-500" style={{ width: `${rPct}%`, marginTop: "-0.75rem" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
