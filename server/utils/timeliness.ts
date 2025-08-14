export type TimelinessStatus = "ON_TIME" | "AT_RISK" | "OVERDUE";

export function computeStatus(dueAt: string, submittedAt: string | null, warnMinutesBeforeDue: number): TimelinessStatus {
  const due = new Date(dueAt);
  const now = new Date();
  
  // If already submitted, it's on time
  if (submittedAt) {
    return "ON_TIME";
  }
  
  // If past due, it's overdue
  if (now > due) {
    return "OVERDUE";
  }
  
  // If within warning window before due, it's at risk
  const warningTime = new Date(due.getTime() - (warnMinutesBeforeDue * 60 * 1000));
  if (now >= warningTime) {
    return "AT_RISK";
  }
  
  // Otherwise, it's on time
  return "ON_TIME";
}