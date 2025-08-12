import { useMemo, useState } from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { Card } from "@/components/ui/card";
import { Wrench, Truck, Hammer } from "lucide-react";
import ContextMenu from "@/components/common/ContextMenu";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Equipment, Project } from "@shared/schema";

interface EquipmentListProps {
  equipment: Equipment[];
  projects: Project[]; // not used, kept for prop compatibility
  isLoading?: boolean;
}

export function EquipmentList({ equipment, projects: _projects, isLoading }: EquipmentListProps) {
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const unassignMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/equipment/${id}/assignment`, { currentProjectId: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
    },
  });

  const openMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ id, x: e.clientX, y: e.clientY });
  };

  const handleDoubleClick = (id: string) => {
    navigate(`/equipment/${id}`);
  };

  if (isLoading) {
    return (
      <div className="w-72 border-l border-blue-700 p-3 overflow-y-auto bg-gray-800">
        <h2 className="text-sm font-medium mb-3">Equipment</h2>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="mb-6 p-3 bg-gray-700 border-gray-600 min-h-20">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-600 rounded mb-2 w-24" />
                <div className="space-y-2">
                  <div className="h-10 bg-gray-600 rounded" />
                  <div className="h-10 bg-gray-600 rounded" />
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

  const q = query.trim().toLowerCase();
  const filterEq = (e: Equipment) => !q || e.name.toLowerCase().includes(q) || e.type.toLowerCase().includes(q);

  const visible = useMemo(() => equipment.filter(filterEq), [equipment, q]);

  return (
    <div className="w-72 border-l border-blue-700 p-3 overflow-y-auto bg-gray-800">
      <h2 className="text-sm font-medium mb-3">Equipment</h2>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search equipment or types…"
        className="w-full mb-3 px-3 py-2 rounded bg-gray-800 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
      />
      <Droppable droppableId="equipment-list">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-2 ${snapshot.isDraggingOver ? "bg-purple-500/10 rounded-lg p-2" : ""}`}
          >
            {visible.map((eq, index) => {
              const IconComponent = getEquipmentIcon(eq.type);

              return (
                <Draggable key={eq.id} draggableId={`eq-${eq.id}`} index={index}>
                  {(dragProvided, dragSnapshot) => (
                    <Card
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      className={`p-3 transition-all select-none cursor-move border-gray-600 ${
                        dragSnapshot.isDragging ? "bg-purple-500 shadow-lg" : "bg-blue-600 hover:bg-purple-500"
                      }`}
                      data-testid={`equipment-${eq.id}`}
                      onDoubleClick={() => handleDoubleClick(eq.id)}
                      onContextMenu={(e) => openMenu(e, eq.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-orange-500/20 rounded flex items-center justify-center">
                          <IconComponent className="text-orange-500" size={14} />
                        </div>
                        <div className="flex-1">
                          <div className="text-white text-sm font-medium">{eq.name}</div>
                          <div className="text-xs text-gray-200/80">{eq.type}</div>
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

      {/* Context Menu */}
      {menu && (
        <ContextMenu
          pos={{ x: menu.x, y: menu.y }}
          onClose={() => setMenu(null)}
          items={[
            { 
              label: "🚜 Open Profile", 
              onClick: () => { 
                navigate(`/equipment/${menu.id}`); 
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