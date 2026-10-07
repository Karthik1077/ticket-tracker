const express = require("express");
const db = require("../db");
const { calculateSlaDeadline, getSlaStatus, SLA_HOURS } = require("../utils/sla");

const router = express.Router();

const VALID_PRIORITIES = Object.keys(SLA_HOURS); // Low, Medium, High, Critical
const VALID_CATEGORIES = ["Hardware", "Software", "Network", "Access", "Other"];
const VALID_STATUSES = ["Open", "In Progress", "Resolved"];

// Attach a computed sla object to a raw ticket row before sending it out —
// the frontend never has to know the calculation, just render the result.
function withSlaStatus(ticket) {
  return { ...ticket, sla: getSlaStatus(ticket) };
}

// POST /api/tickets - create a new ticket
router.post("/", async (req, res) => {
  try {
    const { title, description, category, priority, createdBy } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    if (!createdBy || !createdBy.trim()) {
      return res.status(400).json({ error: "createdBy (who's reporting this) is required" });
    }
    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: `Priority must be one of: ${VALID_PRIORITIES.join(", ")}` });
    }
    const finalCategory = VALID_CATEGORIES.includes(category) ? category : "Other";

    const createdAt = new Date();
    const slaDeadline = calculateSlaDeadline(priority, createdAt);

    const result = await db.query(
      `INSERT INTO tickets (title, description, category, priority, created_by, created_at, sla_deadline)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title.trim(), description || "", finalCategory, priority, createdBy.trim(), createdAt, slaDeadline]
    );

    res.status(201).json({ ticket: withSlaStatus(result.rows[0]) });
  } catch (err) {
    console.error("Create ticket error:", err.message);
    res.status(500).json({ error: "Could not create ticket" });
  }
});

// GET /api/tickets - list all tickets, optionally filtered by status
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    let result;
    if (status && VALID_STATUSES.includes(status)) {
      result = await db.query("SELECT * FROM tickets WHERE status = $1 ORDER BY sla_deadline ASC", [status]);
    } else {
      result = await db.query("SELECT * FROM tickets ORDER BY sla_deadline ASC");
    }
    res.json({ tickets: result.rows.map(withSlaStatus) });
  } catch (err) {
    console.error("List tickets error:", err.message);
    res.status(500).json({ error: "Could not fetch tickets" });
  }
});

// PATCH /api/tickets/:id - update status and/or assignee
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTo } = req.body;

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(", ")}` });
    }

    const existing = await db.query("SELECT * FROM tickets WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Only stamp resolved_at the moment status actually transitions to Resolved.
    const resolvedAt = status === "Resolved" ? new Date() : existing.rows[0].resolved_at;

    const result = await db.query(
      `UPDATE tickets
       SET status = COALESCE($1, status),
           assigned_to = COALESCE($2, assigned_to),
           resolved_at = $3
       WHERE id = $4
       RETURNING *`,
      [status || null, assignedTo || null, resolvedAt, id]
    );

    res.json({ ticket: withSlaStatus(result.rows[0]) });
  } catch (err) {
    console.error("Update ticket error:", err.message);
    res.status(500).json({ error: "Could not update ticket" });
  }
});

// GET /api/tickets/summary - counts for a small dashboard header
router.get("/meta/summary", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM tickets");
    const tickets = result.rows.map(withSlaStatus);

    const summary = {
      total: tickets.length,
      open: tickets.filter((t) => t.status !== "Resolved").length,
      breached: tickets.filter((t) => t.sla.state === "breached" && t.status !== "Resolved").length,
      atRisk: tickets.filter((t) => t.sla.state === "at_risk").length,
    };
    res.json({ summary });
  } catch (err) {
    console.error("Summary error:", err.message);
    res.status(500).json({ error: "Could not compute summary" });
  }
});

module.exports = router;
