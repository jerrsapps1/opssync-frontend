Archive + History + Edit/Remove
--------------------------------
This patch adds archive/restore/remove capability with an audit trail,
and client helpers to trigger these actions from any page.

Server:
- server/utils/audit.ts              (appendHistory to data/history.json)
- server/routes/archive.ts           (archive/restore/remove endpoints + GET /api/history)
- server/README_ARCHIVE_PATCH.txt    (wiring instructions)

Wire the server route in server/index.ts:
  import archive from "./routes/archive";
  app.use("/api", archive);

Client:
- client/src/components/common/ConfirmDialog.tsx
- client/src/hooks/useArchive.ts
- client/src/pages/history.tsx

Routes to add (inside AppLayout group):
  <Route path="/history" element={<HistoryPage />} />

Using the hook (example inside a detail page):
  import { useArchive } from "@/hooks/useArchive";
  const { archive, restore, remove, pendingId } = useArchive("employees"); // or "equipment" | "projects"

  // Archive with confirm dialog
  <ConfirmDialog
    title="Archive employee?"
    message="You can restore later from History."
    onConfirm={() => archive.mutate(employee.id)}
    onCancel={() => setOpen(false)}
  />

Context menus:
- Add actions to your ContextMenu items:
  { label: "Archive", onClick: () => openConfirm("archive", id) }
  { label: "Restore", onClick: () => restore.mutate(id) }
  { label: "Remove", onClick: () => openConfirm("remove", id) }

Notes:
- Endpoints perform SOFT deletes (status: 'archived' or 'removed') via PATCH on your existing entity routes, so historical records are preserved.
- Full audit trail at /api/history and UI at /history.
- You can later swap to a DB without changing the front end.
