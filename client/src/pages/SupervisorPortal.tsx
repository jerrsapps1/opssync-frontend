import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import TimelinessDashboard, { TimelinessItem } from "../components/TimelinessDashboard";
import ChecklistForm from "../components/ChecklistForm";
import ChangeRequestForm from "../components/ChangeRequestForm";

type Project = {
  id: string;
  name: string;
  startBlocked: boolean;
  checklistSubmittedAt?: string | null;
};

export default function SupervisorPortal() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [items, setItems] = useState<TimelinessItem[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const response = await apiRequest("GET", "/api/supervisor/overview");
      const data = await response.json() as { projects: Project[]; items: TimelinessItem[] };
      setProjects(data.projects);
      setItems(data.items);
      if (!activeProjectId && data.projects.length) setActiveProjectId(data.projects[0].id);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function acknowledge(id: string) {
    await apiRequest("POST", `/api/supervisor/ack/${id}`);
    load();
  }

  const activeProject = useMemo(
    () => projects.find(p => p.id === activeProjectId) || null,
    [projects, activeProjectId]
  );

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Supervisor Portal</h1>
        <button onClick={load} className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : (
        <>
          <div className="rounded-2xl border p-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Your Projects</div>
                <div className="text-xl font-semibold">{activeProject?.name || "Select a project"}</div>
              </div>
              <select
                className="rounded-xl border p-2"
                value={activeProjectId || ""}
                onChange={(e) => setActiveProjectId(e.target.value || null)}
              >
                <option value="">Select project…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            {activeProject && activeProject.startBlocked && (
              <div className="mt-3 rounded-xl border border-yellow-300 bg-yellow-50 p-3 text-sm">
                Project start is <strong>blocked</strong> until checklist is submitted.
              </div>
            )}
          </div>

          <TimelinessDashboard items={items} onAcknowledge={acknowledge} />

          {activeProject && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChecklistForm projectId={activeProject.id} onSubmitted={load} />
              <ChangeRequestForm projectId={activeProject.id} onSubmitted={load} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
