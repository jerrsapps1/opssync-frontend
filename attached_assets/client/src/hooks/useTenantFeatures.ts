import { useEffect, useState } from "react";

type Features = { SUPERVISOR:boolean; MANAGER:boolean; SLA:boolean; REMINDERS:boolean; ESCALATIONS:boolean; WEEKLY_DIGEST:boolean };

export function useTenantFeatures() {
  const [features, setFeatures] = useState<Features | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/org-admin/features", { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setFeatures(json.features);
    } catch (e: any) {
      setError(e?.message || "Failed to load features"); 
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return { features, loading, error, reload: load };
}
