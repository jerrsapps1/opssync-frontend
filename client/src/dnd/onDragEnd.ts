import type { DropResult } from "react-beautiful-dnd";
import { parseDroppableId } from "./ids";

type Fns = {
  setEmployeeAssignment: (id: string, projectId: string | null) => void | Promise<any>;
  setEquipmentAssignment: (id: string, projectId: string | null) => void | Promise<any>;
};

export function onDragEndFactory(fns: Fns) {
  return async function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    // Ignore if dropped back in same location
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const isEmp = draggableId.startsWith("emp-");
    const id = draggableId;

    // Handle the standard employee-X and equipment-X format
    const dest = parseDroppableId(destination.droppableId);
    if (dest) {
      if (dest.kind === "employee" && isEmp) {
        await fns.setEmployeeAssignment(id, dest.projectId);
        return;
      }
      if (dest.kind === "equipment" && !isEmp) {
        await fns.setEquipmentAssignment(id, dest.projectId);
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

    try {
      if (isEmp) {
        console.log(`🧑 EMPLOYEE ASSIGNMENT: Starting for ${id}`);
        await fns.setEmployeeAssignment(id, projectId);
        console.log(`✅ EMPLOYEE SUCCESS: ${id} assigned to ${projectId}`);
      } else {
        console.log(`🔧 EQUIPMENT ASSIGNMENT: Starting for ${id}`);
        await fns.setEquipmentAssignment(id, projectId);
        console.log(`✅ EQUIPMENT SUCCESS: ${id} assigned to ${projectId}`);
      }
    } catch (error: any) {
      console.error(`❌ DRAG FAILED: ${isEmp ? 'Employee' : 'Equipment'} ${id}`);
      console.error(`❌ Error:`, error.message);
      console.error(`❌ Target:`, projectId);
      
      // Re-throw to let higher level handlers deal with it
      throw error;
    }
  };
}