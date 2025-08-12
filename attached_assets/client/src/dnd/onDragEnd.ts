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

    const dest = parseDroppableId(destination.droppableId);
    if (!dest) return;

    const isEmp = draggableId.startsWith("emp-");
    const id = draggableId.replace(/^emp-/, "").replace(/^eq-/, "");

    if (dest.kind === "employee" && isEmp) {
      await fns.setEmployeeAssignment(id, dest.projectId);
      return;
    }
    if (dest.kind === "equipment" && !isEmp) {
      await fns.setEquipmentAssignment(id, dest.projectId);
      return;
    }
    // If kinds differ (e.g., dragging employee into equipment list), ignore.
  };
}
