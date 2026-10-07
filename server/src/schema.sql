-- IT Ticket Tracker schema (PostgreSQL)
--
-- Note: no user/login table here on purpose — in a real helpdesk tool this
-- would sit behind company auth (like Split's JWT login). This project's
-- point is the ticket + SLA logic, so we keep it to one focused table.

CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Other',       -- Hardware, Software, Network, Access, Other
  priority TEXT NOT NULL,                        -- Low, Medium, High, Critical
  status TEXT NOT NULL DEFAULT 'Open',            -- Open, In Progress, Resolved
  created_by TEXT NOT NULL,                       -- who reported it
  assigned_to TEXT,                               -- who's handling it (nullable until assigned)
  created_at TIMESTAMP DEFAULT NOW(),
  sla_deadline TIMESTAMP NOT NULL,                -- calculated at creation time from priority
  resolved_at TIMESTAMP                           -- filled in only when status becomes Resolved
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
