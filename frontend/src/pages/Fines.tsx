import {} from "react";

interface Fine {
  id: number;
  loan_id: number;
  member_name: string;
  book_title: string;
  amount: number;
  payment_status: "PAID" | "UNPAID";
  created_at: string;
}

const fines: Fine[] = [
  { id: 201, loan_id: 102, member_name: "M. Okafor", book_title: "Dune", amount: 5, payment_status: "UNPAID", created_at: "2026-08-16" },
  { id: 202, loan_id: 107, member_name: "T. Nguyen", book_title: "The Girl with the Dragon Tattoo", amount: 7.5, payment_status: "UNPAID", created_at: "2026-08-20" },
  { id: 203, loan_id: 105, member_name: "R. Patel", book_title: "The Handmaid's Tale", amount: 10, payment_status: "UNPAID", created_at: "2026-08-23" },
  { id: 204, loan_id: 101, member_name: "K. Chen", book_title: "1984", amount: 2.5, payment_status: "UNPAID", created_at: "2026-08-25" },
  { id: 205, loan_id: 99, member_name: "A. Rivera", book_title: "The Great Gatsby", amount: 3, payment_status: "PAID", created_at: "2026-07-12" },
  { id: 206, loan_id: 103, member_name: "J. Park", book_title: "Fahrenheit 451", amount: 0, payment_status: "PAID", created_at: "2026-08-14" },
  { id: 207, loan_id: 95, member_name: "L. Santos", book_title: "The Hobbit", amount: 4.5, payment_status: "PAID", created_at: "2026-06-30" },
];

function statusPill(s: Fine["payment_status"]) {
  return s === "PAID" ? (
    <span className="pill pill-paid">Paid</span>
  ) : (
    <span className="pill pill-unpaid">Unpaid</span>
  );
}

function dateStr(d: string) {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Fines() {
  const totalUnpaid = fines
    .filter((f) => f.payment_status === "UNPAID")
    .reduce((s, f) => s + f.amount, 0);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Fines</h1>
          <div className="page-sub">{fines.length} records · penalties</div>
        </div>
        <div className="value-list">
          <span className="stat-label" style={{ textTransform: "none", letterSpacing: 0 }}>
            Total unpaid:
          </span>
          <span className="money op" style={{ fontSize: 18, fontWeight: 700 }}>
            ${totalUnpaid.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fine ID</th>
                <th>Member</th>
                <th>Book</th>
                <th>Loan</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {fines.map((f) => (
                <tr key={f.id} className={f.payment_status === "UNPAID" ? "row-alert" : ""}>
                  <td className="mono text-muted">#{f.id}</td>
                  <td className="text-muted">{f.member_name}</td>
                  <td className="text-muted">{f.book_title}</td>
                  <td className="mono text-muted">#{f.loan_id}</td>
                  <td className="money">
                    {f.amount === 0 ? (
                      <span className="money zero">$0.00</span>
                    ) : (
                      `$${f.amount.toFixed(2)}`
                    )}
                  </td>
                  <td>{statusPill(f.payment_status)}</td>
                  <td className="mono text-muted">{dateStr(f.created_at)}</td>
                  <td>
                    <button className="btn btn-sm btn-ghost">Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {fines.filter((f) => f.payment_status === "UNPAID").length === 0 && (
        <div className="empty">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </div>
          All fines have been settled.
        </div>
      )}
    </>
  );
}
