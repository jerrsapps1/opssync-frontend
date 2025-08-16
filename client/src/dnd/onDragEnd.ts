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
    // Check if destination is an unassigned area
    const isUnassignedDestination = destination.droppableId.includes("unassigned");
    const projectId: string | null = isUnassignedDestination ? null : destination.droppableId;

    console.log("Drag and Drop Debug:", {
      draggableId,
      source: source.droppableId,
      destination: destination.droppableId,
      assetType: isEmp ? "emp" : "eq",
      assetId: id,
      projectId: projectId,
      isUnassignedDestination
    });

    if (isEmp) {
      await fns.setEmployeeAssignment(id, projectId);
    } else {
      await fns.setEquipmentAssignment(id, projectId);
    }
  };
}