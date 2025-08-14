import React from "react";

type TrendPoint = { day: string; GREEN: number; AMBER: number; RED: number; total: number };

type Props = {
  data: TrendPoint[];
  height?: number;
};

export default function TrendBars({ data, height = 60 }: Props) {
  if (!data.length) return <div className="text-gray-500 text-sm">No data</div>;

  const maxTotal = Math.max(...data.map(d => d.total));

  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((point, i) => {
        const barHeight = maxTotal > 0 ? (point.total / maxTotal) * height : 0;
        const greenPct = point.total > 0 ? (point.GREEN / point.total) * 100 : 0;
        const amberPct = point.total > 0 ? (point.AMBER / point.total) * 100 : 0;
        const redPct = point.total > 0 ? (point.RED / point.total) * 100 : 0;

        return (
          <div
            key={i}
            className="relative bg-gray-100 rounded-sm min-w-[8px] flex-1"
            style={{ height: Math.max(barHeight, 2) }}
            title={`${new Date(point.day).toLocaleDateString()}: ${point.total} items (G:${point.GREEN}, A:${point.AMBER}, R:${point.RED})`}
          >
            <div className="absolute bottom-0 left-0 right-0 flex flex-col">
              {point.RED > 0 && (
                <div 
                  className="bg-red-500 rounded-sm"
                  style={{ height: `${redPct}%` }}
                />
              )}
              {point.AMBER > 0 && (
                <div 
                  className="bg-amber-500 rounded-sm"
                  style={{ height: `${amberPct}%` }}
                />
              )}
              {point.GREEN > 0 && (
                <div 
                  className="bg-green-500 rounded-sm"
                  style={{ height: `${greenPct}%` }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}