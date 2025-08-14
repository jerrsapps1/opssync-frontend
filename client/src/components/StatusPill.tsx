import React from "react";

type Props = { status: "ON_TIME" | "AT_RISK" | "OVERDUE" };
export default function StatusPill({ status }: Props) {
  const label =
    status === "ON_TIME" ? "On Time" : status === "AT_RISK" ? "At Risk" : "Overdue";
  const color =
    status === "ON_TIME"
      ? "bg-green-100 text-green-800 ring-green-200"
      : status === "AT_RISK"
      ? "bg-yellow-100 text-yellow-800 ring-yellow-200"
      : "bg-red-100 text-red-800 ring-red-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${color}`}>
      {label}
    </span>
  );
}
