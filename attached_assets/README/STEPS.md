# Merge Manager into Dashboard (No extra page)

This bundle gives you a **DashboardRAGPanel** you can drop into your existing Dashboard page,
and a safe script to remove the standalone Manager Dashboard route/link if it exists.

## 1) Unzip
```bash
unzip merge_manager_into_dashboard_bundle.zip
```

## 2) Use the panel in your current Dashboard
Open your Dashboard page (e.g. `client/src/pages/Dashboard.tsx`) and drop in:

```tsx
import DashboardRAGPanel from "../partials/DashboardRAGPanel";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* ... your existing tiles ... */}
      <DashboardRAGPanel />
    </div>
  );
}
```

Make sure you already mounted the backend routes from the Manager bundle:
`app.use("/api/manager", managerRouter);` in `server/routes.ts`

## 3) (Optional) Remove the standalone Manager Dashboard
```bash
node scripts/remove_manager_dashboard.js
```

This will try to comment out the Manager route + sidebar link in common files
and delete `client/src/pages/ManagerDashboard.tsx` if present. If it can't find things,
it does nothing (safe). You can also just leave it hidden with flags (`VITE_FEATURE_MANAGER=0`).

## 4) That’s it
Your users keep a single dashboard, now enhanced with SLA/RAG metrics, trends, and CSV export.
