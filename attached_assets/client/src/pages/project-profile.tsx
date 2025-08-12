import React from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

type Project = {
  id: string;
  name: string;
  location?: string;
  startDate?: string; // ISO
  endDate?: string;   // ISO
  percentComplete?: number; // 0..100
  percentMode?: "auto" | "manual";
  status?: string;
};

type Employee = { id: string; name: string; currentProjectId?: string | null };
type Equipment = { id: string; name: string; type: string; assetNumber?: string | number; currentProjectId?: string | null };

async function getProject(id: string): Promise<Project> { const r = await apiRequest("GET", `/api/projects/${id}`); return r.json(); }
async function getEmployees(): Promise<Employee[]> { const r = await apiRequest("GET", "/api/employees"); return r.json(); }
async function getEquipment(): Promise<Equipment[]> { const r = await apiRequest("GET", "/api/equipment"); return r.json(); }

function daysBetween(a?: string, b?: string) {
  if (!a || !b) return null;
  const d1 = new Date(a).getTime(); const d2 = new Date(b).getTime();
  if (isNaN(d1) || isNaN(d2)) return null;
  return Math.max(0, Math.round((d2 - d1) / (1000*60*60*24)));
}

function elapsedPct(start?: string, end?: string) {
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
  const qc = useQueryClient();

  const { data: project } = useQuery({ queryKey: ["project", id], queryFn: () => getProject(id), enabled: !!id });
  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: getEmployees });
  const { data: equipment = [] } = useQuery({ queryKey: ["equipment"], queryFn: getEquipment });

  const mutate = useMutation({
    mutationFn: async (patch: Partial<Project>) => {
      const r = await apiRequest("PATCH", `/api/projects/${id}`, patch);
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", id] });
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
    const patch: any = { [key]: value };
    if ((project.percentMode ?? "auto") === "auto") {
      // In auto mode just update dates; percent is derived
    }
    mutate.mutate(patch);
  }

  function setMode(m: "auto" | "manual") {
    const patch: any = { percentMode: m };
    if (m === "auto") {
      // Optionally clear percentComplete to avoid confusion
      patch.percentComplete = undefined as any;
    } else {
      // Initialize manual slider from current auto calc if undefined
      patch.percentComplete = typeof project.percentComplete === "number" ? project.percentComplete : autoPct;
    }
    mutate.mutate(patch);
  }

  function setManualPercent(val: number) {
    if ((project.percentMode ?? "auto") === "manual") {
      mutate.mutate({ percentComplete: Math.max(0, Math.min(100, Math.round(val))) });
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{project.name}</h1>
          <div className="text-sm text-gray-400">{project.location || ""}</div>
        </div>
        <a href="/dashboard" className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm">← Back to Dashboard</a>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div className="rounded border border-gray-800 p-3 bg-[#0b1220]">
          <div className="text-xs text-gray-400 mb-1">Duration</div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Start</label>
            <input type="date" value={project.startDate?.slice(0,10) || ""} onChange={e=>setDates("startDate", e.target.value)} className="px-2 py-1 rounded bg-gray-800 text-white" />
            <label className="text-xs text-gray-400 ml-2">End</label>
            <input type="date" value={project.endDate?.slice(0,10) || ""} onChange={e=>setDates("endDate", e.target.value)} className="px-2 py-1 rounded bg-gray-800 text-white" />
          </div>
          <div className="text-xs text-gray-400 mt-2">{durationDays !== null ? `${durationDays} days` : "Set both dates to compute duration"}</div>
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
            <div className="h-2 rounded bg-[color:var(--brand-primary)]" style={{ width: pct + "%" }} />
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="text-xs text-gray-300">{pct}%</div>
            <input
              type="range"
              min={0}
              max={100}
              value={pct}
              onChange={(e)=> setManualPercent(Number(e.target.value))}
              disabled={(project.percentMode ?? "auto") === "auto"}
              className="w-48"
            />
          </div>
          {(project.percentMode ?? "auto") === "auto" && (
            <div className="text-[11px] text-gray-400 mt-1">Auto from dates (elapsed/total). Toggle off to edit manually.</div>
          )}
        </div>

        <div className="rounded border border-gray-800 p-3 bg-[#0b1220]">
          <div className="text-xs text-gray-400 mb-1">Status</div>
          <div className="text-sm text-gray-100">{project.status || "—"}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded border border-gray-800 p-3 bg-[#0b1220]">
          <div className="font-medium text-white mb-2">Assigned Employees ({assignedEmp.length})</div>
          <div className="grid sm:grid-cols-2 gap-2">
            {assignedEmp.map(e => (
              <div key={e.id} className="text-sm text-gray-200 rounded border border-gray-800 p-2">{e.name}</div>
            ))}
            {assignedEmp.length === 0 && <div className="text-xs text-gray-400">No employees assigned yet.</div>}
          </div>
        </div>
        <div className="rounded border border-gray-800 p-3 bg-[#0b1220]">
          <div className="font-medium text-white mb-2">Assigned Equipment ({assignedEq.length})</div>
          <div className="grid sm:grid-cols-2 gap-2">
            {assignedEq.map(e => (
              <div key={e.id} className="text-sm text-gray-200 rounded border border-gray-800 p-2 flex items-center gap-2">
                <span>{e.name}</span>
                {e.assetNumber && <span className="text-[11px] px-1.5 py-0.5 rounded bg-black/30 border border-white/10">{String(e.assetNumber)}</span>}
              </div>
            ))}
            {assignedEq.length === 0 && <div className="text-xs text-gray-400">No equipment assigned yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
