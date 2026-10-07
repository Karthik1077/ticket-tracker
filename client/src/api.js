const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4001";

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body
  }
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  listTickets: (status) => request(`/tickets${status ? `?status=${status}` : ""}`),
  createTicket: (body) => request("/tickets", { method: "POST", body }),
  updateTicket: (id, body) => request(`/tickets/${id}`, { method: "PATCH", body }),
  getSummary: () => request("/tickets/meta/summary"),
};
