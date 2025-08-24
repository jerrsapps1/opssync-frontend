import React, { useEffect, useState } from "react";
import PlanSelector from "../components/PlanSelector";
import InviteForm from "../components/InviteForm";

type Org = {
  id: string;
  name: string;
  plan: "single" | "five" | "ten";
  seat_limit: number;
  seats_used: number;
};

export default function BillingManagement() {
  const [org, setOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/org");
      const data = await res.json();
      setOrg(data.org);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load org");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function onPlanChange(plan: "single" | "five" | "ten") {
    try {
      const res = await fetch("/api/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upgrade failed");
      await refresh();
      alert("Plan updated");
    } catch (e: any) {
      alert(e.message);
    }
  }

  if (loading) return <p>Loading…</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!org) return <p>No organization found.</p>;

  return (
    <div>
      <h2>Billing Management</h2>
      <p><b>Organization:</b> {org.name}</p>
      <p><b>Current Plan:</b> {org.plan} — {org.seats_used}/{org.seat_limit} seats used</p>

      <PlanSelector value={org.plan} onChange={onPlanChange} />

      <hr style={{ margin: "24px 0" }} />

      <h3>Invite Users</h3>
      <InviteForm onInvited={refresh} remaining={org.seat_limit - org.seats_used} />
    </div>
  );
}