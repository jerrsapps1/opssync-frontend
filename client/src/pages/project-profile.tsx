import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useDragDrop } from "@/hooks/use-drag-drop";
import { apiRequest } from "@/lib/queryClient";
import type { Project, Employee, Equipment } from "@shared/schema";
import ProjectTemplate from "../../../templates/project-template";

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
  const { handleDragEnd, isAssigning } = useDragDrop();

  const { data: project } = useQuery({ 
    queryKey: ["projects", id], 
    queryFn: () => getProject(id), 
    enabled: !!id 
  });
  const { data: employees = [] } = useQuery({ 
    queryKey: ["/api", "employees"], 
    queryFn: getEmployees
  });
  const { data: equipment = [] } = useQuery({ 
    queryKey: ["/api", "equipment"], 
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

  // Export project data to Excel
  const exportToExcel = () => {
    if (!project) return;
    
    const exportData = {
      projectInfo: {
        name: project.name,
        location: project.location || '',
        startDate: project.startDate ? new Date(project.startDate).toLocaleDateString() : '',
        endDate: project.endDate ? new Date(project.endDate).toLocaleDateString() : '',
        duration: durationDays ? `${durationDays} days` : '',
        status: project.status || 'Active',
        percentComplete: `${pct}%`,
        percentMode: mode
      },
      employees: assignedEmp.map(emp => ({
        id: emp.id,
        name: emp.name,
        role: emp.role || '',
        phone: emp.phone || '',
        email: emp.email || ''
      })),
      equipment: assignedEq.map(eq => ({
        id: eq.id,
        name: eq.name,
        type: eq.type || '',
        model: eq.model || '',
        serialNumber: eq.serialNumber || ''
      }))
    };

    // Create CSV content
    let csvContent = "PROJECT SUMMARY\n";
    csvContent += `Project Name,${project.name}\n`;
    csvContent += `Location,${project.location || ''}\n`;
    csvContent += `Start Date,${project.startDate ? new Date(project.startDate).toLocaleDateString() : ''}\n`;
    csvContent += `End Date,${project.endDate ? new Date(project.endDate).toLocaleDateString() : ''}\n`;
    csvContent += `Duration,${durationDays ? `${durationDays} days` : ''}\n`;
    csvContent += `Status,${project.status || 'Active'}\n`;
    csvContent += `Progress,${pct}%\n\n`;

    csvContent += "ASSIGNED EMPLOYEES\n";
    csvContent += "ID,Name,Role,Phone,Email\n";
    assignedEmp.forEach(emp => {
      csvContent += `${emp.id},"${emp.name}","${emp.role || ''}","${emp.phone || ''}","${emp.email || ''}"\n`;
    });

    csvContent += "\nASSIGNED EQUIPMENT\n";
    csvContent += "ID,Name,Type,Model,Serial Number\n";
    assignedEq.forEach(eq => {
      csvContent += `${eq.id},"${eq.name}","${eq.type || ''}","${eq.model || ''}","${eq.serialNumber || ''}"\n`;
    });

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${project.name}_Project_Export_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {/* Project Template Display */}
      <ProjectTemplate 
        project={project}
        assignedEmployees={assignedEmp}
        assignedEquipment={assignedEq}
        onExport={exportToExcel}
        onBack={() => navigate('/dashboard')}
      />

      {/* Interactive Assignment Sections */}
      <div className="p-4 space-y-4 bg-gray-900 text-white">
        {isAssigning && (
          <div className="text-center text-sm text-blue-400 p-2 bg-blue-900/20 rounded">
            Moving asset...
          </div>
        )}

        {/* Assignment Controls */}
        <div className="grid md:grid-cols-3 gap-3">
        <div className="rounded border border-gray-800 p-3 bg-[#0b1220]">
          <div className="text-xs text-gray-400 mb-2">Duration</div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400 w-12">Start</label>
              <input 
                type="date" 
                value={formatDateForInput(project.startDate)} 
                onChange={e => setDates("startDate", e.target.value)} 
                className="px-2 py-1 rounded bg-gray-800 text-white text-sm border border-gray-600 focus:border-blue-500 focus:outline-none" 
                data-testid="input-start-date"
              />
              <span className="text-xs text-gray-500">
                {project.startDate ? new Date(project.startDate).toLocaleDateString() : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400 w-12">End</label>
              <input 
                type="date" 
                value={formatDateForInput(project.endDate)} 
                onChange={e => setDates("endDate", e.target.value)} 
                className="px-2 py-1 rounded bg-gray-800 text-white text-sm border border-gray-600 focus:border-blue-500 focus:outline-none" 
                data-testid="input-end-date"
              />
              <span className="text-xs text-gray-500">
                {project.endDate ? new Date(project.endDate).toLocaleDateString() : ''}
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-2 font-medium">
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
        {/* Assigned Employees - Droppable for reassignment */}
        <div className="rounded border border-gray-800 p-3 bg-[#0b1220]">
          <div className="font-medium text-white mb-2">
            Assigned Employees ({assignedEmp.length})
          </div>
          <Droppable droppableId="unassigned-employees">
            {(provided, snapshot) => (
              <div 
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`grid sm:grid-cols-2 gap-2 min-h-[80px] rounded-md transition-colors ${
                  snapshot.isDraggingOver ? 'bg-red-900/20 border border-red-600/50' : ''
                }`}
              >
                {assignedEmp.map((e, index) => (
                  <Draggable key={e.id} draggableId={e.id} index={index}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`text-sm text-gray-200 rounded border border-gray-800 p-2 cursor-move transition-all ${
                          snapshot.isDragging ? 'bg-blue-600/30 border-blue-400 shadow-lg' : 'hover:bg-gray-700'
                        }`}
                      >
                        {e.name}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                {assignedEmp.length === 0 && (
                  <div className="text-xs text-gray-400 col-span-2">
                    No employees assigned yet. Drag employees here from dashboard or other projects.
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </div>

        {/* Assigned Equipment - Droppable for reassignment */}
        <div className="rounded border border-gray-800 p-3 bg-[#0b1220]">
          <div className="font-medium text-white mb-2">
            Assigned Equipment ({assignedEq.length})
          </div>
          <Droppable droppableId="unassigned-equipment">
            {(provided, snapshot) => (
              <div 
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`grid sm:grid-cols-2 gap-2 min-h-[80px] rounded-md transition-colors ${
                  snapshot.isDraggingOver ? 'bg-red-900/20 border border-red-600/50' : ''
                }`}
              >
                {assignedEq.map((e, index) => (
                  <Draggable key={e.id} draggableId={e.id} index={index}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`text-sm text-gray-200 rounded border border-gray-800 p-2 flex items-center gap-2 cursor-move transition-all ${
                          snapshot.isDragging ? 'bg-blue-600/30 border-blue-400 shadow-lg' : 'hover:bg-gray-700'
                        }`}
                      >
                        <span>{e.name}</span>
                        {e.assetNumber && (
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-black/30 border border-white/10">
                            {String(e.assetNumber)}
                          </span>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                {assignedEq.length === 0 && (
                  <div className="text-xs text-gray-400 col-span-2">
                    No equipment assigned yet. Drag equipment here from dashboard or other projects.
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </div>
      </div>
    </div>
    </DragDropContext>
  );
}