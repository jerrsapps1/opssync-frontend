import { useMemo, useState } from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import ContextMenu from "@/components/common/ContextMenu";
import ProjectAssignMenu from "@/components/common/ProjectAssignMenu";
import { useAssignmentSync } from "@/hooks/useAssignmentSync";
import { useSelection } from "@/state/selection";
import { buildDroppableId } from "@/dnd/ids";
import type { Employee, Project } from "@shared/schema";

interface EmployeeListProps {
  employees: Employee[];
  projects: Project[];
  isLoading?: boolean;
}

export function EmployeeList({ employees, projects, isLoading }: EmployeeListProps) {
  const nav = useNavigate();
  const { setAssignment } = useAssignmentSync("employees");
  const { projectId } = useSelection();
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [assignPos, setAssignPos] = useState<{ id: string; x: number; y: number } | null>(null);

  if (isLoading) {
    return (
      <div className="flex-1 p-3 overflow-y-auto">
        <h2 className="text-sm font-medium mb-3">Employees</h2>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="mb-6 p-3 bg-gray-800 border-gray-700 min-h-20">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded mb-2 w-24" />
                <div className="space-y-2">
                  <div className="h-10 bg-gray-700 rounded" />
                  <div className="h-10 bg-gray-700 rounded" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Dashboard shows only unassigned employees - assigned employees live on project pages
  const availableEmployees = employees.filter(emp => !emp.currentProjectId);
  
  // Debug logging for assignment filtering
  console.log("Employee filtering debug:", { 
    totalEmployees: employees.length, 
    availableEmployees: availableEmployees.length,
    assignedEmployees: employees.filter(emp => emp.currentProjectId).length,
    sampleAssigned: employees.filter(emp => emp.currentProjectId).slice(0, 3).map(emp => ({ name: emp.name, projectId: emp.currentProjectId }))
  });

  const q = query.trim().toLowerCase();
  const filterEmp = (e: Employee) => {
    if (!q) return true;
    const role = (e as any).role || (e as any).title || (e as any).position || "";
    return e.name.toLowerCase().includes(q) || String(role).toLowerCase().includes(q);
  };

  const filteredEmployees = availableEmployees.filter(filterEmp);

  function openContext(e: React.MouseEvent, id: string) {
    e.preventDefault();
    setMenu({ id, x: e.clientX, y: e.clientY });
  }

  return (
    <div className="flex-1 p-3 overflow-y-auto">
      <h2 className="text-sm font-medium mb-3">
        Employees ({filteredEmployees.length})
      </h2>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search employees or roles…"
        className="w-full mb-3 px-3 py-2 rounded bg-gray-800 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
      />
      
      {/* Single employee list - drag to projects */}
      <Droppable droppableId="employees">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-2 ${snapshot.isDraggingOver ? "bg-[color:var(--brand-primary)]/10 rounded-lg p-2" : ""}`}
          >
            {filteredEmployees.map((emp, index) => (
              <Draggable key={emp.id} draggableId={emp.id} index={index}>
                {(dragProvided, dragSnapshot) => (
                  <Card
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    className={`p-3 transition-all select-none cursor-move border-gray-700 ${
                      dragSnapshot.isDragging ? "bg-[color:var(--brand-accent)] shadow-lg" : "bg-gray-800 hover:bg-gray-700"
                    }`}
                    data-testid={`employee-${emp.id}`}
                    onDoubleClick={() => nav(`/employees/${emp.id}`)}
                    onContextMenu={(e) => openContext(e, emp.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        {emp.avatarUrl ? <AvatarImage src={emp.avatarUrl} className="object-cover" /> : null}
                        <AvatarFallback className="text-xs">{emp.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="text-white text-sm font-medium">{emp.name}</div>
                        <div className="text-gray-400 text-xs">{(emp as any).role || "Employee"}</div>
                        {emp.currentProjectId && (
                          <div className="text-blue-400 text-xs mt-1">
                            Assigned: {projects.find(p => p.id === emp.currentProjectId)?.name || "Unknown Project"}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {menu && (
        <ContextMenu
          pos={{ x: menu.x, y: menu.y }}
          onClose={() => setMenu(null)}
          items={[
            { label: "Open profile", onClick: () => { nav(`/employees/${menu.id}`); setMenu(null); } },
            { label: "Assign…", onClick: () => { setAssignPos(menu); setMenu(null); } },
            { label: "Unassign", onClick: async () => { setAssignment(menu.id, null); setMenu(null); } },
          ]}
        />
      )}
      {assignPos && (
        <ProjectAssignMenu
          pos={{ x: assignPos.x, y: assignPos.y }}
          projects={projects}
          onCancel={() => setAssignPos(null)}
          onSelect={async (pid) => { setAssignment(assignPos.id, pid); setAssignPos(null); }}
        />
      )}
    </div>
  );
}
