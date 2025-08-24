import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/queryClient";
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
      const data = await apiRequest("GET", "/api/supervisor/overview").then(r => r.json());
      setProjects(data.projects);
      setItems(data.items);
      if (!activeProjectId && data.projects.length) setActiveProjectId(data.projects[0].id);
    } catch (error) {
      console.error("Failed to load supervisor data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function acknowledge(id: string) {
    try {
      await apiRequest("POST", `/api/supervisor/ack/${id}`);
      load();
    } catch (error) {
      console.error("Failed to acknowledge item:", error);
    }
  }

  const activeProject = useMemo(
    () => projects.find(p => p.id === activeProjectId) || null,
    [projects, activeProjectId]
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 min-h-screen bg-gradient-to-br from-[#0b1220] to-[#121212]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Supervisor Portal
          </h1>
          <p className="text-gray-400 text-sm mt-1">Project timeliness & safety oversight</p>
        </div>
        <button 
          onClick={load} 
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg text-sm font-medium"
        >
          Refresh Data
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-400">Loading supervisor data...</span>
        </div>
      ) : (
        <>
          {/* Project Selection */}
          <div className="rounded-xl border border-gray-700 bg-gradient-to-r from-[#1a1a2e] to-[#16213e] p-6 shadow-xl">
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
              <div className="space-y-2">
                <div className="text-sm text-gray-400">Active Project</div>
                <div className="text-xl font-semibold text-white">
                  {activeProject?.name || "Select a project"}
                </div>
              </div>
              <select
                className="rounded-lg border border-gray-600 bg-[#0b1220] text-white p-3 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={activeProjectId || ""}
                onChange={(e) => setActiveProjectId(e.target.value || null)}
              >
                <option value="">Select project…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#0b1220]">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            {activeProject && activeProject.startBlocked && (
              <div className="mt-4 rounded-lg border border-yellow-400 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 p-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-yellow-400 font-medium">Project Blocked:</span>
                  <span className="text-gray-300">Start is blocked until pre-start checklist is completed.</span>
                </div>
              </div>
            )}
          </div>

          {/* Timeliness Dashboard */}
          <TimelinessDashboard items={items} onAcknowledge={acknowledge} />

          {/* Forms */}
          {activeProject && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ChecklistForm projectId={activeProject.id} onSubmitted={load} />
              <ChangeRequestForm projectId={activeProject.id} onSubmitted={load} />
            </div>
          )}
        </>
      )}
    </div>
  );
}