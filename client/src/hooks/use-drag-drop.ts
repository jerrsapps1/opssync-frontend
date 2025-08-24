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
  const createAuditLog = async (
    assetType: string, 
    assetId: string, 
    assetName: string, 
    sourceLocation: string, 
    destinationLocation: string,
    sourceLocationName: string,
    destinationLocationName: string
  ) => {
    if (!user) return; // Skip if no user
    
    try {
      await apiRequest("POST", "/api/audit-logs", {
        action: "drag-drop-move",
        assetType,
        assetId,
        assetName,
        sourceLocation,
        sourceLocationName,
        destinationLocation,
        destinationLocationName,
        performedBy: user.id,
      });
      console.log(`✅ Audit log created: ${assetType} ${assetName} moved from ${sourceLocationName} to ${destinationLocationName}`);
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
    onSuccess: async (response, variables) => {
      let employee;
      try {
        employee = await response.json();
        console.log("Employee assignment success - parsed data:", employee);
      } catch (parseError) {
        console.error("Failed to parse employee response:", parseError);
        // Fall back to forcing cache refresh without audit log
        queryClient.removeQueries({ queryKey: ["/api", "employees"] });
        queryClient.removeQueries({ queryKey: ["/api", "projects"] });
        await queryClient.refetchQueries({ queryKey: ["/api", "employees"], type: 'all' });
        await queryClient.refetchQueries({ queryKey: ["/api", "projects"], type: 'all' });
        return;
      }
      
      // Create audit log
      try {
        
        // Get project names for better audit trail
        const projects = queryClient.getQueryData(["/api", "projects"]) as any[] || [];
        const sourceProject = projects.find(p => p.id === employee.previousProjectId);
        const destinationProject = projects.find(p => p.id === variables.projectId);
        
        const sourceLocationName = employee.previousProjectId ? 
          (sourceProject?.name || `Project ${employee.previousProjectId}`) : 
          "Available";
        const destinationLocationName = variables.projectId === "repair-shop" ? 
          "Repair Shop" : 
          variables.projectId ? 
            (destinationProject?.name || `Project ${variables.projectId}`) : 
            "Available";
        
        const sourceLocation = employee.previousProjectId === "repair-shop" ? 
          "repair-shop" : 
          employee.previousProjectId ? 
            employee.previousProjectId : 
            "available";
        const destinationLocation = variables.projectId === "repair-shop" ? 
          "repair-shop" : 
          variables.projectId || "available";
        
        await createAuditLog(
          "employee",
          variables.employeeId,
          employee.name || variables.employeeId,
          sourceLocation,
          destinationLocation,
          sourceLocationName,
          destinationLocationName
        );
      } catch (auditError) {
        console.error("Failed to create employee audit log:", auditError);
      }
      
      // Simple, reliable approach from this morning
      queryClient.invalidateQueries({ queryKey: ["/api", "employees"] });
      
      console.log("✅ EMPLOYEE SUCCESS:", variables.employeeId, "assigned to", variables.projectId);
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
    onSuccess: async (response, variables) => {
      let equipment;
      try {
        equipment = await response.json();
        console.log("Equipment assignment success - parsed data:", equipment);
      } catch (parseError) {
        console.error("Failed to parse equipment response:", parseError);
        // Fall back to forcing cache refresh without audit log
        queryClient.removeQueries({ queryKey: ["/api", "equipment"] });
        queryClient.removeQueries({ queryKey: ["/api", "projects"] });
        await queryClient.refetchQueries({ queryKey: ["/api", "equipment"], type: 'all' });
        await queryClient.refetchQueries({ queryKey: ["/api", "projects"], type: 'all' });
        return;
      }
      
      // Create audit log
      try {
        
        // Get project names for better audit trail
        const projects = queryClient.getQueryData(["/api", "projects"]) as any[] || [];
        const sourceProject = projects.find(p => p.id === equipment.previousProjectId);
        const destinationProject = projects.find(p => p.id === variables.projectId);
        
        const sourceLocationName = equipment.previousProjectId ? 
          (sourceProject?.name || `Project ${equipment.previousProjectId}`) : 
          "Available";
        const destinationLocationName = variables.projectId === "repair-shop" ? 
          "Repair Shop" : 
          variables.projectId ? 
            (destinationProject?.name || `Project ${variables.projectId}`) : 
            "Available";
        
        const sourceLocation = equipment.previousProjectId === "repair-shop" ? 
          "repair-shop" : 
          equipment.previousProjectId ? 
            equipment.previousProjectId : 
            "available";
        const destinationLocation = variables.projectId === "repair-shop" ? 
          "repair-shop" : 
          variables.projectId || "available";
        
        await createAuditLog(
          "equipment",
          variables.equipmentId,
          equipment.name || variables.equipmentId,
          sourceLocation,
          destinationLocation,
          sourceLocationName,
          destinationLocationName
        );
      } catch (auditError) {
        console.error("Failed to create equipment audit log:", auditError);
      }
      
      // Simple, reliable approach from this morning  
      queryClient.invalidateQueries({ queryKey: ["/api", "equipment"] });
      
      console.log("✅ EQUIPMENT SUCCESS:", variables.equipmentId, "assigned to", variables.projectId);
      
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
