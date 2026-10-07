import { api } from "../api.js";

const STATUSES = ["Open", "In Progress", "Resolved"];

export default function TicketCard({ ticket, onChanged }) {
  async function handleStatusChange(e) {
    await api.updateTicket(ticket.id, { status: e.target.value });
    onChanged();
  }

  return (
    <div className={`ticket-card state-${ticket.sla.state}`}>
      <div className="ticket-top">
        <div>
          <div className="ticket-title">{ticket.title}</div>
          <div className="ticket-id">#{ticket.id}</div>
        </div>
        <span className={`sla-badge state-${ticket.sla.state}`}>{ticket.sla.label}</span>
      </div>

      {ticket.description && (
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0 0 0.6rem" }}>
          {ticket.description}
        </p>
      )}

      <div className="ticket-meta">
        <span className="tag">{ticket.category}</span>
        <span className="tag">{ticket.priority} priority</span>
        <span>Reported by {ticket.created_by}</span>
        {ticket.assigned_to && <span>· Assigned to {ticket.assigned_to}</span>}
      </div>

      <div className="ticket-actions">
        <select value={ticket.status} onChange={handleStatusChange}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
