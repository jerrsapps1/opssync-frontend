import { useState } from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { Card } from "@/components/ui/card";
import { Wrench, Truck, Hammer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ContextMenu from "@/components/common/ContextMenu";
import ProjectAssignMenu from "@/components/common/ProjectAssignMenu";
import { useAssignmentSync } from "@/hooks/useAssignmentSync";
import { useSelection } from "@/state/selection";
import { buildDroppableId } from "@/dnd/ids";
import { Button } from "@/components/ui/button";
import { StatusIndicator, StatusDot } from "@/components/ui/status-indicator";
import type { Equipment, Project } from "@shared/schema";

interface EquipmentListProps {
  equipment: Equipment[];
  projects: Project[];
  isLoading?: boolean;
}

export function EquipmentList({ equipment, projects, isLoading }: EquipmentListProps) {
  const nav = useNavigate();
  const { setAssignment } = useAssignmentSync("equipment");
  const { projectId } = useSelection();

  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [assignPos, setAssignPos] = useState<{ id: string; x: number; y: number } | null>(null);

  if (isLoading) {
    return (
      <div className="w-72 border-l border-[color:var(--brand-primary)] p-3 overflow-y-auto bg-gray-800">
        <h2 className="text-sm font-medium mb-3">Available Equipment</h2>
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

  // Dashboard shows only unassigned equipment that's not in repair shop
  const availableEquipment = equipment.filter(eq => !eq.currentProjectId && eq.status !== "maintenance");

  // Sort equipment alphabetically by name
  const sortedEquipment = [...availableEquipment].sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  // Use all sorted equipment directly
  const visible = sortedEquipment;

  function openContext(e: React.MouseEvent, id: string) {
    e.preventDefault();
    setMenu({ id, x: e.clientX, y: e.clientY });
  }

  // Get repair shop equipment (equipment marked for repair shop but stored as unassigned)
  const repairShopEquipment = equipment.filter(eq => !eq.currentProjectId && eq.status === "maintenance");

  return (
    <div className="flex-1 border-l border-[color:var(--brand-primary)] p-3 bg-[color:var(--background)]">
      <h2 className="text-sm font-medium mb-3 text-white">
        Available Equipment ({visible.length})
      </h2>

      <Droppable droppableId="equipment">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-1 ${snapshot.isDraggingOver ? "bg-[color:var(--brand-primary)]/10 rounded-lg p-2" : ""}`}
          >
            {visible.map((eq, index) => {
              const IconComponent = getEquipmentIcon(eq.type);

              return (
                <Draggable key={eq.id} draggableId={eq.id} index={index}>
                  {(dragProvided, dragSnapshot) => (
                    <Card
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      className={`p-2 transition-all select-none cursor-move border-gray-600 ${
                        dragSnapshot.isDragging ? "bg-[color:var(--brand-accent)] shadow-lg" : "bg-[color:var(--brand-primary)] hover:brightness-110"
                      }`}
                      data-testid={`equipment-${eq.id}`}
                      onDoubleClick={() => nav(`/directory`)}
                      onContextMenu={(e) => openContext(e, eq.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-[color:var(--brand-accent)]/20 rounded flex items-center justify-center">
                          <IconComponent className="text-[color:var(--brand-accent)]" size={14} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="text-white text-sm font-medium leading-tight">{eq.name}</div>
                            {eq.status !== "available" && <StatusDot status={eq.status} type="equipment" />}
                          </div>
                          <div className="text-xs text-[color:var(--muted-foreground)] font-medium leading-tight">{eq.type}</div>
                          {eq.status !== "available" && <StatusIndicator status={eq.status} type="equipment" size="sm" className="mt-1" />}
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

      {menu && (
        <ContextMenu
          pos={{ x: menu.x, y: menu.y }}
          onClose={() => setMenu(null)}
          items={[
            { label: "View in Directory", onClick: () => { nav(`/directory`); setMenu(null); } },
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
