import React from "react";

type Props = {
  grade: "GREEN" | "AMBER" | "RED";
  count?: number;
  size?: "sm" | "md" | "lg";
};

export default function RAGBadge({ grade, count, size = "md" }: Props) {
  const colors = {
    GREEN: "bg-green-100 text-green-800 border-green-200",
    AMBER: "bg-amber-100 text-amber-800 border-amber-200", 
    RED: "bg-red-100 text-red-800 border-red-200"
  };

  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base"
  };

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${colors[grade]} ${sizes[size]}`}>
      {grade}{count !== undefined ? ` (${count})` : ""}
    </span>
  );
}