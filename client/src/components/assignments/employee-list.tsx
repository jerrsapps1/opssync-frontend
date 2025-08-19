import { useState } from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";
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
  console.log("EmployeeList render:", { employees: employees?.length, isLoading });
  const [, setLocation] = useLocation();
  const { setAssignment } = useAssignmentSync("employees");
  const { projectId } = useSelection();

  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [assignPos, setAssignPos] = useState<{ id: string; x: number; y: number } | null>(null);

  if (isLoading) {
    return (
      <div className="flex-1 p-3 overflow-y-auto">
        <h2 className="text-sm font-medium mb-3">Available Employees</h2>
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
  
  // Sort employees alphabetically by name
  const sortedEmployees = [...availableEmployees].sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  // Use all sorted employees directly
  const filteredEmployees = sortedEmployees;

  function openContext(e: React.MouseEvent, id: string) {
    e.preventDefault();
    setMenu({ id, x: e.clientX, y: e.clientY });
  }

  return (
    <div className="flex-1 p-3 overflow-y-auto">
      <h2 className="text-sm font-medium mb-3 text-white">
        Available Employees ({filteredEmployees.length})
        {filteredEmployees.length === 0 && <span className="text-orange-400"> - No unassigned employees</span>}
      </h2>

      
      {/* Single employee list - drag to projects */}
      <Droppable droppableId="employee-unassigned">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-1 ${snapshot.isDraggingOver ? "bg-[color:var(--brand-primary)]/10 rounded-lg p-2" : ""}`}
          >
            {filteredEmployees.map((emp, index) => (
              <Draggable key={emp.id} draggableId={emp.id} index={index}>
                {(dragProvided, dragSnapshot) => (
                  <Card
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    className={`p-2 transition-all select-none cursor-move border-[color:var(--border)] ${
                      dragSnapshot.isDragging ? "bg-[color:var(--brand-accent)] shadow-lg" : "bg-[color:var(--card)] hover:bg-[color:var(--card)]/80"
                    }`}
                    data-testid={`employee-${emp.id}`}
                    onDoubleClick={() => setLocation(`/directory`)}
                    onContextMenu={(e) => openContext(e, emp.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="text-white text-sm font-medium leading-tight">{emp.name}</div>
                        <div className="text-[color:var(--muted-foreground)] text-xs font-medium leading-tight">{(emp as any).role || "Employee"}</div>
                        {emp.currentProjectId && (
                          <div className="text-[color:var(--brand-primary)] text-xs mt-1 font-medium">
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
            { label: "View in Directory", onClick: () => { setLocation(`/directory`); setMenu(null); } },
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
