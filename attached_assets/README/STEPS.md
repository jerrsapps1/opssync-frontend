# Per-Tenant Runners + Plain-Language Panel

This bundle gives you:
- **Tenant-aware jobs**: run escalations/digest per tenant (filtered by `projects.tenant_id`)
- **Scheduler**: `startCronPerTenant()` to run those safely
- **Field-friendly wording** for the dashboard analytics panel

## 1) Unzip
```bash
unzip tenant_runners_and_plain_language_bundle.zip
```

## 2) Use the per-tenant scheduler
```ts
// server/index.ts
import { startCronPerTenant } from "./services/cron_feature_checks_tenant";
startCronPerTenant();
```

## 3) (Optional) Remove older scheduler calls
Comment out or remove any previous `startTimelinessAddons()` or similar.

## 4) Drop in the plain-language panel (replaces the technical one)
```tsx
// client/src/pages/Dashboard.tsx
import FieldFriendlyRAGPanel from "../partials/FieldFriendlyRAGPanel";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* ...your existing tiles... */}
      <FieldFriendlyRAGPanel />
    </div>
  );
}
```

### Copy terms used
- Green → **On time**
- Amber → **Due soon**
- Red → **Late**
- SLA / RAG Overview → **Schedule Health**
- Daily trend → **Daily activity**

You can tweak `client/src/lib/copy.ts` to match your brand voice.
