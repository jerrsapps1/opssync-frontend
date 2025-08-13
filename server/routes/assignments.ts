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
        fromProjectId: previousProjectId,
        fromProjectName: previousProject.name,
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
        fromProjectId: previousProjectId,
        fromProjectName: previousProject?.name,
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
    const updatedEmployee = await storage.updateEmployeeAssignment(id, { currentProjectId: projectId });
    
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
    
    // Update equipment assignment directly via storage
    const updatedEquipment = await storage.updateEquipmentAssignment(id, { currentProjectId: projectId });
    
    // Status-based conditional logging
    await logProjectActivity({
      equipmentId: id,
      equipmentName: updatedEquipment.name,
      previousProjectId,
      newProjectId: projectId,
      entityType: "equipment"
    });
    
    console.log("Equipment assignment complete:", updatedEquipment);
    console.log("=================================");
    
    broadcast({ type: "assignment.updated", entity: "equipment", id, currentProjectId: projectId });
    res.json(updatedEquipment);
  } catch (e:any) {
    console.error("Equipment assignment error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
