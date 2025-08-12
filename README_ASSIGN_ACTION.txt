Assign via Right-Click (Employee & Equipment)
--------------------------------------------
This patch adds an "Assign…" action to the right-click menu and a small project picker.
It also preserves:
- Double-click to open profile
- Unassign action
- All drag-and-drop functionality

Files:
- client/src/components/common/ContextMenu.tsx            (menu)
- client/src/components/common/ProjectAssignMenu.tsx      (project picker)
- client/src/components/assignments/employee-list.tsx     (drop-in replacement)
- client/src/components/assignments/equipment-list.tsx    (drop-in replacement)

End-to-end:
- Uses PATCH /api/employees/:id/assignment and /api/equipment/:id/assignment
- Project list is passed in via props and shown in the picker (Unassigned included).

Install:
1) Unzip into your project root and overwrite the files above.
2) Restart the client if hot reload doesn’t apply.

Tip:
- You can also invoke the picker from a button; it only needs (projects, onSelect, pos).
