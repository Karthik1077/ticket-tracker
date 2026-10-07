# 🎫 Desk — IT Ticket Tracker with SLA Timer

A helpdesk tool for logging IT support tickets, tracking them by priority,
and watching a live countdown against each ticket's SLA (Service Level
Agreement) deadline — with automatic on-track / at-risk / breached status.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)
![Vite](https://img.shields.io/badge/Build-Vite-646CFF?logo=vite&logoColor=white)

---

## 📸 Screenshots

<!-- See "Adding screenshots" near the bottom for exactly how to capture these -->

| Dashboard | Ticket with SLA badge |
|---|---|
| ![Dashboard](./screenshots/dashboard.png) | ![Ticket](./screenshots/ticket.png) |

---

## ✨ Features

- 🎫 **Log tickets** — title, description, category (Hardware/Software/Network/Access), and priority
- 🆔 **Employee ID + location** — uniquely identifies the reporter (names alone collide) and tells an agent where to find them for hardware pickup
- ⏱️ **Automatic SLA deadlines** — every ticket gets a response deadline the instant it's created, based on priority
- 🟢🟡🔴 **Live breach tracking** — tickets show as on-track, at-risk, or breached, updating automatically
- 📊 **Dashboard summary** — total, open, at-risk, and breached ticket counts at a glance
- 🔔 **Email notifications** — agents notified when a new ticket comes in; employees notified when theirs is resolved
- 🔍 **Filter & sort** — by status, so agents can focus on what's actually urgent

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite) |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Hosting (suggested) | Vercel (frontend) + Render (backend) + Supabase (database) |

---

## 🧠 How the SLA logic works

The core logic lives in `server/src/utils/sla.js`:

**1. Deadline calculation** — the moment a ticket is created, it's assigned
a deadline based on priority:

| Priority | Response window |
|---|---|
| Critical | 1 hour |
| High | 4 hours |
| Medium | 24 hours |
| Low | 72 hours |

**2. Breach classification** — at any moment, an open ticket's status is
computed by comparing the current time against its deadline (or, for
resolved tickets, comparing the actual resolution time against the
deadline instead):

- **On track** — plenty of time left
- **At risk** — less than 20% of the original window remains
- **Breached** — deadline has passed

This mirrors real helpdesk SLA practices and was verified against multiple
test scenarios before being wired into the UI.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A PostgreSQL database (free options: [Supabase](https://supabase.com), [Neon](https://neon.tech))

### 1. Backend

```bash
cd server
npm install
cp .env.example .env     # fill in DATABASE_URL
npm run migrate            # creates the tickets table
npm run dev                 # runs on http://localhost:4001
```

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env     # defaults to http://localhost:4001
npm run dev                 # runs on http://localhost:5174
```

Open `http://localhost:5174`, log a ticket at each priority level, and
watch the SLA badge change color as time passes.

---

## 📂 Project Structure

```
ticket-tracker/
├── server/
│   └── src/
│       ├── routes/tickets.js   create / list / update / summary endpoints
│       ├── utils/
│       │   ├── sla.js           the SLA deadline + breach-status logic
│       │   └── notify.js         email notifications
│       └── schema.sql
└── client/
    └── src/
        ├── App.jsx                dashboard layout, live polling
        └── components/
            ├── TicketForm.jsx
            └── TicketCard.jsx
```

---

## 🗺️ Roadmap

- [ ] Agent accounts / login (currently open — by design, to keep focus on the SLA logic)
- [ ] Auto-escalation if a ticket goes unassigned past a threshold
- [ ] Per-agent ticket view

---

## 📷 Adding screenshots

1. Run the app locally, open it in your browser
2. Press **Windows + Shift + S**, capture the dashboard and a ticket card
3. Create a `screenshots` folder inside `ticket-tracker`, paste the images in as `dashboard.png` and `ticket.png`
4. They'll render automatically in the table above once pushed to GitHub

---

## 🙋 Why I built this

Built specifically to understand, hands-on, what "log, track, prioritize,
and resolve support requests within SLA timelines" actually means
operationally — directly ahead of applying for IT helpdesk roles that use
this exact language.
