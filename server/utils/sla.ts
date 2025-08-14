export type SLARules = {
  // Minutes before due considered "at risk"; after due = overdue
  atRiskMinutes: number;
  // Allowed overdue minutes before turning Red; else Amber if overdue < redMinutes
  redMinutes: number;
};

export type SLAScore = "GREEN" | "AMBER" | "RED";

export function scoreBySLA(dueAtISO: string, submittedAtISO: string | null, rules: SLARules): SLAScore {
  const now = Date.now();
  const due = new Date(dueAtISO).getTime();
  const submitted = submittedAtISO ? new Date(submittedAtISO).getTime() : null;

  // On time: submitted before due
  if (submitted && submitted <= due) return "GREEN";

  // Not submitted yet
  if (!submitted) {
    if (now <= due) return "GREEN"; // still time
    const overdueMin = Math.floor((now - due) / 60000);
    return overdueMin >= rules.redMinutes ? "RED" : "AMBER";
  }

  // Submitted but late
  const lateMin = Math.floor((submitted - due) / 60000);
  return lateMin >= rules.redMinutes ? "RED" : "AMBER";
}

export const defaultSLARules: SLARules = {
  atRiskMinutes: 60,
  redMinutes: 120,
};