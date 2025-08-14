import React from "react";

type Point = { day: string; on_time: number; due_soon: number; late: number };
type Props = { data: Point[] };

export default function ProjectTrendChart({ data }: Props) {
  if (!data?.length) return <div className="text-sm text-gray-500">No data</div>;
  // Simple SVG multi-series area (dependency-free)
  const width = 640, height = 160, pad = 24;
  const days = data.length;
  const maxVal = Math.max(1, ...data.map(d => d.on_time + d.due_soon + d.late));
  const x = (i: number) => pad + (i * (width - 2*pad)) / Math.max(1, days - 1);
  const y = (v: number) => height - pad - (v * (height - 2*pad)) / maxVal;

  function seriesPath(key: keyof Point) {
    const pts = data.map((d, i) => `${i===0 ? 'M' : 'L'} ${x(i)} ${y(d[key])}`).join(" ");
    return pts;
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40">
      <path d={seriesPath("on_time")} fill="none" stroke="currentColor" strokeWidth="2" />
      <g transform={`translate(0,0)`} className="text-xs">
        <text x={pad} y={height-6}>Start</text>
        <text x={width-pad-24} y={height-6}>Now</text>
      </g>
    </svg>
  );
}
