# Field-Friendly CSV + Postman

This bundle adds a **plain-language CSV export** and an optional alias for the overview API,
so PMs and supervisors see everyday language (not G/A/R jargon).

## 1) Unzip
```bash
unzip friendly_language_export_bundle.zip
```

## 2) Mount the friendly routes
In `server/routes.ts`, import and mount alongside your existing manager router:
```ts
import managerFriendlyRouter from "./routes/manager_friendly";
app.use("/api/manager", managerFriendlyRouter);
```
> This does **not** replace your existing `/api/manager` routes — it just adds:
> - `GET /api/manager/export-friendly.csv?days=30`
> - `GET /api/manager/schedule-health?days=30` (alias to overview)

## 3) Update the UI button (optional)
Change your CSV export button to the friendly endpoint:
```tsx
<a href={`/api/manager/export-friendly.csv?days=${days}`} className="btn">Export CSV</a>
```

## 4) Import the Postman collection (optional)
Use `collections/field_friendly_collection.postman_collection.json` to test with the new wording.
