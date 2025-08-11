import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext } from "react-beautiful-dnd";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { brandConfig } from "@/lib/brand-config";
import { ProjectList } from "@/components/assignments/project-list";
import { EmployeeList } from "@/components/assignments/employee-list";
import { EquipmentList } from "@/components/assignments/equipment-list";
import { AssignmentsHeader } from "@/components/assignments/assignments-header";
import type { Project, Employee, Equipment } from "@shared/schema";
import type { DropResult } from "react-beautiful-dnd";

export default function Assignments() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: equipment = [], isLoading: equipmentLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const moveEmployeeMutation = useMutation({
    mutationFn: async ({ empId, newProjectId }: { empId: string; newProjectId: string | null }) => {
      return await apiRequest("PATCH", `/api/employees/${empId}/assignment`, {
        currentProjectId: newProjectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: (error) => {
      toast({
        title: "Error updating employee",
        description: error.message || "Failed to update employee assignment",
        variant: "destructive",
      });
    },
  });

  const moveEquipmentMutation = useMutation({
    mutationFn: async ({ eqId, newProjectId }: { eqId: string; newProjectId: string | null }) => {
      return await apiRequest("PATCH", `/api/equipment/${eqId}/assignment`, {
        currentProjectId: newProjectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: (error) => {
      toast({
        title: "Error updating equipment",
        description: error.message || "Failed to update equipment assignment",
        variant: "destructive",
      });
    },
  });

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    // ID format: emp-<id> or eq-<id>
    const [type, id] = draggableId.split("-");
    const sourceParts = source.droppableId.split("-");
    const destParts = destination.droppableId.split("-");

    if (
      type === "emp" &&
      sourceParts[0] === "employee" &&
      destParts[0] === "employee"
    ) {
      const newProjectId = destParts[1] === "unassigned" ? null : destParts[1];
      moveEmployeeMutation.mutate({ empId: id, newProjectId });
      
      toast({
        title: "Employee Assignment",
        description: newProjectId 
          ? "Employee assigned to project successfully" 
          : "Employee unassigned successfully",
      });
    }
    
    if (
      type === "eq" &&
      sourceParts[0] === "equipment" &&
      destParts[0] === "equipment"
    ) {
      const newProjectId = destParts[1] === "unassigned" ? null : destParts[1];
      moveEquipmentMutation.mutate({ eqId: id, newProjectId });
      
      toast({
        title: "Equipment Assignment",
        description: newProjectId 
          ? "Equipment assigned to project successfully" 
          : "Equipment unassigned successfully",
      });
    }
  }

  const isLoading = projectsLoading || employeesLoading || equipmentLoading;

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 flex-col">
      <AssignmentsHeader />
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-1 overflow-hidden">
          <ProjectList projects={projects} isLoading={isLoading} />
          <EmployeeList 
            employees={employees} 
            projects={projects} 
            isLoading={isLoading}
          />
          <EquipmentList 
            equipment={equipment} 
            projects={projects} 
            isLoading={isLoading}
          />
        </div>
      </DragDropContext>

      {/* Loading overlay */}
      {(moveEmployeeMutation.isPending || moveEquipmentMutation.isPending) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Updating assignment...</p>
          </div>
        </div>
      )}
    </div>
  );
}