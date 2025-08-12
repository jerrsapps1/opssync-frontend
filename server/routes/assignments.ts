import express from "express";
import { broadcast } from "../realtime/stream";
import { storage } from "../storage";

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
    
    // Update employee assignment directly via storage
    const updatedEmployee = await storage.updateEmployeeAssignment(id, { currentProjectId: projectId });
    
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
    
    // Update equipment assignment directly via storage
    const updatedEquipment = await storage.updateEquipmentAssignment(id, { currentProjectId: projectId });
    
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
