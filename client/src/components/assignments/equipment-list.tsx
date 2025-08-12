import { Droppable, Draggable } from "react-beautiful-dnd";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, Truck, Hammer } from "lucide-react";
import type { Equipment, Project } from "@shared/schema";

interface EquipmentListProps {
  equipment: Equipment[];
  projects: Project[];
  isLoading?: boolean;
}

export function EquipmentList({ equipment, projects, isLoading }: EquipmentListProps) {
  if (isLoading) {
    return (
      <div className="w-72 border-l border-blue-700 p-3 overflow-y-auto bg-gray-800">
        <h2 className="text-sm font-medium mb-3">Equipment</h2>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="mb-6 p-3 bg-gray-700 border-gray-600 min-h-20">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-600 rounded mb-2 w-24"></div>
                <div className="space-y-2">
                  <div className="h-10 bg-gray-600 rounded"></div>
                  <div className="h-10 bg-gray-600 rounded"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getEquipmentIcon = (type: string) => {
    if (type.toLowerCase().includes("heavy")) return Truck;
    if (type.toLowerCase().includes("tool") || type.toLowerCase().includes("drill")) return Hammer;
    return Wrench;
  };

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return null;
    const project = projects.find(p => p.id === projectId);
    return project?.name || "Unknown Project";
  };

  return (
    <div className="w-72 border-l border-blue-700 p-3 overflow-y-auto bg-gray-800">
      <h2 className="text-sm font-medium mb-3">Equipment (Single List)</h2>
      <Droppable droppableId="equipment-list">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-2 ${
              snapshot.isDraggingOver ? "bg-purple-500 bg-opacity-10 rounded-lg p-2" : ""
            }`}
          >
            {equipment.map((eq, index) => {
              const IconComponent = getEquipmentIcon(eq.type);
              const projectName = getProjectName(eq.currentProjectId);
              return (
                <Draggable
                  key={eq.id}
                  draggableId={`eq-${eq.id}`}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`p-3 transition-all select-none cursor-move border-gray-600 ${
                        snapshot.isDragging 
                          ? "bg-purple-500 shadow-lg transform rotate-1" 
                          : "bg-blue-600 hover:bg-purple-500"
                      }`}
                      data-testid={`equipment-${eq.id}`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-orange-500 bg-opacity-20 rounded flex items-center justify-center">
                          <IconComponent className="text-orange-500" size={14} />
                        </div>
                        <div className="flex-1">
                          <div className="text-white text-sm font-medium">{eq.name}</div>
                          <div className="text-xs text-gray-400">{eq.type}</div>
                          {projectName && (
                            <Badge variant="outline" className="text-xs mt-1 bg-green-500/10 text-green-400 border-green-500/30">
                              {projectName}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}