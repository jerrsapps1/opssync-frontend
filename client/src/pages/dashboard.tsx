// Removed Chakra UI imports - using Tailwind classes instead
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { Box, Alert as ChakraAlert, AlertIcon, AlertTitle, AlertDescription as ChakraAlertDescription, CloseButton } from "@chakra-ui/react";

import { ProjectList } from "@/components/assignments/project-list";
import { EmployeeList } from "@/components/assignments/employee-list";
import { EquipmentList } from "@/components/assignments/equipment-list";
import ProjectCountsBar from "@/components/dashboard/ProjectCountsBar";
import { DashboardHeader } from "@/components/DashboardHeader";
import FieldFriendlyRAGPanel from "@/partials/FieldFriendlyRAGPanel";
import { useTenantFeatures } from "@/hooks/useTenantFeatures";
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
  const { features, loading: featuresLoading } = useTenantFeatures();

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
    <div className="min-h-screen bg-[#121212] text-white">
      <DashboardHeader />
      
      {/* Conflict Alerts */}
      {!alertDismissed && (
        <Box p={4}>
          <ConflictAlert 
            conflicts={conflicts} 
            onClose={() => setAlertDismissed(true)} 
          />
        </Box>
      )}

      {/* SLA / RAG Overview Panel - Feature Gated */}
      {!featuresLoading && (features?.sla || features?.manager) && (
        <div className="p-4">
          <FieldFriendlyRAGPanel />
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Project Counts */}
        <div className="p-4 bg-gray-800 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              Projects: {projects.length} | Employees: {employees.length} | Equipment: {equipment.length}
            </div>
            
            {/* Repair Shop Drop Zone */}
            <Droppable droppableId="repair-shop">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex items-center gap-3 px-6 py-3 rounded-lg border-2 border-dashed transition-colors cursor-pointer min-h-12 ${
                    snapshot.isDraggingOver
                      ? "border-orange-400 bg-orange-900/30 scale-105"
                      : "border-orange-600 bg-orange-900/10 hover:bg-orange-900/20"
                  }`}
                  onClick={() => window.location.href = '/repair-shop'}
                  data-testid="repair-shop-drop-zone"
                >
                  <span className="text-orange-400 text-lg">🔧</span>
                  <span className="text-sm text-orange-300 font-medium">
                    Repair Shop ({equipment.filter(eq => !eq.currentProjectId && eq.status === "maintenance").length})
                  </span>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>
        
        <div className="flex" style={{ height: "calc(100vh - 180px)" }}>
          <ProjectList projects={projects} employees={employees} equipment={equipment} />
          <EmployeeList employees={employees} projects={projects} isLoading={isLoading} />
          <EquipmentList equipment={equipment} projects={projects} isLoading={isLoading} />
        </div>
      </DragDropContext>
    </div>
  );
}