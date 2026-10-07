import { useEffect, useState, useCallback } from "react";
import { api } from "./api.js";
import TicketForm from "./components/TicketForm.jsx";
import TicketCard from "./components/TicketCard.jsx";

const FILTERS = ["All", "Open", "In Progress", "Resolved"];

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [summary, setSummary] = useState({ total: 0, open: 0, breached: 0, atRisk: 0 });
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      const statusParam = filter === "All" ? undefined : filter;
      const [ticketData, summaryData] = await Promise.all([
        api.listTickets(statusParam),
        api.getSummary(),
      ]);
      setTickets(ticketData.tickets);
      setSummary(summaryData.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadData();
    // Re-fetch every 30s so SLA countdowns / breach states stay current
    // even if nobody touches the page — a real support dashboard would
    // do the same thing.
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          Desk<span>.</span>
        </div>
        <div className="stat-row">
          <span className="stat-chip">
            Total <strong>{summary.total}</strong>
          </span>
          <span className="stat-chip">
            Open <strong>{summary.open}</strong>
          </span>
          <span className="stat-chip at-risk">
            At risk <strong>{summary.atRisk}</strong>
          </span>
          <span className="stat-chip breached">
            Breached <strong>{summary.breached}</strong>
          </span>
        </div>
      </header>

      <main>
        <TicketForm onCreated={loadData} />

        <div>
          <div className="filter-row">
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {error && <div className="error-text">{error}</div>}

          {loading ? (
            <p className="loading-text">Loading tickets…</p>
          ) : tickets.length === 0 ? (
            <p className="empty-text">No tickets here. Log one on the left to get started.</p>
          ) : (
            tickets.map((t) => <TicketCard key={t.id} ticket={t} onChanged={loadData} />)
          )}
        </div>
      </main>
    </div>
  );
}
