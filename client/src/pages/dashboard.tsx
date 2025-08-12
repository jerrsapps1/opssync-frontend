// Removed Chakra UI imports - using Tailwind classes instead
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DragDropContext } from "react-beautiful-dnd";
import { Box, Alert as ChakraAlert, AlertIcon, AlertTitle, AlertDescription as ChakraAlertDescription, CloseButton } from "@chakra-ui/react";

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
    queryKey: ["/api", "projects"],
  });

  const { data: employees = [], isLoading: employeesLoading, error: employeesError } = useQuery<Employee[]>({
    queryKey: ["/api", "employees"],
  });

  const { data: equipment = [], isLoading: equipmentLoading, error: equipmentError } = useQuery<Equipment[]>({
    queryKey: ["/api", "equipment"],
  });

  const isLoading = projectsLoading || employeesLoading || equipmentLoading;

  // Calculate filtered counts for dashboard display
  const unassignedEmployees = employees.filter(emp => !emp.currentProjectId);
  const unassignedEquipment = equipment.filter(eq => !eq.currentProjectId);
  
  // Debug logging
  console.log("Dashboard data:", { 
    projects: projects.length, 
    unassignedEmployees: unassignedEmployees.length, 
    unassignedEquipment: unassignedEquipment.length,
    totalEmployees: employees.length,
    totalEquipment: equipment.length,
    isLoading,
    errors: { projectsError, employeesError, equipmentError }
  });



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

      {/* Project Counts */}
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Projects: {projects.length} | Employees: {employees.length} | Equipment: {equipment.length}
          </div>
        </div>
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex" style={{ height: "calc(100vh - 120px)" }}>
          <ProjectList projects={projects} employees={employees} equipment={equipment} />
          <EmployeeList employees={employees} projects={projects} isLoading={isLoading} />
          <EquipmentList equipment={equipment} projects={projects} isLoading={isLoading} />
        </div>
      </DragDropContext>
    </>
  );
}