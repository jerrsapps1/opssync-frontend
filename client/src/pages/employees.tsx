import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import MiniEmployeeCard from "@/components/mini/MiniEmployeeCard";
import ImportExportPanel from "@/components/common/ImportExportPanel";

type Employee = { id: string; name: string; yearsExperience?: number; operates?: string[]; currentProjectId?: string | null };
type Project = { id: string; name: string };

async function fetchEmployees(): Promise<Employee[]> { const r = await apiRequest("GET", "/api/employees"); return r.json(); }
async function fetchProjects(): Promise<Project[]> { const r = await apiRequest("GET", "/api/projects"); return r.json(); }

export default function EmployeesPage() {
  const { data: employees = [], isLoading, refetch } = useQuery({ queryKey: ["employees"], queryFn: fetchEmployees, refetchOnWindowFocus: true });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });
  const [q, setQ] = React.useState("");

  const projName = React.useMemo(() => Object.fromEntries(projects.map(p => [p.id, p.name])), [projects]);

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return employees;
    return employees.filter(e =>
      e.name.toLowerCase().includes(s) ||
      String(e.yearsExperience || "").includes(s) ||
      (e.operates || []).some(x => x.toLowerCase().includes(s))
    );
  }, [employees, q]);

  function importEmployees(file: File) {
    const body = new FormData();
    body.append("file", file);
    fetch("/api/employees/import", { method: "POST", body }).then(()=>refetch());
  }
  function exportEmployees() { window.location.href = "/api/employees/export"; }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Employees</h1>
        <input
          value={q}
          onChange={e=>setQ(e.target.value)}
          placeholder="Search employees / equipment…"
          className="px-3 py-2 rounded bg-gray-800 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-[color:var(--brand-primary)]"
        />
      </div>

      <ImportExportPanel title="Employees" onImport={importEmployees} onExport={exportEmployees} templateUrl="/templates/employees_template.csv" />

      {isLoading ? (
        <div className="text-gray-400">Loading…</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(emp => (
            <MiniEmployeeCard
              key={emp.id}
              emp={{
                id: emp.id,
                name: emp.name,
                years: emp.yearsExperience,
                operates: emp.operates,
                projectName: emp.currentProjectId ? projName[emp.currentProjectId] || "Unassigned" : "Unassigned"
              }}
            />
          ))}
          {filtered.length === 0 && <div className="text-gray-400">No matches.</div>}
        </div>
      )}
      <div className="text-xs text-gray-500">
        Tip: Double‑click an employee in the <span className="text-gray-300">Dashboard</span> to open their full profile.
      </div>
    </div>
  );
}
