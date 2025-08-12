// Removed Chakra UI imports - using Tailwind classes instead
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DragDropContext } from "react-beautiful-dnd";
import { Box, Alert as ChakraAlert, AlertIcon, AlertTitle, AlertDescription as ChakraAlertDescription, CloseButton } from "@chakra-ui/react";
import CommandBar from "@/components/CommandBar";
import { applyActions } from "@/lib/applyActions";
import { ProjectList } from "@/components/assignments/project-list";
import { EmployeeList } from "@/components/assignments/employee-list";
import { EquipmentList } from "@/components/assignments/equipment-list";
import ProjectCountsBar from "@/components/dashboard/ProjectCountsBar";
import { useApp } from "@/App";
import { useDragDrop } from "@/hooks/use-drag-drop";
import { apiRequest } from "@/lib/queryClient";
import type { Project, Employee, Equipment } from "@shared/schema";

function ConflictAlert({ conflicts, onClose }: { conflicts: any; onClose: () => void }) {
  const hasConflicts =
    conflicts.employeeConflicts.length > 0 || conflicts.equipmentConflicts.length > 0;

  if (!hasConflicts) return null;

  return (
    <ChakraAlert status="error" mb={4}>
      <AlertIcon />
      <Box flex="1">
        <AlertTitle mr={2}>Assignment Conflicts Detected!</AlertTitle>
        <ChakraAlertDescription>
          {conflicts.employeeConflicts.length > 0 && (
            <div>
              Employees: {conflicts.employeeConflicts.map((e: any) => e.name).join(", ")}
            </div>
          )}
          {conflicts.equipmentConflicts.length > 0 && (
            <div>
              Equipment: {conflicts.equipmentConflicts.map((e: any) => e.name).join(", ")}
            </div>
          )}
        </ChakraAlertDescription>
      </Box>
      <CloseButton onClick={onClose} />
    </ChakraAlert>
  );
}

export default function Dashboard() {
  const { handleDragEnd, isAssigning } = useDragDrop();
  const appContext = useApp();
  const queryClient = useQueryClient();

  // Provide default conflicts state if context is not available
  const conflicts = appContext?.conflicts || { employeeConflicts: [], equipmentConflicts: [] };
  const alertDismissed = appContext?.alertDismissed || false;
  const setAlertDismissed = appContext?.setAlertDismissed || (() => {});

  const { data: projects = [], isLoading: projectsLoading, error: projectsError } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: employees = [], isLoading: employeesLoading, error: employeesError } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: equipment = [], isLoading: equipmentLoading, error: equipmentError } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const isLoading = projectsLoading || employeesLoading || equipmentLoading;

  // Debug logging
  console.log("Dashboard data:", { 
    projects: projects.length, 
    employees: employees.length, 
    equipment: equipment.length,
    isLoading,
    errors: { projectsError, employeesError, equipmentError }
  });

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
    <>
      {/* Conflict Alerts */}
      {!alertDismissed && (
        <Box p={4}>
          <ConflictAlert 
            conflicts={conflicts} 
            onClose={() => setAlertDismissed(true)} 
          />
        </Box>
      )}

      {/* Command Bar */}
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <CommandBar runActions={handleCommandActions} />
      </div>
      
      {/* Project Counts Bar */}
      <ProjectCountsBar />
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex" style={{ height: "calc(100vh - 168px)" }}>
          <ProjectList projects={projects} />
          <EmployeeList employees={employees} projects={projects} isLoading={isLoading} />
          <EquipmentList equipment={equipment} projects={projects} isLoading={isLoading} />
        </div>
      </DragDropContext>
      
      {/* Debug Info - Remove Later */}
      <div className="fixed bottom-4 right-4 bg-gray-800 p-2 rounded text-xs text-white">
        Projects: {projects.length} | Employees: {employees.length} | Equipment: {equipment.length}
      </div>
      
      {isAssigning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg text-white">
            Updating assignment...
          </div>
        </div>
      )}
    </>
  );
}