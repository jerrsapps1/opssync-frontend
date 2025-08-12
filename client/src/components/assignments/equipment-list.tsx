import { Droppable, Draggable } from "react-beautiful-dnd";
import { Card } from "@/components/ui/card";
import { Wrench, Truck, Hammer } from "lucide-react";
import type { Equipment, Project } from "@shared/schema";

interface EquipmentListProps {
  equipment: Equipment[];
  projects: Project[]; // kept for prop compatibility, not used
  isLoading?: boolean;
}

export function EquipmentList({ equipment, /* projects */, isLoading }: EquipmentListProps) {
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

  return (
    <div className="w-72 border-l border-blue-700 p-3 overflow-y-auto bg-gray-800">
      <h2 className="text-sm font-medium mb-3">Equipment</h2>
      <Droppable droppableId="equipment-list">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-2 ${snapshot.isDraggingOver ? "bg-purple-500/10 rounded-lg p-2" : ""}`}
          >
            {equipment.map((eq, index) => {
              const IconComponent = getEquipmentIcon(eq.type);

              return (
                <Draggable key={eq.id} draggableId={`eq-${eq.id}`} index={index}>
                  {(dragProvided, dragSnapshot) => (
                    <Card
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      className={`p-3 t
