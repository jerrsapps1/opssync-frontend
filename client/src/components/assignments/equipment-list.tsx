import { useMemo, useState } from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { Card } from "@/components/ui/card";
import { Wrench, Truck, Hammer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ContextMenu from "@/components/common/ContextMenu";
import ProjectAssignMenu from "@/components/common/ProjectAssignMenu";
import { useAssignmentSync } from "@/hooks/useAssignmentSync";
import { useSelection } from "@/state/selection";
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
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [assignPos, setAssignPos] = useState<{ id: string; x: number; y: number } | null>(null);

  if (isLoading) {
    return (
      <div className="w-72 border-l border-[color:var(--brand-primary)] p-3 overflow-y-auto bg-gray-800">
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

  // Focus-based filtering with no-duplicate logic
  const focusedEquipment = equipment.filter(eq => {
    if (!projectId) {
      // No project focused: show only unassigned equipment
      return !eq.currentProjectId || eq.currentProjectId === null;
    } else {
      // Project focused: show only equipment assigned to that project
      return eq.currentProjectId === projectId;
    }
  });

  const q = query.trim().toLowerCase();
  const filterEq = (e: Equipment) => !q || e.name.toLowerCase().includes(q) || e.type.toLowerCase().includes(q);
  const visible = useMemo(() => focusedEquipment.filter(filterEq), [focusedEquipment, q]);

  function openContext(e: React.MouseEvent, id: string) {
    e.preventDefault();
    setMenu({ id, x: e.clientX, y: e.clientY });
  }

  return (
    <div className="w-72 border-l border-[color:var(--brand-primary)] p-3 overflow-y-auto bg-gray-800">
      <h2 className="text-sm font-medium mb-3">
        Equipment {projectId ? `(${projects.find(p => p.id === projectId)?.name || 'Unknown'})` : '(Unassigned)'}
      </h2>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search equipment or types…"
        className="w-full mb-3 px-3 py-2 rounded bg-gray-800 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
      />
      <Droppable droppableId="equipment-list">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-2 ${snapshot.isDraggingOver ? "bg-[color:var(--brand-primary)]/10 rounded-lg p-2" : ""}`}
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
                        dragSnapshot.isDragging ? "bg-[color:var(--brand-accent)] shadow-lg" : "bg-[color:var(--brand-primary)] hover:brightness-110"
                      }`}
                      data-testid={`equipment-${eq.id}`}
                      onDoubleClick={() => nav(`/equipment/${eq.id}`)}
                      onContextMenu={(e) => openContext(e, eq.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-[color:var(--brand-accent)]/20 rounded flex items-center justify-center">
                          <IconComponent className="text-[color:var(--brand-accent)]" size={14} />
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

      {menu && (
        <ContextMenu
          pos={{ x: menu.x, y: menu.y }}
          onClose={() => setMenu(null)}
          items={[
            { label: "Open profile", onClick: () => { nav(`/equipment/${menu.id}`); setMenu(null); } },
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
