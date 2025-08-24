import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { DropResult } from "react-beautiful-dnd";
import { onDragEndFactory } from "@/dnd/onDragEnd";

export function useDragDrop() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Helper function to create audit logs
  const createAuditLog = async (assetType: string, assetId: string, assetName: string, sourceLocation: string, destinationLocation: string) => {
    if (!user) return; // Skip if no user
    
    try {
      await apiRequest("POST", "/api/audit-logs", {
        assetType,
        assetId,
        assetName,
        sourceLocation,
        destinationLocation,
        performedBy: user.id,
        performedByEmail: user.email || user.username,
      });
      console.log(`✅ Audit log created: ${assetType} ${assetName} moved from ${sourceLocation} to ${destinationLocation}`);
    } catch (error) {
      console.error("❌ Failed to create audit log:", error);
      // Don't throw error - audit log failure shouldn't break assignment
    }
  };

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
    onSuccess: async (data, variables) => {
      console.log("Employee assignment success:", data);
      
      // Create audit log
      try {
        const employee = data; // data is already parsed JSON from apiRequest
        
        // Get project names for better audit trail
        const projects = queryClient.getQueryData(["/api", "projects"]) as any[] || [];
        const sourceProject = projects.find(p => p.id === employee.previousProjectId);
        const destinationProject = projects.find(p => p.id === variables.projectId);
        
        const sourceLocation = employee.previousProjectId ? 
          (sourceProject?.name || `Project ${employee.previousProjectId}`) : 
          "Unassigned";
        const destinationLocation = variables.projectId === "repair-shop" ? 
          "Repair Shop" : 
          variables.projectId ? 
            (destinationProject?.name || `Project ${variables.projectId}`) : 
            "Unassigned";
        
        await createAuditLog(
          "employee",
          variables.employeeId,
          employee.name || variables.employeeId,
          sourceLocation,
          destinationLocation
        );
      } catch (auditError) {
        console.error("Failed to create employee audit log:", auditError);
      }
      
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
    onSuccess: async (data, variables) => {
      console.log("Equipment assignment success:", data);
      
      // Create audit log
      try {
        const equipment = data; // data is already parsed JSON from apiRequest
        
        // Get project names for better audit trail
        const projects = queryClient.getQueryData(["/api", "projects"]) as any[] || [];
        const sourceProject = projects.find(p => p.id === equipment.previousProjectId);
        const destinationProject = projects.find(p => p.id === variables.projectId);
        
        const sourceLocation = equipment.previousProjectId ? 
          (sourceProject?.name || `Project ${equipment.previousProjectId}`) : 
          "Unassigned";
        const destinationLocation = variables.projectId === "repair-shop" ? 
          "Repair Shop" : 
          variables.projectId ? 
            (destinationProject?.name || `Project ${variables.projectId}`) : 
            "Unassigned";
        
        await createAuditLog(
          "equipment",
          variables.equipmentId,
          equipment.name || variables.equipmentId,
          sourceLocation,
          destinationLocation
        );
      } catch (auditError) {
        console.error("Failed to create equipment audit log:", auditError);
      }
      
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
