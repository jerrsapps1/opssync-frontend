# StaffTrak — Branding & White Label Quick Test (Replit)

Use this to verify everything before pushing to GitHub/Render.

## 0) Boot & env
- Start app: `npm run dev` (or your command)
- Check env: `echo $DATABASE_URL` and `echo $STRIPE_SECRET_KEY` (if using Stripe add-ons)

## 1) DB migrated?
```bash
psql "$DATABASE_URL" -c "\d organizations" | sed -n '1,120p'
```
Expect to see columns: `branding_enabled`, `white_label_enabled`, `custom_domain`, `from_email`, `white_label_status`.
If missing:
```bash
psql "$DATABASE_URL" -f server/sql/org_entitlements.sql
psql "$DATABASE_URL" -f server/sql/org_white_label.sql
```

## 2) Backend routes mounted (before `return httpServer;`)
```ts
app.use("/api/owner-admin", ownerBrandingAdminRouter);
app.use("/api/org-admin/entitlements", orgEntitlementsRouter);
app.use("/api/white-label", whiteLabelRouter);
```

## 3) Owner toggle API
```bash
# Read
curl -i -b cookies.txt -c cookies.txt http://localhost:3000/api/owner-admin/branding-settings/<TENANT_ID>
# Enable both
curl -i -X PATCH -H "Content-Type: application/json"   -b cookies.txt -c cookies.txt   -d '{"branding_enabled":true,"white_label_enabled":true}'   http://localhost:3000/api/owner-admin/branding-settings/<TENANT_ID>
```

## 4) Org can read entitlements
```bash
curl -i -b cookies.txt -c cookies.txt http://localhost:3000/api/org-admin/entitlements/status
```
Expect: `{"branding_enabled":true,"white_label_enabled":true}`

## 5) White-label settings (org)
UI: `/org/white-label` → set `portal.example.com` + `no-reply@example.com`, Save → expect “Saved.” and statuses (pending).  
API:
```bash
curl -i -X POST -H "Content-Type: application/json"   -b cookies.txt -c cookies.txt   -d '{"custom_domain":"portal.example.com","from_email":"no-reply@example.com"}'   http://localhost:3000/api/white-label
```

## 6) Owner page renders
Visit `/owner/branding` → Load tenant → flip toggles → Save (no error toast).

## 7) (Optional) Stripe add-on sanity
Set env:
```
STRIPE_PRICE_BRANDING=price_xxx_branding
STRIPE_PRICE_WHITE_LABEL=price_xxx_whitelabel
```
Ensure a subscription exists for the tenant, then flip toggles and confirm items update in Stripe.

## 8) UI sweep
- `/org/branding` loads
- Dashboard OK, no console errors
- No TS build errors in Replit logs

## 9) Common fixes
- 404 routes → ensure `app.use(...)` lines are above `return httpServer;`
- 403 org endpoints → log in as an **org admin** for that tenant
- Stripe errors in owner toggle → fine in dev without price envs
- Client POST URL mismatch fix:
```bash
sed -i 's|/api/org-admin/white-label/settings|/api/white-label|g' client/src/pages/WhiteLabelSettings.tsx
```

---

# 🚀 Deployment Ready Checklist

Before pushing to GitHub & deploying to Render/Netlify/Cloudflare:

1. **Secrets & Envs set**  
   - OWNER_EMAIL, OWNER_PASSWORD_HASH (hashed password)  
   - DATABASE_URL (points to production DB)  
   - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET (if payments enabled)  
   - STRIPE_PRICE_BRANDING, STRIPE_PRICE_WHITE_LABEL (if upselling)  

2. **Frontend build OK**  
   ```bash
   npm run build
   ```
   No TypeScript errors, no missing imports.

3. **Backend health check OK**  
   ```bash
   curl https://<your-api-domain>/api/ping
   ```
   Returns `{ "pong": true }`.

4. **Stripe webhook deployed**  
   Ensure `/api/stripe/webhook` is **raw body** and connected in Stripe dashboard.

5. **Custom domains mapped**  
   - Main site: safetysync.ai or stafftrak.ai  
   - Any white-label subdomains are added in DNS + TLS issued.

6. **Final smoke test in staging**  
   - Owner dashboard loads  
   - Org branding & white-label toggles work  
   - Login/logout works  
   - No console/network errors

---
