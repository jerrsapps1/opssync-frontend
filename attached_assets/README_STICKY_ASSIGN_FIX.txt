Sticky Assign + Profile Routing Fix
==================================
Symptoms you described:
- Drag & drop works visually, but names/equipment don't "stick" to the project.
- Double‑click doesn't show profile page.

This patch adds:
1) A **single onDragEnd()** handler that CALLS the assignment API and updates cache.
2) A safe **droppableId parser** (must be `employee-<projectId>` or `equipment-<projectId>` or `*-unassigned`).
3) A small **routes example** to ensure /employees/:id, /equipment/:id, /projects/:id exist.

Where to put things
- client/src/dnd/onDragEnd.ts           (use in your Dashboard component)
- client/src/dnd/ids.ts                 (helpers for droppable ids)
- client/src/pages/_routes_example.tsx  (compare with your App router; make sure these routes exist)

Wire-up in your Dashboard file:
--------------------------------
import { buildDroppableId, parseDroppableId, onDragEndFactory } from "@/dnd/onDragEnd";

const onDragEnd = onDragEndFactory({
  setEmployeeAssignment: (id, pid) => setEmployeeAssignment(id, pid), // from useAssignmentSync("employees")
  setEquipmentAssignment: (id, pid) => setEquipmentAssignment(id, pid), // from useAssignmentSync("equipment")
});

<DragDropContext onDragEnd={onDragEnd}> ... </DragDropContext>

Make sure your Droppable ids are:
- Employees column:    droppableId={`employee-${projectId || "unassigned"}`}
- Equipment column:    droppableId={`equipment-${projectId || "unassigned"}`}

Routes required:
- /employees/:id  → EmployeeProfile component
- /equipment/:id  → EquipmentProfile component
- /projects/:id   → ProjectProfile (we shipped this)

Test quickly:
1) Drag employee from Unassigned to a project column → reload the page → they should remain assigned.
2) Double‑click an employee/equipment/project card → profile page should open.
3) If still not saved, hit your server logs; ensure `PATCH /api/employees/:id/assignment` (or equipment) is hit and returns 200.
