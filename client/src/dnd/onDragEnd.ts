import type { DropResult } from "react-beautiful-dnd";
import { parseDroppableId } from "./ids";

type Fns = {
  setEmployeeAssignment: (id: string, projectId: string | null) => void | Promise<any>;
  setEquipmentAssignment: (id: string, projectId: string | null) => void | Promise<any>;
};

export function onDragEndFactory(fns: Fns) {
  return function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    // Ignore if dropped back in same location
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Better asset type detection: use source droppableId as primary method
    const isEmp = source.droppableId === "employees" || draggableId.startsWith("emp-");
    const id = draggableId;

    // Handle the standard employee-X and equipment-X format
    const dest = parseDroppableId(destination.droppableId);
    if (dest) {
      if (dest.kind === "employee" && isEmp) {
        fns.setEmployeeAssignment(id, dest.projectId);
        return;
      }
      if (dest.kind === "equipment" && !isEmp) {
        fns.setEquipmentAssignment(id, dest.projectId);
        return;
      }
      // If kinds differ, ignore
      return;
    }

    // Handle legacy project IDs directly (for project cards that accept both)
    // Check if destination is an unassigned area or repair shop
    const isUnassignedDestination = destination.droppableId.includes("unassigned") || 
                                   destination.droppableId === "equipment" || 
                                   destination.droppableId === "employees";
    const isRepairShop = destination.droppableId === "repair-shop";
    
    let projectId: string | null;
    if (isUnassignedDestination) {
      projectId = null;
    } else if (isRepairShop) {
      projectId = "repair-shop"; // Special handling for repair shop
    } else {
      projectId = destination.droppableId;
    }

    console.log("🎯 DRAG ATTEMPT:", {
      draggableId,
      source: source.droppableId,
      destination: destination.droppableId,
      assetType: isEmp ? "emp" : "eq",
      assetId: id,
      projectId: projectId,
      isUnassignedDestination,
      isRepairShop
    });

    // Validate ID format before making assignment
    if (isEmp && !id.startsWith("emp-") && !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.error(`❌ INVALID EMPLOYEE ID: ${id} - skipping assignment`);
      return; // Skip invalid employee IDs
    }
    
    // Execute assignment in background - don't await to allow drag completion
    if (isEmp) {
      console.log(`🧑 EMPLOYEE ASSIGNMENT: Starting for ${id}`);
      const result = fns.setEmployeeAssignment(id, projectId);
      if (result && typeof result.then === 'function') {
        result
          .then(() => console.log(`✅ EMPLOYEE SUCCESS: ${id} assigned to ${projectId}`))
          .catch((error: any) => {
            console.error(`❌ EMPLOYEE DRAG FAILED: ${id}`, error.message);
          });
      }
    } else {
      console.log(`🔧 EQUIPMENT ASSIGNMENT: Starting for ${id}`);
      const result = fns.setEquipmentAssignment(id, projectId);
      if (result && typeof result.then === 'function') {
        result
          .then(() => console.log(`✅ EQUIPMENT SUCCESS: ${id} assigned to ${projectId}`))
          .catch((error: any) => {
            console.error(`❌ EQUIPMENT DRAG FAILED: ${id}`, error.message);
          });
      }
    }
  };
}