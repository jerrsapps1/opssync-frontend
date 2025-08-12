import React from "react";
import { useSelection } from "@/state/selection";
import { useQuery } from "@tanstack/react-query";
import type { Employee, Equipment } from "@shared/schema";

export default function ProjectCountsBar() {
  const { projectId } = useSelection();
  const { data: employees = [] } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: equipment = [] } = useQuery<Equipment[]>({ queryKey: ["/api/equipment"] });

  if (!projectId) return null;

  const eCount = employees.filter(e => e.currentProjectId === projectId).length;
  const qCount = equipment.filter(e => e.currentProjectId === projectId).length;

  return (
    <div className="flex items-center gap-4 px-3 py-2 bg-[#0f1728] border-b border-gray-800">
      <div className="text-xs text-gray-400">Focused project counts</div>
      <div className="text-sm text-gray-200">Employees: <span className="font-medium">{eCount}</span></div>
      <div className="text-sm text-gray-200">Equipment: <span className="font-medium">{qCount}</span></div>
    </div>
  );
}