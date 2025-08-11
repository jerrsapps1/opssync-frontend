import { Droppable, Draggable } from "react-beautiful-dnd";
import { Card } from "@/components/ui/card";
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

  // Group equipment by project or unassigned
  const grouped: Record<string, Equipment[]> = {};
  projects.forEach((p) => (grouped[p.id] = []));
  grouped["unassigned"] = [];
  
  equipment.forEach((eq) => {
    if (eq.currentProjectId && grouped[eq.currentProjectId]) {
      grouped[eq.currentProjectId].push(eq);
    } else {
      grouped["unassigned"].push(eq);
    }
  });

  const getEquipmentIcon = (type: string) => {
    if (type.toLowerCase().includes("heavy")) return Truck;
    if (type.toLowerCase().includes("tool") || type.toLowerCase().includes("drill")) return Hammer;
    return Wrench;
  };

  return (
    <div className="w-72 border-l border-blue-700 p-3 overflow-y-auto bg-gray-800">
      <h2 className="text-sm font-medium mb-3">Equipment</h2>
      {Object.entries(grouped).map(([projId, eqs]) => (
        <Droppable key={projId} droppableId={`equipment-${projId}`}>
          {(provided, snapshot) => (
            <Card
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`mb-6 p-3 min-h-20 border-gray-600 transition-colors ${
                snapshot.isDraggingOver 
                  ? "bg-purple-500 bg-opacity-20 border-purple-500" 
                  : "bg-gray-700"
              }`}
              data-testid={`equipment-group-${projId}`}
            >
              <div className="font-medium mb-2 text-white">
                {projId === "unassigned"
                  ? "Unassigned"
                  : projects.find((p) => p.id === projId)?.name || "Unknown Project"}
              </div>
              {eqs.map((eq, index) => {
                const IconComponent = getEquipmentIcon(eq.type);
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
                        className={`p-2 mb-2 transition-all select-none cursor-move border-none ${
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
                          <div className="text-white text-sm">{eq.name}</div>
                        </div>
                      </Card>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </Card>
          )}
        </Droppable>
      ))}
    </div>
  );
}