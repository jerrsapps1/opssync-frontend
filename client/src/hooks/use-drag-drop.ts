import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { DropResult } from "react-beautiful-dnd";
import { onDragEndFactory } from "@/dnd/onDragEnd";

export function useDragDrop() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Create assignment functions for the onDragEndFactory
  const setEmployeeAssignment = async (id: string, projectId: string | null) => {
    return assignEmployeeMutation.mutateAsync({ employeeId: id, projectId });
  };

  const setEquipmentAssignment = async (id: string, projectId: string | null) => {
    return await assignEquipmentMutation.mutateAsync({ equipmentId: id, projectId });
  };

  const assignEmployeeMutation = useMutation({
    mutationFn: async ({ employeeId, projectId }: { employeeId: string; projectId: string | null }) => {
      console.log("Making assignment request to:", `/api/employees/${employeeId}/assignment`);
      console.log("Request payload:", { projectId });
      return await apiRequest("PATCH", `/api/employees/${employeeId}/assignment`, {
        projectId,
      });
    },
    onSuccess: (data) => {
      console.log("Employee assignment success:", data);
      // Force immediate invalidation and refetch using consistent query keys
      queryClient.invalidateQueries({ queryKey: ["/api", "employees"] });
      queryClient.refetchQueries({ queryKey: ["/api", "employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api", "activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api", "stats"] });
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
      console.log("Making assignment request to:", `/api/equipment/${equipmentId}/assignment`);
      console.log("Request payload:", { projectId });
      return await apiRequest("PATCH", `/api/equipment/${equipmentId}/assignment`, {
        projectId,
      });
    },
    onSuccess: (data, variables) => {
      console.log("Equipment assignment success:", data);
      // Force immediate invalidation and refetch using consistent query keys
      queryClient.invalidateQueries({ queryKey: ["/api", "equipment"] });
      queryClient.refetchQueries({ queryKey: ["/api", "equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api", "activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api", "stats"] });
      
      // If equipment was assigned to repair shop, also invalidate repair shop queries
      if (variables.projectId === "repair-shop") {
        queryClient.invalidateQueries({ queryKey: ["/api", "repair-shop", "equipment"] });
        queryClient.refetchQueries({ queryKey: ["/api", "repair-shop", "equipment"] });
      }
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
