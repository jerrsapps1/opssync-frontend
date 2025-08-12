import { Box, Flex } from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DragDropContext } from "react-beautiful-dnd";
import CommandBar from "@/components/CommandBar";
import { applyActions } from "@/lib/applyActions";
import { ProjectList } from "@/components/assignments/project-list";
import { EmployeeList } from "@/components/assignments/employee-list";
import { EquipmentList } from "@/components/assignments/equipment-list";
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
      <Box height="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.900" color="white">
        Loading StaffTrak...
      </Box>
    );
  }

  return (
    <Box height="100vh" bg="gray.900" color="white">
      {/* Command Bar */}
      <Box p={4} bg="gray.800" borderBottom="1px solid" borderColor="gray.700">
        <CommandBar runActions={handleCommandActions} />
      </Box>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Flex height="calc(100vh - 120px)">
          <ProjectList projects={projects} />
          <EmployeeList employees={employees} projects={projects} />
          <EquipmentList equipment={equipment} projects={projects} />
        </Flex>
      </DragDropContext>

      {isAssigning && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="blackAlpha.500"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={1000}
        >
          <Box bg="gray.800" p={6} rounded="lg" color="white">
            Updating assignment...
          </Box>
        </Box>
      )}
    </Box>
  );
}