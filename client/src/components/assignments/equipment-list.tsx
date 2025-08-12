import { useMemo, useState } from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { Card } from "@/components/ui/card";
import type { Equipment, Project } from "@shared/schema";

interface EquipmentListProps {
  equipment: Equipment[];
  projects: Project[];
  isLoading?: boolean;
}

export function EquipmentList({ equipment, projects, isLoading }: EquipmentListProps) {
  const [query, setQuery] = useState("");

  if (isLoading) {
    return (
      <div className="flex-1 p-3 overflow-y-auto">
        <h2 className="text-sm font-medium mb-3">Equipment</h2>
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

  const q = query.trim().toLowerCase();
  const filterEq = (e: Equipment) => {
    if (!q) return true;
    return e.name.toLowerCase().includes(q) || e.type.toLowerCase().includes(q);
  };

  return (
    <div className="flex-1 p-3 overflow-y-auto">
      <h2 className="text-sm font-medium mb-3">Equipment</h2>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search equipment or types…"
        className="w-full mb-3 px-3 py-2 rounded bg-gray-800 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
      />
      {Object.entries(grouped).map(([projId, items]) => {
        const visible = useMemo(() => items.filter(filterEq), [items, q]);
        return (
          <Droppable key={projId} droppableId={`equipment-${projId}`}>
            {(provided, snapshot) => (
              <Card
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`mb-6 p-3 min-h-20 border-gray-700 transition-colors ${
                  snapshot.isDraggingOver ? "bg-purple-500/20 border-purple-500" : "bg-gray-800"
                }`}
                data-testid={`equipment-group-${projId}`}
              >
                <div className="font-medium mb-2 text-white">
                  {projId === "unassigned"
                    ? "Unassigned"
                    : projects.find((p) => p.id === projId)?.name || "Unknown Project"}
                </div>

                {visible.map((eq, index) => (
                  <Draggable key={eq.id} draggableId={`eq-${eq.id}`} index={index}>
                    {(dragProvided, dragSnapshot) => (
                      <Card
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        className={`p-2 mb-2 transition-all select-none cursor-move border-none ${
                          dragSnapshot.isDragging ? "bg-purple-500 shadow-lg" : "bg-purple-600 hover:bg-purple-500"
                        }`}
                        data-testid={`equipment-${eq.id}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-orange-500 bg-opacity-20 rounded flex items-center justify-center">
                            <span className="text-orange-500 text-xs">EQ</span>
                          </div>
                          <div className="text-white text-sm">{eq.name}</div>
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
    </div>
  );
}