Right-click context menu
------------------------
Files added:
- client/src/components/common/ContextMenu.tsx
- *.context.patch.tsx files show EXACT snippets to add to your list components.

Actions included:
- Open profile (navigates to /employees/:id or /equipment/:id)
- Unassign (PATCHes assignment to null)
- You can add "Assign…" by opening a small popover with project choices (reuse your projects array).

Quick notes (optional):
- Post to /api/notes with body { entityType: "employee"|"equipment", entityId, note }
- A simple notes route is included in server/routes/notes.ts that stores notes in /data/notes.json
