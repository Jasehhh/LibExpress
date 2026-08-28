import React from "react";

interface Loan {
  id: number;
  book_title: string;
  member_name: string;
  status: "ACTIVE" | "RETURNED" | "OVERDUE";
  checkout_date: string;
  dueDate: string;
  return_date: string | null;
}

const loans: Loan[] = [
  { id: 101, book_title: "1984", member_name: "K. Chen", status: "ACTIVE", checkout_date: "2026-08-15", dueDate: "2026-08-29", return_date: null },
  { id: 102, book_title: "Dune", member_name: "M. Okafor", status: "OVERDUE", checkout_date: "2026-08-01", dueDate: "2026-08-15", return_date: null },
  { id: 103, book_title: "The Great Gatsby", member_name: "A. Rivera", status: "RETURNED", checkout_date: "2026-07-28", dueDate: "2026-08-11", return_date: "2026-08-10" },
  { id: 104, book_title: "Fahrenheit 451", member_name: "J. Park", status: "RETURNED", checkout_date: "2026-08-02", dueDate: "2026-08-16", return_date: "2026-08-14" },
  { id: 105, book_title: "The Hobbit", member_name: "L. Santos", status: "ACTIVE", checkout_date: "2026-08-20", dueDate: "2026-09-03", return_date: null },
  { id: 106, book_title: "The Handmaid's Tale", member_name: "R. Patel", status: "ACTIVE", checkout_date: "2026-08-22", dueDate: "2026-09-05", return_date: null },
  { id: 107, book_title: "The Girl with the Dragon Tattoo", member_name: "T. Nguyen", status: "OVERDUE", checkout_date: "2026-08-05", dueDate: "2026-08-19", return_date: null },
  { id: 108, book_title: "Pride and Prejudice", member_name: "S. Williams", status: "RETURNED", checkout_date: "2026-08-10", dueDate: "2026-08-24", return_date: "2026-08-23" },
];

function statusPill(s: Loan["status"]) {
  switch (s) {
    case "ACTIVE":
      return <span className="pill pill-active">Active</span>;
    case "RETURNED":
      return <span className="pill pill-returned">Returned</span>;
    case "OVERDUE":
      return <span className="pill pill-overdue">Overdue</span>;
  }
}

function dateStr(d: string) {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Loans() {
  const [filter, setFilter] = React.useState<"all" | "active" | "overdue" | "returned">("all");

  const filtered =
    filter === "all"
      ? loans
      : loans.filter((l) => l.status.toLowerCase() === filter);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Loans</h1>
          <div className="page-sub">{loans.length} records · circulation</div>
        </div>
      </div>

      <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
        {(["all", "active", "overdue", "returned"] as const).map((f) => (
          <button
            key={f}
            className="btn btn-sm"
            style={{
              borderColor:
                filter === f ? "var(--neon-blue)" : "var(--border-2)",
              color:
                filter === f ? "var(--neon-blue)" : "var(--text)",
              background:
                filter === f ? "var(--neon-blue-dim)" : "var(--panel-2)",
            }}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Book</th>
                <th>Member</th>
                <th>Status</th>
                <th>Checked Out</th>
                <th>Due Date</th>
                <th>Returned</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className={l.status === "OVERDUE" ? "row-alert" : ""}>
                  <td className="mono text-muted">#{l.id}</td>
                  <td>{l.book_title}</td>
                  <td className="text-muted">{l.member_name}</td>
                  <td>{statusPill(l.status)}</td>
                  <td className="mono text-muted">{dateStr(l.checkout_date)}</td>
                  <td className="mono">{dateStr(l.dueDate)}</td>
                  <td className="mono text-muted">
                    {l.return_date ? dateStr(l.return_date) : "—"}
                  </td>
                  <td>
                    <button className="btn btn-sm btn-ghost">Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="empty">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          No loans match this filter.
        </div>
      )}
    </>
  );
}
