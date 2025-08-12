Directory + Profile Builder
---------------------------
This patch adds:
1) A **Directory** page that lists all Employees, Equipment, and Projects in one place with completeness bars, right-click actions (Open profile / Assign / Unassign), and a Back to Dashboard button.
2) A **Profile Builder** wizard that lets you step through each record and fill in missing details—great for initial system setup.

Files:
- client/src/components/common/CompletenessBadge.tsx
- client/src/pages/directory.tsx
- client/src/pages/profile-builder.tsx

Routes (inside your AppLayout group):
  <Route path="/directory" element={<DirectoryPage />} />
  <Route path="/builder" element={<ProfileBuilder />} />

Sidebar suggestions:
  <Item to="/directory">Directory</Item>
  <Item to="/builder">Profile Builder</Item>

Behavior:
- Directory
  * Tabs for Employees / Equipment / Projects
  * Double-click row → open profile
  * Right-click row → Open profile / Assign… / Unassign (for employees & equipment)
  * Completeness bars: see at a glance what's missing
  * Back to Dashboard button

- Profile Builder
  * Choose Employees / Equipment / Projects
  * Edit core fields and Save & Next through your entire list
  * Uses PATCH /api/{entity}/{id}; relies on your existing endpoints

Theming:
- Fully uses CSS variables (brand colors, etc.).

Requires:
- import the previously added ContextMenu and ProjectAssignMenu (already in your project from earlier patches).
