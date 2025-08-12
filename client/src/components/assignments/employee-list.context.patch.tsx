// Replace your EmployeeList with this variant if you want right-click context menu.
import { useMemo, useState } from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import ContextMenu from "@/components/common/ContextMenu";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/lib/queryClient";
import type { Employee, Project } from "@shared/schema";

interface EmployeeListProps {
  employees: Employee[];
  projects: Project[];
  isLoading?: boolean;
}

export function EmployeeList({ employees, projects, isLoading }: EmployeeListProps) {
  const nav = useNavigate();
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  async function unassign(id: string) {
    await apiRequest("PATCH", `/api/employees/${id}/assignment`, { currentProjectId: null });
  }

  function openMenu(e: React.MouseEvent, id: string) {
    e.preventDefault();
    setMenu({ id, x: e.clientX, y: e.clientY });
  }

  // ... keep your existing loading and grouping code

  // Inside your Draggable Card, add:
  // onDoubleClick={() => nav(`/employees/${emp.id}`)}
  // onContextMenu={(e) => openMenu(e, emp.id)}

  // Render the menu at end of component:
  // {menu && (
  //   <ContextMenu
  //     pos={{ x: menu.x, y: menu.y }}
  //     onClose={() => setMenu(null)}
  //     items={[
  //       { label: "Open profile", onClick: () => { nav(`/employees/${menu.id}`); setMenu(null); } },
  //       { label: "Unassign", onClick: () => { unassign(menu.id); setMenu(null); } },
  //     ]}
  //   />
  // )}
}
