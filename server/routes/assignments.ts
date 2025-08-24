import express from "express";
import { broadcast } from "../realtime/stream";
import { storage } from "../storage";

// Helper function for enhanced project activity logging with from/to tracking
async function logProjectActivity({
  employeeId,
  employeeName,
  equipmentId,
  equipmentName,
  previousProjectId,
  newProjectId,
  entityType,
  performedBy = "Admin User",
  performedByEmail
}: {
  employeeId?: string;
  employeeName?: string;
  equipmentId?: string;
  equipmentName?: string;
  previousProjectId?: string | null;
  newProjectId?: string | null;
  entityType: "employee" | "equipment";
  performedBy?: string;
  performedByEmail?: string;
}) {
  try {
    const entityId = employeeId || equipmentId;
    const entityName = employeeName || equipmentName;
    
    if (!entityId || !entityName) return;

    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = now.toTimeString().split(' ')[0].slice(0, 5); // HH:MM

    // Get project information for enhanced logging
    const previousProject = previousProjectId ? await storage.getProject(previousProjectId) : null;
    const newProject = newProjectId ? await storage.getProject(newProjectId) : null;

    // If both projects exist and are active, log as a "moved" action
    if (previousProjectId && newProjectId && 
        previousProject?.status === "Active" && newProject?.status === "Active") {
      
      await storage.createProjectActivityLog({
        date,
        time,
        action: "moved",
        entityType,
        entityName,
        entityId,
        projectId: newProjectId,
        projectName: newProject.name,
        fromProjectId: previousProjectId || undefined,
        fromProjectName: previousProject?.name || '',
        performedBy,
        performedByEmail
      });
      console.log(`📝 Logged movement: ${entityName} moved from ${previousProject.name} to ${newProject.name}`);
      return;
    }

    // Log removal from previous project (if it was active)
    if (previousProjectId && previousProject?.status === "Active") {
      await storage.createProjectActivityLog({
        date,
        time,
        action: "removed",
        entityType,
        entityName,
        entityId,
        projectId: previousProjectId,
        projectName: previousProject.name,
        performedBy,
        performedByEmail
      });
      console.log(`📝 Logged removal: ${entityName} removed from ${previousProject.name}`);
    }

    // Log assignment to new project (if it's active)
    if (newProjectId && newProject?.status === "Active") {
      await storage.createProjectActivityLog({
        date,
        time,
        action: "assigned",
        entityType,
        entityName,
        entityId,
        projectId: newProjectId,
        projectName: newProject.name,
        fromProjectId: previousProjectId || undefined,
        fromProjectName: previousProject?.name || undefined,
        performedBy,
        performedByEmail
      });
      console.log(`📝 Logged assignment: ${entityName} assigned to ${newProject.name}${previousProject ? ` (from ${previousProject.name})` : ''}`);
    }
  } catch (error) {
    console.error("Error logging project activity:", error);
  }
}

const router = express.Router();

// Handle employee assignment directly without proxy layer  
router.patch("/employees/:id/assignment", async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const { projectId } = req.body || {};
    
    console.log("=== ASSIGNMENT ROUTE DEBUG ===");
    console.log("Employee ID:", id);
    console.log("Project ID:", projectId);
    console.log("Request body:", req.body);
    
    // Get current employee state for logging
    const currentEmployee = await storage.getEmployee(id);
    const previousProjectId = currentEmployee?.currentProjectId;
    
    // Update employee assignment directly via storage
    const updatedEmployee = await storage.updateEmployeeAssignment(id, { projectId });
    
    // Status-based conditional logging
    await logProjectActivity({
      employeeId: id,
      employeeName: updatedEmployee.name,
      previousProjectId,
      newProjectId: projectId,
      entityType: "employee"
    });
    
    console.log("Assignment complete:", updatedEmployee);
    console.log("=================================");
    
    broadcast({ type: "assignment.updated", entity: "employee", id, currentProjectId: projectId });
    res.json(updatedEmployee);
  } catch (e:any) {
    console.error("Assignment error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// Handle equipment assignment directly without proxy layer
router.patch("/equipment/:id/assignment", async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const { projectId } = req.body || {};
    
    console.log("=== EQUIPMENT ASSIGNMENT ROUTE DEBUG ===");
    console.log("Equipment ID:", id);
    console.log("Project ID:", projectId);
    console.log("Request body:", req.body);
    
    // Get current equipment state for logging
    const currentEquipment = await storage.getEquipmentItem(id);
    const previousProjectId = currentEquipment?.currentProjectId;
    const previousStatus = currentEquipment?.status;
    
    let finalProjectId = projectId;
    let finalStatus = currentEquipment?.status || "available";
    
    // Handle repair shop logic
    if (projectId === "repair-shop") {
      // Moving TO repair shop: set projectId to null, status to maintenance
      finalProjectId = null;
      finalStatus = "maintenance";
      console.log("🔧 Moving equipment to repair shop");
    } else if (previousStatus === "maintenance" && projectId === null) {
      // Moving FROM repair shop to available: set status to available
      finalStatus = "available";
      console.log("✅ Moving equipment from repair shop to available");
    } else if (previousStatus === "maintenance" && projectId) {
      // Moving FROM repair shop to project: set status to in_use
      finalStatus = "in_use";
      console.log("📋 Moving equipment from repair shop to project");
    } else if (projectId) {
      // Regular project assignment
      finalStatus = "in_use";
    } else {
      // Moving to unassigned (available)
      finalStatus = "available";
    }
    
    // Update equipment assignment and status separately
    const updatedEquipment = await storage.updateEquipmentAssignment(id, { 
      projectId: finalProjectId
    });
    
    // Update status separately if it changed
    if (finalStatus !== currentEquipment?.status) {
      await storage.updateEquipment(id, { status: finalStatus });
    }
    
    // Status-based conditional logging (use original projectId for repair shop logging)
    await logProjectActivity({
      equipmentId: id,
      equipmentName: updatedEquipment.name,
      previousProjectId,
      newProjectId: projectId, // Use original projectId for logging
      entityType: "equipment"
    });
    
    console.log("Equipment assignment complete:", { 
      originalProjectId: projectId,
      finalProjectId,
      finalStatus,
      equipment: updatedEquipment
    });
    console.log("=================================");
    
    broadcast({ type: "assignment.updated", entity: "equipment", id, currentProjectId: finalProjectId, status: finalStatus });
    res.json(updatedEquipment);
  } catch (e:any) {
    console.error("Equipment assignment error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
