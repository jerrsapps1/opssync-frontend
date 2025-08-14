set -euo pipefail

echo "== Creating folders =="
mkdir -p server/sql server/routes server/services client/src/pages scripts

echo "== Writing SQL =="
cat > server/sql/org_entitlements.sql <<'SQL'
create table if not exists org_entitlements (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  branding_enabled boolean not null default false,
  white_label_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
create or replace function org_entitlements_touch() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists trg_org_entitlements_touch on org_entitlements;
create trigger trg_org_entitlements_touch before update on org_entitlements
for each row execute function org_entitlements_touch();
SQL

cat > server/sql/org_white_label.sql <<'SQL'
create table if not exists org_white_label (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  custom_domain text,
  from_email text,
  domain_dns_status text,
  email_spf_dkim_status text,
  updated_at timestamptz not null default now()
);
create or replace function org_white_label_touch() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists trg_org_white_label_touch on org_white_label;
create trigger trg_org_white_label_touch before update on org_white_label
for each row execute function org_white_label_touch();
SQL

echo "== Writing Stripe helper =="
cat > server/services/stripe_addon.ts <<'TS'
import Stripe from "stripe";
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" })
  : null;

export async function ensureAddonOnSubscription(opts: {
  subscriptionId: string;
  priceId: string;
  enabled: boolean;
}) {
  if (!stripe) throw new Error("Stripe not configured");
  const sub = await stripe.subscriptions.retrieve(opts.subscriptionId, { expand: ["items.data.price"] });
  const items = sub.items.data;
  const existing = items.find(i => i.price?.id === opts.priceId);
  if (opts.enabled && !existing) {
    await stripe.subscriptionItems.create({ subscription: sub.id, price: opts.priceId, quantity: 1 });
  } else if (!opts.enabled && existing) {
    await stripe.subscriptionItems.del(existing.id);
  }
  return true;
}
TS

echo "== Writing routes =="
cat > server/routes/owner_branding_admin.ts <<'TS'
import { Router } from "express";
import { Pool } from "pg";
import { requirePlatformOwner } from "../middleware/authz";
import { ensureAddonOnSubscription } from "../services/stripe_addon";

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

router.patch("/branding-settings/:tenantId", requirePlatformOwner, async (req, res) => {
  const tenantId = req.params.tenantId;
  const { branding_enabled, white_label_enabled } = req.body || {};
  await pool.query(\`
    insert into org_entitlements (tenant_id, branding_enabled, white_label_enabled)
    values (\$1, coalesce(\$2,false), coalesce(\$3,false))
    on conflict (tenant_id) do update set
      branding_enabled = coalesce(\$2, org_entitlements.branding_enabled),
      white_label_enabled = coalesce(\$3, org_entitlements.white_label_enabled)
  \`, [tenantId, branding_enabled, white_label_enabled]);

  const { rows } = await pool.query(\`select stripe_subscription_id from org_subscriptions where tenant_id=\$1\`, [tenantId]);
  const subId = rows[0]?.stripe_subscription_id;
  const priceBranding = process.env.STRIPE_PRICE_BRANDING || "";
  const priceWhiteLabel = process.env.STRIPE_PRICE_WHITE_LABEL || "";

  try {
    if (subId && priceBranding && typeof branding_enabled === "boolean") {
      await ensureAddonOnSubscription({ subscriptionId: subId, priceId: priceBranding, enabled: !!branding_enabled });
    }
    if (subId && priceWhiteLabel && typeof white_label_enabled === "boolean") {
      await ensureAddonOnSubscription({ subscriptionId: subId, priceId: priceWhiteLabel, enabled: !!white_label_enabled });
    }
  } catch (e: any) {
    return res.status(200).json({ ok: true, stripe: "update_failed", message: e?.message || "Stripe update failed" });
  }
  res.json({ ok: true });
});

router.get("/branding-settings/:tenantId", requirePlatformOwner, async (req, res) => {
  const tenantId = req.params.tenantId;
  const { rows } = await pool.query(\`select branding_enabled, white_label_enabled from org_entitlements where tenant_id=\$1\`, [tenantId]);
  res.json(rows[0] || { branding_enabled: false, white_label_enabled: false });
});

export default router;
TS

cat > server/routes/org_entitlements.ts <<'TS'
import { Router } from "express";
import { Pool } from "pg";
import { requireOrgAdmin } from "../middleware/authz";

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

router.get("/status", requireOrgAdmin, async (req, res) => {
  const user = (req as any).user || {}; const tenantId = user?.tenantId;
  if (!tenantId) return res.status(400).send("Missing tenant");
  const { rows } = await pool.query(\`select branding_enabled, white_label_enabled from org_entitlements where tenant_id=\$1\`, [tenantId]);
  res.json(rows[0] || { branding_enabled: false, white_label_enabled: false });
});

export default router;
TS

cat > server/routes/white_label.ts <<'TS'
import { Router } from "express";
import { Pool } from "pg";
import { requireOrgAdmin } from "../middleware/authz";

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

router.get("/", requireOrgAdmin, async (req, res) => {
  const user = (req as any).user || {}; const tenantId = user?.tenantId;
  if (!tenantId) return res.status(400).send("Missing tenant");
  const ent = await pool.query(\`select white_label_enabled from org_entitlements where tenant_id=\$1\`, [tenantId]);
  if (!ent.rows[0]?.white_label_enabled) return res.status(403).send("White label not enabled for this org");
  const { rows } = await pool.query(\`select custom_domain, from_email, domain_dns_status, email_spf_dkim_status from org_white_label where tenant_id=\$1\`, [tenantId]);
  res.json(rows[0] || { custom_domain: "", from_email: "", domain_dns_status: "pending", email_spf_dkim_status: "pending" });
});

router.post("/", requireOrgAdmin, async (req, res) => {
  const user = (req as any).user || {}; const tenantId = user?.tenantId;
  if (!tenantId) return res.status(400).send("Missing tenant");
  const ent = await pool.query(\`select white_label_enabled from org_entitlements where tenant_id=\$1\`, [tenantId]);
  if (!ent.rows[0]?.white_label_enabled) return res.status(403).send("White label not enabled for this org");
  const fields = ["custom_domain","from_email","domain_dns_status","email_spf_dkim_status"];
  const payload: any = {}; for (const f of fields) if (f in req.body) payload[f] = req.body[f];
  const cols = Object.keys(payload);
  if (!cols.length) return res.status(400).send("No fields");
  const insertVals = ["\$1"].concat(cols.map((_,i)=>\`\$\${i+2}\`)).join(", ");
  const updates = cols.map((k)=> \`\${k}=EXCLUDED.\${k}\`).join(", ");
  const vals = cols.map(k=>payload[k]);
  await pool.query(\`insert into org_white_label (tenant_id, \${cols.join(",")}) values (\${insertVals}) on conflict (tenant_id) do update set \${updates}\`, [tenantId, ...vals]);
  res.json({ ok: true });
});

export default router;
TS

echo "== Writing client pages =="
cat > client/src/pages/OwnerBrandingControls.tsx <<'TSX'
import React, { useState } from "react";
export default function OwnerBrandingControls() {
  const [tenantId, setTenantId] = useState("");
  const [branding, setBranding] = useState<boolean | null>(null);
  const [whiteLabel, setWhiteLabel] = useState<boolean | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  async function load() {
    setMsg(null);
    const r = await fetch(\`/api/owner-admin/branding-settings/\${tenantId}\`, { credentials: "include" });
    if (r.ok) { const j = await r.json(); setBranding(j.branding_enabled); setWhiteLabel(j.white_label_enabled); }
    else setMsg(await r.text());
  }
  async function save() {
    setMsg(null);
    const r = await fetch(\`/api/owner-admin/branding-settings/\${tenantId}\`, {
      method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branding_enabled: branding, white_label_enabled: whiteLabel })
    });
    setMsg(r.ok ? "Saved." : await r.text());
  }
  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Branding & White Label (Owner)</h1>
      <input className="w-full rounded-xl border p-2" placeholder="Tenant ID" value={tenantId} onChange={e=>setTenantId(e.target.value)} />
      <div className="rounded-2xl border p-4 space-y-3">
        <label className="flex items-center gap-2"><input type="checkbox" checked={!!branding} onChange={e=>setBranding(e.target.checked)} /><span>Branding Enabled</span></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={!!whiteLabel} onChange={e=>setWhiteLabel(e.target.checked)} /><span>White Label Enabled</span></label>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-lg border text-sm" onClick={load}>Load</button>
          <button className="px-3 py-1.5 rounded-lg border text-sm" onClick={save}>Save</button>
        </div>
        {msg && <div className="text-xs text-gray-500">{msg}</div>}
      </div>
      <div className="text-xs text-gray-500">If Stripe price IDs are configured, toggling will add/remove add-on items automatically.</div>
    </div>
  );
}
TSX

cat > client/src/pages/WhiteLabelSettings.tsx <<'TSX'
import React, { useEffect, useState } from "react";
type WL = { custom_domain:string; from_email:string; domain_dns_status:string; email_spf_dkim_status:string };
export default function WhiteLabelSettings() {
  const [wl, setWL] = useState<WL | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  async function load() {
    setMsg(null);
    const r = await fetch("/api/white-label", { credentials: "include" });
    if (r.ok) setWL(await r.json()); else setMsg(await r.text());
  }
  useEffect(()=>{ load(); }, []);
  async function save(patch: Partial<WL>) {
    setMsg(null);
    const r = await fetch("/api/white-label", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    if (r.ok) { await load(); setMsg("Saved."); } else setMsg(await r.text());
  }
  if (!wl) return <div className="p-4 text-sm text-gray-500">Loading…</div>;
  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">White Label Settings</h1>
      <label className="block">
        <div className="text-sm text-gray-600 mb-1">Custom Domain (e.g., portal.yourco.com)</div>
        <input className="w-full rounded-xl border p-2" value={wl.custom_domain} onChange={e=>setWL({...wl, custom_domain:e.target.value})} onBlur={()=>save({ custom_domain: wl.custom_domain })} />
      </label>
      <label className="block">
        <div className="text-sm text-gray-600 mb-1">From Email (e.g., no-reply@yourco.com)</div>
        <input className="w-full rounded-xl border p-2" value={wl.from_email} onChange={e=>setWL({...wl, from_email:e.target.value})} onBlur={()=>save({ from_email: wl.from_email })} />
      </label>
      <div className="rounded-2xl border p-3 text-xs text-gray-600 space-y-1">
        <div>Domain status: <b>{wl.domain_dns_status || "pending"}</b></div>
        <div>Email SPF/DKIM: <b>{wl.email_spf_dkim_status || "pending"}</b></div>
        <div className="text-gray-500 mt-2">We'll guide you through DNS and email verification after you set these values.</div>
      </div>
      {msg && <div className="text-xs text-gray-500">{msg}</div>}
    </div>
  );
}
TSX

echo "== Writing route inserter =="
cat > scripts/insert_stafftrak_branding_routes.js <<'JS'
import fs from "fs";
import path from "path";
const file = path.join(process.cwd(), "server", "routes.ts");
if (!fs.existsSync(file)) { console.log("server/routes.ts not found; please mount routes manually."); process.exit(0); }
let src = fs.readFileSync(file, "utf8");
let changed = false;

// Add imports if missing
const imports = [
  'import ownerBrandingAdminRouter from "./routes/owner_branding_admin";',
  'import orgEntitlementsRouter from "./routes/org_entitlements";',
  'import whiteLabelRouter from "./routes/white_label";'
];
for (const imp of imports) {
  if (!src.includes(imp)) {
    const insertPoint = src.lastIndexOf('import ');
    const lineEnd = src.indexOf('\n', insertPoint);
    src = src.slice(0, lineEnd + 1) + imp + '\n' + src.slice(lineEnd + 1);
    changed = true;
  }
}

// Add route mounts if missing
const routes = [
  '  app.use("/api/owner-admin", ownerBrandingAdminRouter);',
  '  app.use("/api/org-entitlements", orgEntitlementsRouter);',
  '  app.use("/api/white-label", whiteLabelRouter);'
];
for (const route of routes) {
  if (!src.includes(route)) {
    const insertPoint = src.lastIndexOf('const httpServer = createServer(app);');
    src = src.slice(0, insertPoint) + route + '\n\n  ' + src.slice(insertPoint);
    changed = true;
  }
}

if (changed) {
  fs.writeFileSync(file, src);
  console.log("✓ Routes added to server/routes.ts");
} else {
  console.log("✓ Routes already exist in server/routes.ts");
}
JS

echo ""
echo "== Installation complete =="
echo "Now run:"
echo "  psql \"\$DATABASE_URL\" -f server/sql/org_entitlements.sql"
echo "  psql \"\$DATABASE_URL\" -f server/sql/org_white_label.sql"
echo "  node scripts/insert_stafftrak_branding_routes.js"
echo ""
echo "Add to your client router:"
echo "  import OwnerBrandingControls from \"./pages/OwnerBrandingControls\";"
echo "  import WhiteLabelSettings from \"./pages/WhiteLabelSettings\";"
echo "  <Route path=\"/owner/branding\" element={<OwnerBrandingControls />} />"
echo "  <Route path=\"/org/white-label\" element={<WhiteLabelSettings />} />"
echo ""
echo "Environment variables for Stripe add-on prices:"
echo "  STRIPE_PRICE_BRANDING=price_xxx_branding"
echo "  STRIPE_PRICE_WHITE_LABEL=price_xxx_whitelabel"
