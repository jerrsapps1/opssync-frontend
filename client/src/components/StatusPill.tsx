import React from "react";

type Props = {
  status: "ON_TIME" | "AT_RISK" | "OVERDUE";
};

export default function StatusPill({ status }: Props) {
  const variants = {
    ON_TIME: {
      bg: "bg-gradient-to-r from-green-500 to-emerald-500",
      text: "text-white",
      label: "On Time"
    },
    AT_RISK: {
      bg: "bg-gradient-to-r from-yellow-500 to-amber-500", 
      text: "text-white",
      label: "At Risk"
    },
    OVERDUE: {
      bg: "bg-gradient-to-r from-red-500 to-rose-500",
      text: "text-white", 
      label: "Overdue"
    }
  };

  const variant = variants[status];

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-lg ${variant.bg} ${variant.text}`}>
      {variant.label}
    </span>
  );
}