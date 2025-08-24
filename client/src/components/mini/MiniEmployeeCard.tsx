import React from "react";
import { cn } from "@/lib/utils";
import { StatusIndicator, StatusDot } from "@/components/ui/status-indicator";

export type MiniEmployee = {
  id: string;
  name: string;
  status?: string;
  role?: string;
  years?: number;
  operates?: string[]; // equipment names
  projectName?: string | null;
};

export default function MiniEmployeeCard({ emp, className }: { emp: MiniEmployee; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[var(--brand-radius)] border border-gray-800 bg-[#0b1220] p-3 hover:border-[color:var(--brand-primary)] transition",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="font-medium text-gray-100">{emp.name}</div>
          <StatusDot status={emp.status || "available"} type="employee" />
        </div>
        {emp.projectName && (
          <span className="text-[11px] px-2 py-0.5 rounded bg-[color:var(--brand-primary)]/15 text-gray-200">
            {emp.projectName}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        <StatusIndicator status={emp.role || "Employee"} type="role" size="sm" />
        <StatusIndicator status={emp.status || "available"} type="employee" size="sm" />
      </div>
      <div className="text-xs text-gray-400">{typeof emp.years === "number" ? `${emp.years} yrs exp.` : "- yrs exp."}</div>
      {emp.operates && emp.operates.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {emp.operates.slice(0, 6).map((e, i) => (
            <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-[color:var(--brand-primary)]/15 text-gray-200">{e}</span>
          ))}
          {emp.operates.length > 6 && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-white/10 text-gray-300">+{emp.operates.length - 6}</span>
          )}
        </div>
      )}
    </div>
  );
}
