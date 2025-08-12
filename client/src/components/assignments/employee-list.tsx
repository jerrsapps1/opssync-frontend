import { useMemo, useState } from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ContextMenu from "@/components/common/ContextMenu";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Employee, Project } from "@shared/schema";

interface EmployeeListProps {
  employees: Employee[];
  projects: Project[];
  isLoading?: boolean;
}

export function EmployeeList({ employees, projects, isLoading }: EmployeeListProps) {
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const unassignMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/employees/${id}/assignment`, { currentProjectId: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
    },
  });

  const openMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ id, x: e.clientX, y: e.clientY });
  };

  const handleDoubleClick = (id: string) => {
    navigate(`/employees/${id}`);
  };

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

  // Group employees by project or unassigned
  const grouped: Record<string, Employee[]> = {};
  (projects || []).forEach((p) => (grouped[p.id] = []));
  grouped["unassigned"] = [];
  employees.forEach((emp) => {
    if (emp.currentProjectId && grouped[emp.currentProjectId]) {
      grouped[emp.currentProjectId].push(emp);
    } else {
      grouped["unassigned"].push(emp);
    }
  });

  const q = query.trim().toLowerCase();
  const filterEmp = (e: Employee) => {
    if (!q) return true;
    const role = (e as any).role || (e as any).title || (e as any).position || "";
    return e.name.toLowerCase().includes(q) || String(role).toLowerCase().includes(q);
  };

  return (
    <div className="flex-1 p-3 overflow-y-auto">
      <h2 className="text-sm font-medium mb-3">Employees</h2>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search employees or roles…"
        className="w-full mb-3 px-3 py-2 rounded bg-gray-800 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
      />
      {Object.entries(grouped).map(([projId, emps]) => {
        const visible = useMemo(() => emps.filter(filterEmp), [emps, q]);
        return (
          <Droppable key={projId} droppableId={`employee-${projId}`}>
            {(provided, snapshot) => (
              <Card
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`mb-6 p-3 min-h-20 border-gray-700 transition-colors ${
                  snapshot.isDraggingOver ? "bg-blue-500/20 border-blue-500" : "bg-gray-800"
                }`}
                data-testid={`employee-group-${projId}`}
              >
                <div className="font-medium mb-2 text-white">
                  {projId === "unassigned"
                    ? "Unassigned"
                    : projects.find((p) => p.id === projId)?.name || "Unknown Project"}
                </div>

                {visible.map((emp, index) => (
                  <Draggable key={emp.id} draggableId={`emp-${emp.id}`} index={index}>
                    {(dragProvided, dragSnapshot) => (
                      <Card
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        className="p-2 mb-2 transition-all select-none cursor-move border-none shadow-lg"
                        style={{
                          backgroundColor: dragSnapshot.isDragging 
                            ? 'var(--brand-secondary)' 
                            : 'var(--brand-primary)',
                          color: 'var(--brand-primary-foreground)'
                        }}
                        data-testid={`employee-${emp.id}`}
                        onDoubleClick={() => handleDoubleClick(emp.id)}
                        onContextMenu={(e) => openMenu(e, emp.id)}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            {emp.avatarUrl ? (
                              <AvatarImage src={emp.avatarUrl} className="object-cover" />
                            ) : null}
                            <AvatarFallback className="text-xs">
                              {emp.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-white text-sm">{emp.name}</div>
                        </div>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Card>
            )}
          </Droppable>
        );
      })}

      {/* Context Menu */}
      {menu && (
        <ContextMenu
          pos={{ x: menu.x, y: menu.y }}
          onClose={() => setMenu(null)}
          items={[
            { 
              label: "👤 Open Profile", 
              onClick: () => { 
                navigate(`/employees/${menu.id}`); 
                setMenu(null); 
              } 
            },
            { 
              label: "📋 Unassign from Project", 
              onClick: () => { 
                unassignMutation.mutate(menu.id); 
                setMenu(null); 
              } 
            },
          ]}
        />
      )}
    </div>
  );
}