import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DropResult } from "react-beautiful-dnd";
import { onDragEndFactory } from "@/dnd/onDragEnd";

export function useDragDrop() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Create assignment functions for the onDragEndFactory
  const setEmployeeAssignment = async (id: string, projectId: string | null) => {
    return assignEmployeeMutation.mutateAsync({ employeeId: id, projectId });
  };

  const setEquipmentAssignment = async (id: string, projectId: string | null) => {
    return assignEquipmentMutation.mutateAsync({ equipmentId: id, projectId });
  };

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

  // Create the proper drag end handler using the factory
  const handleDragEnd = useCallback(
    onDragEndFactory({
      setEmployeeAssignment,
      setEquipmentAssignment,
    }),
    [setEmployeeAssignment, setEquipmentAssignment]
  );

  return {
    handleDragEnd,
    isAssigning: assignEmployeeMutation.isPending || assignEquipmentMutation.isPending,
  };
}
