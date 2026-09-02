import {} from "react";

interface Member {
  id: number;
  email: string;
  full_name: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED";
  active_loans_count: number;
  unpaid_fines_total: number;
}

const members: Member[] = [
  { id: 1, email: "a.rivera@example.com", full_name: "Ana Rivera", role: "USER", status: "ACTIVE", active_loans_count: 1, unpaid_fines_total: 0 },
  { id: 2, email: "k.chen@example.com", full_name: "Kai Chen", role: "USER", status: "ACTIVE", active_loans_count: 2, unpaid_fines_total: 0 },
  { id: 3, email: "m.okafor@example.com", full_name: "Maya Okafor", role: "USER", status: "ACTIVE", active_loans_count: 1, unpaid_fines_total: 15 },
  { id: 4, email: "j.park@example.com", full_name: "Jordan Park", role: "USER", status: "ACTIVE", active_loans_count: 0, unpaid_fines_total: 0 },
  { id: 5, email: "l.santos@example.com", full_name: "Lucas Santos", role: "USER", status: "ACTIVE", active_loans_count: 1, unpaid_fines_total: 0 },
  { id: 6, email: "r.patel@example.com", full_name: "Ravi Patel", role: "USER", status: "SUSPENDED", active_loans_count: 0, unpaid_fines_total: 45.5 },
  { id: 7, email: "t.nguyen@example.com", full_name: "Tina Nguyen", role: "USER", status: "ACTIVE", active_loans_count: 2, unpaid_fines_total: 5 },
  { id: 8, email: "s.williams@example.com", full_name: "Sam Williams", role: "USER", status: "ACTIVE", active_loans_count: 0, unpaid_fines_total: 0 },
  { id: 9, email: "admin@libexpress.local", full_name: "System Admin", role: "ADMIN", status: "ACTIVE", active_loans_count: 0, unpaid_fines_total: 0 },
];

function statusPill(s: Member["status"]) {
  return s === "ACTIVE" ? (
    <span className="pill pill-active">Active</span>
  ) : (
    <span className="pill pill-suspended">Suspended</span>
  );
}

function rolePill(r: Member["role"]) {
  return r === "ADMIN" ? (
    <span className="pill pill-admin">Admin</span>
  ) : (
    <span className="pill pill-user">User</span>
  );
}

function finesDisplay(m: Member) {
  if (m.unpaid_fines_total === 0)
    return <span className="money zero">$0.00</span>;
  return <span className="money op">${m.unpaid_fines_total.toFixed(2)}</span>;
}

export default function Members() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Members</h1>
          <div className="page-sub">{members.length} registered · patrons</div>
        </div>
        <button className="btn">+ Add Member</button>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Active Loans</th>
                <th>Unpaid Fines</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className={m.status === "SUSPENDED" ? "row-alert" : ""}>
                  <td>
                    <div>
                      <div style={{ fontWeight: 600 }}>{m.full_name}</div>
                      <div className="mono text-muted" style={{ fontSize: 11.5 }}>
                        #{m.id}
                      </div>
                    </div>
                  </td>
                  <td className="mono text-muted" style={{ fontSize: 12.5 }}>
                    {m.email}
                  </td>
                  <td>{rolePill(m.role)}</td>
                  <td>{statusPill(m.status)}</td>
                  <td className="mono">{m.active_loans_count}</td>
                  <td>{finesDisplay(m)}</td>
                  <td>
                    <button className="btn btn-sm btn-ghost">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
