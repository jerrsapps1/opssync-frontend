# Manager Dashboard Bundle (RAG + SLA + CSV)

This bundle adds a Manager Dashboard with:
- RAG rollups (GREEN/AMBER/RED) per project
- Daily RAG trend for the selected range
- CSV export of items with SLA grade
- Project-level metrics endpoint

## Files
Frontend:
- `client/src/pages/ManagerDashboard.tsx`
- `client/src/components/RAGBadge.tsx`
- `client/src/components/TrendBars.tsx`

Backend:
- `server/routes/manager.ts` (API: `/api/manager/...`)
- `server/utils/csv.ts`

Wire-up:
- `scripts/insert_manager_route.js` (auto-mounts `/api/manager` in `server/routes.ts`)

Postman:
- `collections/manager_dashboard.postman_collection.json`

## Install
```bash
# 1) Unzip into project root
unzip manager_dashboard_bundle.zip

# 2) Auto-mount route
node scripts/insert_manager_route.js

# 3) Add a route to your frontend router for the page (example React Router v6):
#    import ManagerDashboard from "./pages/ManagerDashboard";
#    <Route path="/manager" element={<ManagerDashboard />} />
```

## Notes
- Relies on tables from the earlier bundles: `projects`, `timeliness_items`, `sla_policies`.
- Uses SLA rules to compute RAG grades; defaults to 60/120 minutes (atRisk/red) if no record.
- CSV endpoint returns `manager_export.csv` with `sla_grade` per item.
