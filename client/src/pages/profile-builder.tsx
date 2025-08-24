import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { Button } from "../components/ui/button";

type Employee = { id: string; name: string; role?: string; email?: string; phone?: string; yearsExperience?: number; operates?: string[] };
type Equipment = { id: string; name: string; type: string; make?: string; model?: string; year?: number; serialNumber?: string };
type Project = { id: string; name: string; location?: string; status?: string };

async function getEmployees(): Promise<Employee[]> { const r = await apiRequest("GET", "/api/employees"); return r.json(); }
async function getEquipment(): Promise<Equipment[]> { const r = await apiRequest("GET", "/api/equipment"); return r.json(); }
async function getProjects(): Promise<Project[]> { const r = await apiRequest("GET", "/api/projects"); return r.json(); }

export default function ProfileBuilder() {
  const qc = useQueryClient();
  const { data: employees = [] } = useQuery({ queryKey: ["pb-employees"], queryFn: getEmployees });
  const { data: equipment = [] } = useQuery({ queryKey: ["pb-equipment"], queryFn: getEquipment });
  const { data: projects = [] } = useQuery({ queryKey: ["pb-projects"], queryFn: getProjects });

  const [kind, setKind] = React.useState<"employees"|"equipment"|"projects">("employees");
  const list = kind === "employees" ? employees : kind === "equipment" ? equipment : projects;
  const [index, setIndex] = React.useState(0);

  const [form, setForm] = React.useState<any>(null);
  React.useEffect(()=>{ setIndex(0); setForm(list[0]||null); }, [kind, employees.length, equipment.length, projects.length]);

  const save = useMutation({
    mutationFn: async (payload: any) => {
      const base = kind === "employees" ? "/api/employees" : kind === "equipment" ? "/api/equipment" : "/api/projects";
      const r = await apiRequest("PATCH", `${base}/${payload.id}`, payload);
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries();
      next();
    }
  });

  function next() {
    const n = Math.min(index + 1, list.length - 1);
    setIndex(n);
    setForm(list[n] || null);
  }
  function prev() {
    const p = Math.max(index - 1, 0);
    setIndex(p);
    setForm(list[p] || null);
  }

  const title = kind === "employees" ? "Employee" : kind === "equipment" ? "Equipment" : "Project";

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Profile Builder</h1>
          <div className="text-xs text-gray-400">Go through each record to complete key fields</div>
        </div>
        <button className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm" onClick={()=>location.assign("/dashboard")}>← Back to Dashboard</button>
      </div>

      <div className="flex gap-2">
        <button className={`px-3 py-1.5 rounded ${kind==="employees"?"bg-[color:var(--brand-primary)] text-white":"bg-gray-800 text-gray-200"}`} onClick={()=>setKind("employees")}>Employees ({employees.length})</button>
        <button className={`px-3 py-1.5 rounded ${kind==="equipment"?"bg-[color:var(--brand-primary)] text-white":"bg-gray-800 text-gray-200"}`} onClick={()=>setKind("equipment")}>Equipment ({equipment.length})</button>
        <button className={`px-3 py-1.5 rounded ${kind==="projects"?"bg-[color:var(--brand-primary)] text-white":"bg-gray-800 text-gray-200"}`} onClick={()=>setKind("projects")}>Projects ({projects.length})</button>
      </div>

      {!form ? (
        <div className="text-gray-400">No records.</div>
      ) : (
        <div className="rounded border border-gray-800 p-4 bg-[#0b1220]">
          <div className="text-sm text-gray-400 mb-2">Editing {title} ({index+1} of {list.length})</div>
          <div className="grid sm:grid-cols-2 gap-3">
            {kind==="employees" && (
              <>
                <label className="text-sm">Name<input className="w-full px-3 py-2 rounded bg-gray-800 text-white" value={form.name||""} onChange={e=>setForm({...form, name:e.target.value})} /></label>
                <label className="text-sm">Role<input className="w-full px-3 py-2 rounded bg-gray-800 text-white" value={form.role||""} onChange={e=>setForm({...form, role:e.target.value})} /></label>
                <label className="text-sm">Email<input className="w-full px-3 py-2 rounded bg-gray-800 text-white" value={form.email||""} onChange={e=>setForm({...form, email:e.target.value})} /></label>
                <label className="text-sm">Phone<input className="w-full px-3 py-2 rounded bg-gray-800 text-white" value={form.phone||""} onChange={e=>setForm({...form, phone:e.target.value})} /></label>
                <label className="text-sm">Years of Experience<input type="number" className="w-full px-3 py-2 rounded bg-gray-800 text-white" value={form.yearsExperience||0} onChange={e=>setForm({...form, yearsExperience:Number(e.target.value)})} /></label>
              </>
            )}
            {kind==="equipment" && (
              <>
                <label className="text-sm">Name<input className="w-full px-3 py-2 rounded bg-gray-800 text-white" value={form.name||""} onChange={e=>setForm({...form, name:e.target.value})} /></label>
                <label className="text-sm">Type<input className="w-full px-3 py-2 rounded bg-gray-800 text-white" value={form.type||""} onChange={e=>setForm({...form, type:e.target.value})} /></label>
                <label className="text-sm">Make<input className="w-full px-3 py-2 rounded bg-gray-800 text-white" value={form.make||""} onChange={e=>setForm({...form, make:e.target.value})} /></label>
                <label className="text-sm">Model<input className="w-full px-3 py-2 rounded bg-gray-800 text-white" value={form.model||""} onChange={e=>setForm({...form, model:e.target.value})} /></label>
                <label className="text-sm">Year<input type="number" className="w-full px-3 py-2 rounded bg-gray-800 text-white" value={form.year||0} onChange={e=>setForm({...form, year:Number(e.target.value)})} /></label>
                <label className="text-sm">Serial #<input className="w-full px-3 py-2 rounded bg-gray-800 text-white" value={form.serialNumber||""} onChange={e=>setForm({...form, serialNumber:e.target.value})} /></label>
              </>
            )}
            {kind==="projects" && (
              <>
                <label className="text-sm">Name<input className="w-full px-3 py-2 rounded bg-gray-800 text-white" value={form.name||""} onChange={e=>setForm({...form, name:e.target.value})} /></label>
                <label className="text-sm">Location<input className="w-full px-3 py-2 rounded bg-gray-800 text-white" value={form.location||""} onChange={e=>setForm({...form, location:e.target.value})} /></label>
                <label className="text-sm">Status<input className="w-full px-3 py-2 rounded bg-gray-800 text-white" value={form.status||""} onChange={e=>setForm({...form, status:e.target.value})} /></label>
              </>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <Button variant="ghost" onClick={prev} disabled={index===0}>Previous</Button>
            <Button onClick={()=>save.mutate(form)} disabled={save.isPending}>{save.isPending?"Saving…":"Save & Next"}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
