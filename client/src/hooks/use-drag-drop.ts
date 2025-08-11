import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DropResult } from "react-beautiful-dnd";

export function useDragDrop() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const assignEmployeeMutation = useMutation({
    mutationFn: async ({ employeeId, projectId }: { employeeId: string; projectId: string | null }) => {
      return await apiRequest("PATCH", `/api/employees/${employeeId}/assignment`, {
        currentProjectId: projectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign employee",
        variant: "destructive",
      });
    },
  });

  const assignEquipmentMutation = useMutation({
    mutationFn: async ({ equipmentId, projectId }: { equipmentId: string; projectId: string | null }) => {
      return await apiRequest("PATCH", `/api/equipment/${equipmentId}/assignment`, {
        currentProjectId: projectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign equipment",
        variant: "destructive",
      });
    },
  });

  const handleDragEnd = useCallback((result: DropResult) => {
    const { draggableId, destination, source } = result;

    // If dropped outside a droppable area
    if (!destination) return;

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Extract asset type and ID from draggableId
    const [assetType, assetId] = draggableId.split("-");
    
    // Extract project ID from destination droppableId
    const projectId = destination.droppableId === "unassigned" ? null : destination.droppableId;

    if (assetType === "employee") {
      assignEmployeeMutation.mutate({ employeeId: assetId, projectId });
      
      toast({
        title: "Employee Assignment",
        description: projectId 
          ? "Employee assigned to project successfully" 
          : "Employee unassigned successfully",
      });
    } else if (assetType === "equipment") {
      assignEquipmentMutation.mutate({ equipmentId: assetId, projectId });
      
      toast({
        title: "Equipment Assignment",
        description: projectId 
          ? "Equipment assigned to project successfully" 
          : "Equipment unassigned successfully",
      });
    }
  }, [assignEmployeeMutation, assignEquipmentMutation, toast]);

  return {
    handleDragEnd,
    isAssigning: assignEmployeeMutation.isPending || assignEquipmentMutation.isPending,
  };
}
