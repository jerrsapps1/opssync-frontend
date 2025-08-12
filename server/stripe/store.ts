import fs from "fs";
import path from "path";

const DATA = path.join(process.cwd(), "data");
const FILE = path.join(DATA, "customers.json");

type CustomerRecord = {
  orgId: string;              // your tenant/org identifier
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  plan?: "starter" | "growth" | "enterprise";
  status?: "active" | "past_due" | "canceled" | "trialing" | "incomplete";
};

type Store = {
  byCustomerId: Record<string, CustomerRecord>;
  byOrgId: Record<string, CustomerRecord>;
};

function load(): Store {
  if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify({ byCustomerId: {}, byOrgId: {} }, null, 2));
  try { return JSON.parse(fs.readFileSync(FILE, "utf-8")); } catch { return { byCustomerId: {}, byOrgId: {} }; }
}

function save(store: Store) {
  if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(store, null, 2));
}

export function upsertCustomer(rec: CustomerRecord) {
  const st = load();
  st.byCustomerId[rec.stripeCustomerId] = rec;
  st.byOrgId[rec.orgId] = rec;
  save(st);
}

export function getByCustomerId(id: string): CustomerRecord | undefined {
  const st = load();
  return st.byCustomerId[id];
}

export function getByOrgId(orgId: string): CustomerRecord | undefined {
  const st = load();
  return st.byOrgId[orgId];
}

export function allCustomers(): CustomerRecord[] {
  const st = load();
  return Object.values(st.byCustomerId);
}
