// Replace your EquipmentList with this variant if you want right-click context menu.
import { useMemo, useState } from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { Card } from "@/components/ui/card";
import { Wrench, Truck, Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";
import ContextMenu from "@/components/common/ContextMenu";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/lib/queryClient";
import type { Equipment, Project } from "@shared/schema";

interface EquipmentListProps {
  equipment: Equipment[];
  projects: Project[];
  isLoading?: boolean;
}

export function EquipmentList({ equipment, projects, isLoading }: EquipmentListProps) {
  const nav = useNavigate();
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  async function unassign(id: string) {
    await apiRequest("PATCH", `/api/equipment/${id}/assignment`, { currentProjectId: null });
  }

  function openMenu(e: React.MouseEvent, id: string) {
    e.preventDefault();
    setMenu({ id, x: e.clientX, y: e.clientY });
  }

  // ... keep your existing code

  // On card: onDoubleClick={() => nav(`/equipment/${eq.id}`)} onContextMenu={(e)=>openMenu(e, eq.id)}

  // Render menu:
  // {menu && (
  //   <ContextMenu
  //     pos={{ x: menu.x, y: menu.y }}
  //     onClose={() => setMenu(null)}
  //     items={[
  //       { label: "Open profile", onClick: () => { nav(`/equipment/${menu.id}`); setMenu(null); } },
  //       { label: "Unassign", onClick: () => { unassign(menu.id); setMenu(null); } },
  //     ]}
  //   />
  // )}
}
