import React from "react";

export type Grade = "GREEN" | "AMBER" | "RED";
export default function RAGBadge({ grade }: { grade: Grade }) {
  const map: Record<Grade, string> = {
    GREEN: "bg-green-100 text-green-800 ring-green-200",
    AMBER: "bg-yellow-100 text-yellow-800 ring-yellow-200",
    RED: "bg-red-100 text-red-800 ring-red-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${map[grade]}`}>
      {grade}
    </span>
  );
}
