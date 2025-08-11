import { Droppable, Draggable } from "react-beautiful-dnd";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Employee, Project } from "@shared/schema";

interface EmployeeListProps {
  employees: Employee[];
  projects: Project[];
  isLoading?: boolean;
}

export function EmployeeList({ employees, projects, isLoading }: EmployeeListProps) {
  if (isLoading) {
    return (
      <div className="flex-1 p-3 overflow-y-auto">
        <h2 className="text-sm font-medium mb-3">Employees</h2>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="mb-6 p-3 bg-gray-800 border-gray-700 min-h-20">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded mb-2 w-24"></div>
                <div className="space-y-2">
                  <div className="h-10 bg-gray-700 rounded"></div>
                  <div className="h-10 bg-gray-700 rounded"></div>
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
  projects.forEach((p) => (grouped[p.id] = []));
  grouped["unassigned"] = [];
  
  employees.forEach((emp) => {
    if (emp.currentProjectId && grouped[emp.currentProjectId]) {
      grouped[emp.currentProjectId].push(emp);
    } else {
      grouped["unassigned"].push(emp);
    }
  });

  return (
    <div className="flex-1 p-3 overflow-y-auto">
      <h2 className="text-sm font-medium mb-3">Employees</h2>
      {Object.entries(grouped).map(([projId, emps]) => (
        <Droppable key={projId} droppableId={`employee-${projId}`}>
          {(provided, snapshot) => (
            <Card
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`mb-6 p-3 min-h-20 border-gray-700 transition-colors ${
                snapshot.isDraggingOver 
                  ? "bg-blue-500 bg-opacity-20 border-blue-500" 
                  : "bg-gray-800"
              }`}
              data-testid={`employee-group-${projId}`}
            >
              <div className="font-medium mb-2 text-white">
                {projId === "unassigned"
                  ? "Unassigned"
                  : projects.find((p) => p.id === projId)?.name || "Unknown Project"}
              </div>
              {emps.map((emp, index) => (
                <Draggable
                  key={emp.id}
                  draggableId={`emp-${emp.id}`}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`p-2 mb-2 transition-all select-none cursor-move border-none ${
                        snapshot.isDragging 
                          ? "bg-blue-500 shadow-lg transform rotate-1" 
                          : "bg-blue-600 hover:bg-blue-500"
                      }`}
                      data-testid={`employee-${emp.id}`}
                    >
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-6 h-6">
                          {emp.avatarUrl && (
                            <AvatarImage 
                              src={emp.avatarUrl}
                              className="object-cover"
                            />
                          )}
                          <AvatarFallback className="text-xs">
                            {emp.name.split(' ').map(n => n[0]).join('')}
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
      ))}
    </div>
  );
}