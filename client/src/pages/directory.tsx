import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import CompletenessBadge from "@/components/common/CompletenessBadge";
import ContextMenu from "@/components/common/ContextMenu";
import ProjectAssignMenu from "@/components/common/ProjectAssignMenu";
import { useNavigate } from "react-router-dom";
import type { Project } from "@shared/schema";

type Employee = { id: string; name: string; role?: string; email?: string; phone?: string; yearsExperience?: number; operates?: string[]; currentProjectId?: string | null };
type Equipment = { id: string; name: string; type: string; make?: string; model?: string; year?: number; serialNumber?: string; currentProjectId?: string | null };
type ProjectRow = { id: string; name: string; location?: string; status?: string };

async function getEmployees(): Promise<Employee[]> { const r = await apiRequest("GET", "/api/employees"); return r.json(); }
async function getEquipment(): Promise<Equipment[]> { const r = await apiRequest("GET", "/api/equipment"); return r.json(); }
async function getProjects(): Promise<ProjectRow[]> { const r = await apiRequest("GET", "/api/projects"); return r.json(); }
async function patch(path: string, body: any) { return apiRequest("PATCH", path, body); }

function employeeCompleteness(e: Employee) {
  const fields = [e.role, e.email, e.phone, e.yearsExperience, (e.operates||[]).length>0];
  const req = fields.length;
  const have = fields.filter(Boolean).length;
  return (have / req) * 100;
}
function equipmentCompleteness(e: Equipment) {
  const fields = [e.type, e.make, e.model, e.year, e.serialNumber];
  const req = fields.length;
  const have = fields.filter(Boolean).length;
  return (have / req) * 100;
}
function projectCompleteness(p: ProjectRow) {
  const fields = [p.location, p.status];
  const req = fields.length;
  const have = fields.filter(Boolean).length;
  return (have / req) * 100;
}

export default function DirectoryPage({ projects: projectsProp }: { projects?: Project[] }) {
  const nav = useNavigate();
  const [tab, setTab] = React.useState<"employees"|"equipment"|"projects">("employees");
  const { data: employees = [] } = useQuery({ queryKey: ["dir-employees"], queryFn: getEmployees });
  const { data: equipment = [] } = useQuery({ queryKey: ["dir-equipment"], queryFn: getEquipment });
  const { data: projects = [] } = useQuery({ queryKey: ["dir-projects"], queryFn: getProjects });
  const [menu, setMenu] = React.useState<{ kind: "emp"|"eq"; id: string; x: number; y: number }|null>(null);
  const [assignPos, setAssignPos] = React.useState<{ id: string; x: number; y: number }|null>(null);

  function assign(kind: "emp"|"eq", id: string, to: string|null) {
    if (kind === "emp") return patch(`/api/employees/${id}/assignment`, { currentProjectId: to });
    return patch(`/api/equipment/${id}/assignment`, { currentProjectId: to });
  }

  const TabBtn = ({id,label}:{id:"employees"|"equipment"|"projects";label:string}) => (
    <button
      className={`px-3 py-1.5 rounded-[var(--brand-radius)] text-sm mr-2 ${tab===id?"bg-[color:var(--brand-primary)] text-white":"bg-gray-800 text-gray-200 hover:brightness-110"}`}
      onClick={()=>setTab(id)}
    >{label}</button>
  );

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold mr-3">Directory</h1>
          <TabBtn id="employees" label="Employees" />
          <TabBtn id="equipment" label="Equipment" />
          <TabBtn id="projects" label="Projects" />
        </div>
        <button className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm" onClick={()=>nav("/dashboard")}>
          ← Back to Dashboard
        </button>
      </div>

      {tab==="employees" && (
        <div className="rounded border border-gray-800 overflow-hidden">
          <Table>
            <THead>
              <TR><TH>Name</TH><TH>Role</TH><TH>Years</TH><TH>Operates</TH><TH>Assigned</TH><TH>Complete</TH></TR>
            </THead>
            <TBody>
              {employees.map(e => (
                <TR key={e.id}
                  onDoubleClick={()=>nav(`/employees/${e.id}`)}
                  onContextMenu={(ev)=>{ev.preventDefault(); setMenu({kind:"emp", id:e.id, x:ev.clientX, y:ev.clientY});}}
                  className="cursor-default"
                >
                  <TD>{e.name}</TD>
                  <TD>{e.role || "-"}</TD>
                  <TD>{e.yearsExperience ?? "-"}</TD>
                  <TD className="max-w-[280px]">
                    {(e.operates||[]).slice(0,6).map((o,i)=>(<span key={i} className="text-[11px] px-2 py-0.5 rounded bg-[color:var(--brand-primary)]/15 text-gray-200 mr-1">{o}</span>))}
                    {(e.operates||[]).length>6 && <span className="text-[11px] px-2 py-0.5 rounded bg-white/10 text-gray-300">+{(e.operates||[]).length-6}</span>}
                  </TD>
                  <TD>{projects.find(p=>p.id===e.currentProjectId)?.name || "Unassigned"}</TD>
                  <TD><CompletenessBadge value={employeeCompleteness(e)} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}

      {tab==="equipment" && (
        <div className="rounded border border-gray-800 overflow-hidden">
          <Table>
            <THead>
              <TR><TH>Name</TH><TH>Type</TH><TH>Make / Model</TH><TH>Year</TH><TH>Assigned</TH><TH>Complete</TH></TR>
            </THead>
            <TBody>
              {equipment.map(e => (
                <TR key={e.id}
                  onDoubleClick={()=>nav(`/equipment/${e.id}`)}
                  onContextMenu={(ev)=>{ev.preventDefault(); setMenu({kind:"eq", id:e.id, x:ev.clientX, y:ev.clientY});}}
                  className="cursor-default"
                >
                  <TD>{e.name}</TD>
                  <TD>{e.type}</TD>
                  <TD>{[e.make, e.model].filter(Boolean).join(" / ") || "-"}</TD>
                  <TD>{e.year || "-"}</TD>
                  <TD>{projects.find(p=>p.id===e.currentProjectId)?.name || "Unassigned"}</TD>
                  <TD><CompletenessBadge value={equipmentCompleteness(e)} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}

      {tab==="projects" && (
        <div className="rounded border border-gray-800 overflow-hidden">
          <Table>
            <THead>
              <TR><TH>Name</TH><TH>Location</TH><TH>Status</TH><TH>Complete</TH></TR>
            </THead>
            <TBody>
              {projects.map(p => (
                <TR key={p.id}>
                  <TD>{p.name}</TD>
                  <TD>{p.location || "-"}</TD>
                  <TD>{p.status || "-"}</TD>
                  <TD><CompletenessBadge value={projectCompleteness(p)} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}

      {menu && (
        <ContextMenu
          pos={{ x: menu.x, y: menu.y }}
          onClose={()=>setMenu(null)}
          items={[
            { label: "Open profile", onClick: ()=>{ nav(menu.kind==="emp"?`/employees/${menu.id}`:`/equipment/${menu.id}`); setMenu(null);} },
            { label: "Assign…", onClick: ()=>{ setAssignPos({ id: menu.id, x: menu.x, y: menu.y }); setMenu(null);} },
            { label: "Unassign", onClick: async ()=>{ await assign(menu.kind, menu.id, null); setMenu(null);} },
          ]}
        />
      )}
      {assignPos && (
        <ProjectAssignMenu
          pos={{ x: assignPos.x, y: assignPos.y }}
          projects={projects as any}
          onCancel={()=>setAssignPos(null)}
          onSelect={async (pid)=>{ if(menu) await assign(menu.kind, assignPos.id, pid); setAssignPos(null);}}
        />
      )}
    </div>
  );
}
