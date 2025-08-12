FOCUS NODEDUPE PATCH v4 (Project Status + Mark Completed)

What's new
- Project Profile now includes a **Status** dropdown (Planned / Active / Paused / Completed).
- A **Mark Completed** action sets status=Completed, percentMode=manual, percentComplete=100,
  and (if missing) sets endDate=today.
- Works with v3 (auto-calc/manual) and the Quick Counts Bar.

Server expectations
- PATCH /api/projects/:id supports fields: { status, percentMode, percentComplete, endDate }
- GET /api/projects/:id returns current status.

Wire-up
- Replace your existing client/src/pages/project-profile.tsx with this version.
