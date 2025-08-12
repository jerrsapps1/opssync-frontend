// Removed Chakra UI imports - using Tailwind classes instead
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DragDropContext } from "react-beautiful-dnd";
import CommandBar from "@/components/CommandBar";
import { applyActions } from "@/lib/applyActions";
import { ProjectList } from "@/components/assignments/project-list";
import { EmployeeList } from "@/components/assignments/employee-list";
import { EquipmentList } from "@/components/assignments/equipment-list";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useDragDrop } from "@/hooks/use-drag-drop";
import { apiRequest } from "@/lib/queryClient";
import type { Project, Employee, Equipment } from "@shared/schema";

export default function Dashboard() {
  const { handleDragEnd, isAssigning } = useDragDrop();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: equipment = [], isLoading: equipmentLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const isLoading = projectsLoading || employeesLoading || equipmentLoading;

  const handleCommandActions = (actions: any[]) => {
    applyActions({
      actions,
      findEmployeeByQuery: (q) => {
        const qq = q.toLowerCase();
        return employees.find((e: any) => e.name.toLowerCase().includes(qq));
      },
      findEquipmentByQuery: (q) => {
        const qq = q.toLowerCase();
        return equipment.find(
          (x: any) =>
            x.name.toLowerCase().includes(qq) ||
            x.type.toLowerCase().includes(qq)
        );
      },
      moveEmployee: async (employeeId, projectName) => {
        const dest = projects.find(
          (p: any) => p.name.toLowerCase() === projectName.toLowerCase()
        );
        if (!dest) return;
        await apiRequest("PATCH", `/api/employees/${employeeId}/assignment`, {
          currentProjectId: dest.id,
        });
        await Promise.allSettled([queryClient.invalidateQueries()]);
      },
      assignEquipment: async (equipmentId, projectName) => {
        const dest = projects.find(
          (p: any) => p.name.toLowerCase() === projectName.toLowerCase()
        );
        if (!dest) return;
        await apiRequest("PATCH", `/api/equipment/${equipmentId}/assignment`, {
          currentProjectId: dest.id,
        });
        await Promise.allSettled([queryClient.invalidateQueries()]);
      },
      showUnassigned: (date) => {
        console.log("Unassigned requested for", date);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        Loading StaffTrak...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* keep your existing header / CommandBar / grid exactly as-is */}
        {/** BEGIN original dashboard content **/}
        {/* Command Bar */}
        <div className="p-4 bg-gray-800 border-b border-gray-700">
          <CommandBar runActions={handleCommandActions} />
        </div>
        
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex" style={{ height: "calc(100vh - 120px)" }}>
            <ProjectList projects={projects} />
            <EmployeeList employees={employees} projects={projects} />
            <EquipmentList equipment={equipment} projects={projects} />
          </div>
        </DragDropContext>
        {/** END original dashboard content **/}
        
        {isAssigning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg text-white">
              Updating assignment...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}