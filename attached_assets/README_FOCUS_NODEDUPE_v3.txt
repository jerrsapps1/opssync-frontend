FOCUS NODEDUPE PATCH v3 (auto-calc progress + manual override)

What's new
- Project Profile now supports **Auto-calc % Complete** from dates with a **manual override** toggle.
- Quick Counts Bar component shows Employees/Equipment count for the currently focused project (live).
- Non-dup rules preserved: Unassigned vs Focused Project filtering remains intact.
- Safe to drop in over v2. Minimal surface area.

Key files
- client/src/pages/project-profile.tsx
- client/src/components/dashboard/ProjectCountsBar.tsx

Server expectations
- PATCH /api/projects/:id accepts: { startDate?: string, endDate?: string, percentComplete?: number, percentMode?: "auto"|"manual" }
- GET /api/projects/:id returns: { ..., startDate?: string, endDate?: string, percentComplete?: number, percentMode?: "auto"|"manual" }

Wire-up
1) Import and place <ProjectCountsBar /> under your ProjectFocusBar on the Dashboard page.
2) Replace your existing project-profile.tsx with this one.
3) If you haven't yet, ensure your Project entity supports `percentMode` (default to "auto" if undefined).

UX
- When 'Auto-calc' is ON: % is computed from elapsed days vs total duration.
- When 'Manual' is ON: slider/value is editable and persists.
