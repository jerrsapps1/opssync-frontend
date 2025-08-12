import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Project, Employee, Equipment } from "@shared/schema";

async function getProject(id: string): Promise<Project> { 
  const r = await apiRequest("GET", `/api/projects/${id}`); 
  return r.json(); 
}
async function getEmployees(): Promise<Employee[]> { 
  const r = await apiRequest("GET", "/api/employees"); 
  return r.json(); 
}
async function getEquipment(): Promise<Equipment[]> { 
  const r = await apiRequest("GET", "/api/equipment"); 
  return r.json(); 
}

function daysBetween(a?: string | Date | null, b?: string | Date | null) {
  if (!a || !b) return null;
  const d1 = new Date(a).getTime(); 
  const d2 = new Date(b).getTime();
  if (isNaN(d1) || isNaN(d2)) return null;
  return Math.max(0, Math.round((d2 - d1) / (1000*60*60*24)));
}

function elapsedPct(start?: string | Date | null, end?: string | Date | null) {
  if (!start || !end) return 0;
  const now = Date.now();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (isNaN(s) || isNaN(e) || e <= s) return 0;
  const p = ((now - s) / (e - s)) * 100;
  return Math.max(0, Math.min(100, Math.round(p)));
}

export default function ProjectProfile() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: project } = useQuery({ 
    queryKey: ["projects", id], 
    queryFn: () => getProject(id), 
    enabled: !!id 
  });
  const { data: employees = [] } = useQuery({ 
    queryKey: ["employees"], 
    queryFn: getEmployees 
  });
  const { data: equipment = [] } = useQuery({ 
    queryKey: ["equipment"], 
    queryFn: getEquipment 
  });

  const mutate = useMutation({
    mutationFn: async (patch: Partial<Project>) => {
      const r = await apiRequest("PATCH", `/api/projects/${id}`, patch);
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", id] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    }
  });

  if (!project) return <div className="p-4 text-gray-400">Loading…</div>;

  const assignedEmp = employees.filter(e => e.currentProjectId === id);
  const assignedEq = equipment.filter(e => e.currentProjectId === id);

  const durationDays = daysBetween(project.startDate, project.endDate);
  const autoPct = elapsedPct(project.startDate, project.endDate);
  const mode = project.percentMode ?? "auto";
  const pct = mode === "auto" ? autoPct : Math.max(0, Math.min(100, Math.round(project.percentComplete ?? 0)));

  function setDates(key: "startDate" | "endDate", value: string) { 
    if (!project) return;
    mutate.mutate({ [key]: value ? new Date(value) : null } as any); 
  }
  function setMode(m: "auto" | "manual") {
    if (!project) return;
    const patch: any = { percentMode: m };
    if (m === "auto") patch.percentComplete = undefined;
    else patch.percentComplete = typeof project.percentComplete === "number" ? project.percentComplete : autoPct;
    mutate.mutate(patch);
  }
  function setManualPercent(val: number) { 
    if (!project || (project.percentMode ?? "auto") !== "manual") return;
    mutate.mutate({ percentComplete: Math.max(0, Math.min(100, Math.round(val))) });
  }

  function setStatus(status: string) {
    mutate.mutate({ status });
  }

  function markCompleted() {
    if (!project) return;
    const today = new Date().toISOString().slice(0,10);
    mutate.mutate({
      status: "Completed",
      percentMode: "manual",
      percentComplete: 100,
      endDate: project.endDate || new Date(today)
    });
  }

  // Format dates for input fields
  const formatDateForInput = (date?: Date | string | null) => {
    if (!date) return "";
    try {
      const d = new Date(date);
      return d.toISOString().slice(0, 10);
    } catch {
      return "";
    }
  };

  return (
    <div className="p-4 space-y-4 bg-gray-900 min-h-screen text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{project.name}</h1>
          <div className="text-sm text-gray-400">{project.location || ""}</div>
        </div>
        <button 
          onClick={() => navigate('/dashboard')} 
          className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm"
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div className="rounded border border-gray-800 p-3 bg-[#0b1220]">
          <div className="text-xs text-gray-400 mb-1">Duration</div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Start</label>
            <input 
              type="date" 
              value={formatDateForInput(project.startDate)} 
              onChange={e => setDates("startDate", e.target.value)} 
              className="px-2 py-1 rounded bg-gray-800 text-white" 
            />
            <label className="text-xs text-gray-400 ml-2">End</label>
            <input 
              type="date" 
              value={formatDateForInput(project.endDate)} 
              onChange={e => setDates("endDate", e.target.value)} 
              className="px-2 py-1 rounded bg-gray-800 text-white" 
            />
          </div>
          <div className="text-xs text-gray-400 mt-2">
            {durationDays !== null ? `${durationDays} days` : "Set both dates to compute duration"}
          </div>
        </div>

        <div className="rounded border border-gray-800 p-3 bg-[#0b1220]">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs text-gray-400">% Complete</div>
            <label className="text-xs text-gray-300 flex items-center gap-2">
              <input
                type="checkbox"
                checked={(project.percentMode ?? "auto") === "auto"}
                onChange={e => setMode(e.target.checked ? "auto" : "manual")}
              />
              Auto‑calc
            </label>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded">
            <div 
              className="h-2 rounded bg-[color:var(--brand-primary)]" 
              style={{ width: pct + "%" }} 
            />
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="text-xs text-gray-300">{pct}%</div>
            <input
              type="range"
              min={0}
              max={100}
              value={pct}
              onChange={(e) => setManualPercent(Number(e.target.value))}
              disabled={(project.percentMode ?? "auto") === "auto"}
              className="w-48"
            />
          </div>
          {(project.percentMode ?? "auto") === "auto" && (
            <div className="text-[11px] text-gray-400 mt-1">
              Auto from dates (elapsed/total). Toggle off to edit manually.
            </div>
          )}
        </div>

        <div className="rounded border border-gray-800 p-3 bg-[#0b1220]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-xs text-gray-400 mb-1">Status</div>
              <select
                value={project.status || "Planned"}
                onChange={(e) => setStatus(e.target.value)}
                className="px-2 py-1 rounded bg-gray-800 text-white"
              >
                <option>Planned</option>
                <option>Active</option>
                <option>Paused</option>
                <option>Completed</option>
              </select>
            </div>
            <button
              onClick={markCompleted}
              className="px-3 py-2 rounded bg-green-600 hover:bg-green-500 text-white text-sm"
              title="Set status to Completed, % to 100, and end date to today (if missing)"
            >
              Mark Completed
            </button>
          </div>
          <div className="text-xs text-gray-400">
            Use the dropdown to change status or quickly mark completed.
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded border border-gray-800 p-3 bg-[#0b1220]">
          <div className="font-medium text-white mb-2">
            Assigned Employees ({assignedEmp.length})
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {assignedEmp.map(e => (
              <div 
                key={e.id} 
                className="text-sm text-gray-200 rounded border border-gray-800 p-2"
              >
                {e.name}
              </div>
            ))}
            {assignedEmp.length === 0 && (
              <div className="text-xs text-gray-400">No employees assigned yet.</div>
            )}
          </div>
        </div>
        <div className="rounded border border-gray-800 p-3 bg-[#0b1220]">
          <div className="font-medium text-white mb-2">
            Assigned Equipment ({assignedEq.length})
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {assignedEq.map(e => (
              <div 
                key={e.id} 
                className="text-sm text-gray-200 rounded border border-gray-800 p-2 flex items-center gap-2"
              >
                <span>{e.name}</span>
                {e.assetNumber && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-black/30 border border-white/10">
                    {String(e.assetNumber)}
                  </span>
                )}
              </div>
            ))}
            {assignedEq.length === 0 && (
              <div className="text-xs text-gray-400">No equipment assigned yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}