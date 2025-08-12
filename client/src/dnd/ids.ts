export type Kind = "employee" | "equipment";

export function buildDroppableId(kind: Kind, projectId: string | null) {
  return `${kind}-${projectId ?? "unassigned"}`;
}

export function parseDroppableId(id: string): { kind: Kind; projectId: string | null } | null {
  const m = id.match(/^(employee|equipment)-(.*)$/);
  if (!m) return null;
  const kind = m[1] as Kind;
  const rest = m[2];
  const projectId = rest === "unassigned" ? null : rest;
  return { kind, projectId };
}