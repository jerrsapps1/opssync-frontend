Directory + Archive Bundle
===========================
This package merges the Directory/Profile Builder and Archive/History features.

What's included
- Directory page (Employees / Equipment / Projects tabs) with completeness bars, double‑click to open profile, right‑click Assign/Unassign/Open.
- Profile Builder wizard to step through records and complete key fields.
- Archive/Restore/Remove (soft delete) endpoints and audit history feed.
- History page to review all actions.

Files (key)
- client/src/pages/directory.tsx
- client/src/pages/profile-builder.tsx
- client/src/pages/history.tsx
- client/src/components/common/CompletenessBadge.tsx
- client/src/components/common/ConfirmDialog.tsx
- client/src/components/common/ContextMenu.tsx        (should already exist; included for convenience)
- client/src/components/common/ProjectAssignMenu.tsx   (should already exist; included for convenience)
- client/src/hooks/useArchive.ts

- server/utils/audit.ts
- server/routes/archive.ts

How to wire

1) Server (server/index.ts)
--------------------------------
import archive from "./routes/archive";
app.use("/api", archive);

2) Client routes (client/src/App.tsx inside <Route element={<AppLayout />}>)
-----------------------------------------------------------------------------
import DirectoryPage from "@/pages/directory";
import ProfileBuilder from "@/pages/profile-builder";
import HistoryPage from "@/pages/history";

<Route path="/directory" element={<DirectoryPage />} />
<Route path="/builder" element={<ProfileBuilder />} />
<Route path="/history" element={<HistoryPage />} />

3) Sidebar (optional)
---------------------
<Item to="/directory">Directory</Item>
<Item to="/builder">Profile Builder</Item>
<Item to="/history">History</Item>

Notes
- All UI is themed via your white‑label CSS variables.
- Archive/Remove are **soft**; records keep their IDs and appear in /api/history.
- Directory reuses the context menu + project assign picker you added earlier.
