import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Project = { id: string; name: string; location?: string; notes?: string };
type Contact = { id?: string; projectId: string; name: string; role?: string; phone?: string; email?: string };

async function fetchProjects(): Promise<Project[]> {
  const r = await apiRequest("GET", "/api/projects");
  return r.json();
}
async function fetchContacts(projectId: string): Promise<Contact[]> {
  const r = await apiRequest("GET", `/api/projects/${projectId}/contacts`);
  return r.json();
}
async function upsertContact(c: Contact) {
  const r = await apiRequest("POST", `/api/projects/${c.projectId}/contacts`, c);
  return r.json();
}

export default function ProjectSettings() {
  const qc = useQueryClient();
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });
  const [selected, setSelected] = React.useState<string | null>(null);
  const { data: contacts = [] } = useQuery({
    queryKey: ["projectContacts", selected],
    queryFn: () => fetchContacts(selected!),
    enabled: !!selected,
  });

  const [form, setForm] = React.useState<Contact | null>(null);
  React.useEffect(() => {
    if (selected) setForm({ projectId: selected, name: "" });
  }, [selected]);

  const save = useMutation({ mutationFn: upsertContact, onSuccess: () => qc.invalidateQueries({ queryKey: ["projectContacts", selected] as any }) });

  return (
    <div className="p-4 grid lg:grid-cols-2 gap-6">
      <div>
        <h2 className="font-medium mb-2">Projects</h2>
        <ul className="space-y-1">
          {projects.map(p => (
            <li key={p.id}>
              <button
                className={`w-full text-left px-3 py-2 rounded border ${selected===p.id ? "border-[color:var(--brand-primary)] bg-[color:var(--brand-primary)]/10" : "border-gray-800 hover:bg-white/[.04]"}`}
                onClick={() => setSelected(p.id)}
              >
                <div className="font-medium">{p.name}</div>
                {p.location && <div className="text-xs text-gray-400">{p.location}</div>}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-3">
        <h2 className="font-medium mb-2">Contact Persons</h2>
        {!selected && <div className="text-sm text-gray-400">Select a project to manage contacts.</div>}
        {selected && (
          <div className="space-y-4">
            <div className="space-y-2">
              {contacts.map((c) => (
                <div key={c.id} className="p-3 rounded border border-gray-800">
                  <div className="font-medium">{c.name} <span className="text-xs text-gray-400">{c.role}</span></div>
                  <div className="text-xs text-gray-400">{c.email} {c.phone ? "• " + c.phone : ""}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-800 pt-3">
              <div className="font-medium mb-2">Add / Update Contact</div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Input placeholder="Name" value={form?.name || ""} onChange={(e)=>setForm(f=>({...f!, name:e.target.value}))} />
                <Input placeholder="Role" value={form?.role || ""} onChange={(e)=>setForm(f=>({...f!, role:e.target.value}))} />
                <Input placeholder="Email" type="email" value={form?.email || ""} onChange={(e)=>setForm(f=>({...f!, email:e.target.value}))} />
                <Input placeholder="Phone" value={form?.phone || ""} onChange={(e)=>setForm(f=>({...f!, phone:e.target.value}))} />
              </div>
              <div className="mt-3">
                <Button onClick={()=> form && save.mutate(form)} disabled={save.isPending || !form?.name}>Save Contact</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
