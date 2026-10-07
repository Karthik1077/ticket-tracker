/**
 * SLA (Service Level Agreement) rules: how long support has to respond,
 * based on how urgent the ticket is. These windows are a common industry
 * convention for L1 helpdesk support — critical issues get looked at fast,
 * low-priority ones get more slack.
 */
const SLA_HOURS = {
  Critical: 1,
  High: 4,
  Medium: 24,
  Low: 72,
};

/**
 * Given a priority and the moment the ticket was created, work out the
 * exact deadline by which it should be resolved.
 *
 * Example: a "High" ticket created at 10:00 AM gets a deadline of 2:00 PM
 * the same day (10:00 + 4 hours).
 */
function calculateSlaDeadline(priority, createdAt = new Date()) {
  const hours = SLA_HOURS[priority] ?? SLA_HOURS.Medium; // default to Medium if unknown
  const deadline = new Date(createdAt);
  deadline.setHours(deadline.getHours() + hours);
  return deadline;
}

/**
 * Work out where a ticket stands against its SLA deadline right now.
 *
 * - Resolved tickets are judged against when they were actually resolved:
 *   "met" if resolved before the deadline, "breached" if resolved late.
 * - Open/In Progress tickets are judged against the current time:
 *   "on_track" if there's still time, "at_risk" if less than 20% of the
 *   original window remains, "breached" if the deadline has already passed.
 *
 * Returns an object the frontend can use directly to render a status badge
 * and a human-readable countdown.
 */
function getSlaStatus(ticket) {
  const deadline = new Date(ticket.sla_deadline);
  const created = new Date(ticket.created_at);
  const totalWindowMs = deadline - created;

  if (ticket.status === "Resolved") {
    const resolvedAt = new Date(ticket.resolved_at);
    return {
      state: resolvedAt <= deadline ? "met" : "breached",
      label: resolvedAt <= deadline ? "Resolved on time" : "Resolved late",
    };
  }

  const now = new Date();
  const msRemaining = deadline - now;

  if (msRemaining <= 0) {
    return { state: "breached", label: "SLA breached", msRemaining };
  }

  const percentRemaining = msRemaining / totalWindowMs;
  if (percentRemaining <= 0.2) {
    return { state: "at_risk", label: formatCountdown(msRemaining) + " left", msRemaining };
  }

  return { state: "on_track", label: formatCountdown(msRemaining) + " left", msRemaining };
}

/** Turns milliseconds into a short "2h 15m" style string for display. */
function formatCountdown(ms) {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

module.exports = { SLA_HOURS, calculateSlaDeadline, getSlaStatus, formatCountdown };
