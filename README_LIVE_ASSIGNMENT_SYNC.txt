Live Assignment Sync
--------------------
Ensures the Employees tab (and Directory) reflect assignment moves made on the Dashboard instantly.

What this patch does:
1) Introduces a central hook `useAssignmentSync(kind)` that performs
   the PATCH request and updates React Query caches immediately:
   - ["employees"], ["dir-employees"] for employees
   - ["equipment"], ["dir-equipment"] for equipment
   It also invalidates relevant queries in the background.

2) Wires the hook into your draggable Employee/Equipment list components so
   right-click "Assign…"/"Unassign" updates the Employees tab without a reload.

3) Updates the Employees page to show each employee's **current project name**
   (resolves from Projects API) and keeps data fresh on window focus.

Files:
- client/src/hooks/useAssignmentSync.ts
- client/src/components/assignments/employee-list.tsx
- client/src/components/assignments/equipment-list.tsx
- client/src/components/mini/MiniEmployeeCard.tsx
- client/src/pages/employees.tsx

Optional upgrade (later):
- Add SSE/WebSocket to broadcast assignment changes across multiple browser tabs.
