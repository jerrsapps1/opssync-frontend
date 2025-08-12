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
      console.log("Making assignment request to:", `/api/employees/${employeeId}/assign-to-project`);
      console.log("Request payload:", { currentProjectId: projectId });
      return await apiRequest("PATCH", `/api/employees/${employeeId}/assign-to-project`, {
        currentProjectId: projectId,
      });
    },
    onSuccess: (data) => {
      console.log("Employee assignment success:", data);
      // Force immediate refetch instead of just invalidation
      queryClient.refetchQueries({ queryKey: ["/api/employees"] });
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
      console.log("Making assignment request to:", `/api/equipment/${equipmentId}/assign-to-project`);
      console.log("Request payload:", { currentProjectId: projectId });
      return await apiRequest("PATCH", `/api/equipment/${equipmentId}/assign-to-project`, {
        currentProjectId: projectId,
      });
    },
    onSuccess: (data) => {
      console.log("Equipment assignment success:", data);
      // Force immediate refetch instead of just invalidation
      queryClient.refetchQueries({ queryKey: ["/api/equipment"] });
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
    // Format: "emp-emp-001" -> assetType="emp", assetId="emp-001"
    // Format: "eq-eq-001" -> assetType="eq", assetId="eq-001"
    const parts = draggableId.split("-");
    const assetType = parts[0];
    const assetId = parts.slice(1).join("-"); // Rejoin remaining parts for full ID
    
    // Extract project ID from destination droppableId
    let projectId = null;
    if (destination.droppableId === "project-unassigned" || destination.droppableId === "employee-list" || destination.droppableId === "equipment-list") {
      projectId = null;
    } else if (destination.droppableId.startsWith("project-")) {
      projectId = destination.droppableId.replace("project-", "");
    } else {
      projectId = destination.droppableId;
    }

    console.log("Drag and Drop Debug:", {
      draggableId,
      source: source.droppableId,
      destination: destination.droppableId,
      assetType,
      assetId,
      projectId
    });

    if (assetType === "emp") {
      assignEmployeeMutation.mutate({ employeeId: assetId, projectId });
      
      toast({
        title: "Employee Assignment",
        description: projectId 
          ? "Employee assigned to project successfully" 
          : "Employee unassigned successfully",
      });
    } else if (assetType === "eq") {
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
