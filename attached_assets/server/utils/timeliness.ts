export type TimelinessStatus = "ON_TIME" | "AT_RISK" | "OVERDUE";

export function computeStatus(dueAtISO: string, submittedAtISO?: string | null, warnMinutes = 60): TimelinessStatus {
  const now = Date.now();
  const dueAt = new Date(dueAtISO).getTime();
  const submittedAt = submittedAtISO ? new Date(submittedAtISO).getTime() : null;

  if (submittedAt && submittedAt <= dueAt) return "ON_TIME";
  if (!submittedAt) {
    if (now > dueAt) return "OVERDUE";
    if (now > dueAt - warnMinutes * 60_000) return "AT_RISK";
    return "ON_TIME";
  }
  // Submitted late
  return submittedAt > dueAt ? "OVERDUE" : "ON_TIME";
}
