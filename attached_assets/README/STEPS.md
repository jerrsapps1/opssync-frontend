# Tone Alignment + Email Legend

This bundle standardizes language to **On time / Due soon / Late** and adds a visible legend to emails.

## 1) Unzip
```bash
unzip tone_alignment_bundle.zip
```

## 2) Replace calls to use friendly runners (optional but recommended)
If you already use the per-tenant scheduler, switch to the friendly versions:

```ts
// server/services/cron_feature_checks_tenant.ts (or your scheduler file)
import { runEscalationsForTenantFriendly } from "./escalation_friendly";
import { runWeeklyDigestForTenantFriendly } from "./digest_friendly";

// ...inside tenant loops...
await runEscalationsForTenantFriendly(t.id);
await runWeeklyDigestForTenantFriendly(t.id);
```

## 3) Templates
- Shared HTML helpers: `server/utils/email_templates.ts` (legend, status pill, wrapper)
- Escalations: `server/services/escalation_friendly.ts`
- Weekly digest: `server/services/digest_friendly.ts`

## 4) UI
Your field-friendly dashboard panel already uses the same terms.
If you still have older components with G/A/R wording, keep using the `copy.ts` pattern or replace strings to match:
- Green → On time
- Amber → Due soon
- Red → Late
