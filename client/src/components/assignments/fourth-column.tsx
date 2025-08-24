import React from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { Card } from "@/components/ui/card";
import { Wrench, Truck, Hammer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Equipment } from "@shared/schema";

interface FourthColumnProps {
  isLoading?: boolean;
}

export function FourthColumn({ isLoading = false }: FourthColumnProps) {
  const { data: equipment = [] } = useQuery<Equipment[]>({
    queryKey: ["/api", "equipment"],
  });

  if (isLoading) {
    return (
      <div className="w-1/4 bg-[#1E1E2F] border-l border-gray-700 p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-600 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-600 rounded"></div>
            <div className="h-16 bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const getEquipmentIcon = (type: string) => {
    if (type.toLowerCase().includes("heavy")) return Truck;
    if (type.toLowerCase().includes("tool") || type.toLowerCase().includes("drill")) return Hammer;
    return Wrench;
  };

  // Get equipment in repair shop (status === "maintenance")
  const repairShopEquipment = equipment.filter(eq => eq.status === "maintenance");
  
  // Sort repair shop equipment alphabetically by name
  const sortedRepairShopEquipment = [...repairShopEquipment].sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  return (
    <div className="w-1/4 bg-[#1E1E2F] border-l border-gray-700 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-orange-300 mb-2 flex items-center gap-2">
          🔧 Repair Shop ({sortedRepairShopEquipment.length})
        </h3>
        <p className="text-sm text-gray-400">
          Drop equipment here for maintenance
        </p>
      </div>

      <Droppable droppableId="repair-shop">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-96 rounded-lg border-2 border-dashed transition-colors ${
              snapshot.isDraggingOver
                ? "border-orange-400 bg-orange-900/30"
                : "border-orange-600/50 bg-orange-900/10"
            }`}
          >
            {sortedRepairShopEquipment.length === 0 && (
              <div className="p-4 text-center text-orange-300">
                <div className="text-3xl mb-2">🔧</div>
                <div className="text-sm">
                  {snapshot.isDraggingOver ? "Drop equipment here!" : "Drop equipment for repair"}
                </div>
              </div>
            )}
            
            {sortedRepairShopEquipment.map((eq, index) => {
              const IconComponent = getEquipmentIcon(eq.type);
              return (
                <Draggable key={eq.id} draggableId={eq.id} index={index}>
                  {(dragProvided, dragSnapshot) => (
                    <Card
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      className={`mb-2 p-2 transition-all select-none cursor-move border-orange-600 ${
                        dragSnapshot.isDragging ? "bg-orange-900/50 shadow-lg" : "bg-orange-900/20 hover:bg-orange-900/30"
                      }`}
                      data-testid={`repair-equipment-${eq.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-orange-400/20 rounded flex items-center justify-center">
                          <IconComponent className="text-orange-400" size={14} />
                        </div>
                        <div className="flex-1">
                          <div className="text-orange-200 text-sm font-medium leading-tight">{eq.name}</div>
                          <div className="text-xs text-orange-400 font-medium leading-tight">{eq.type}</div>
                          <div className="text-xs text-orange-500 mt-1">Under Repair</div>
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