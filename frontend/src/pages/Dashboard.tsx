import {} from "react";

const stats = [
  {
    label: "total books",
    value: "1,247",
    delta: "+12 this month",
    deltaClass: "good",
  },
  {
    label: "registered members",
    value: "842",
    delta: "+38 this month",
    deltaClass: "good",
  },
  {
    label: "active loans",
    value: "214",
    delta: "12 overdue",
    deltaClass: "warn",
  },
  {
    label: "unpaid fines",
    value: "$1,847.50",
    delta: "from 38 members",
    deltaClass: "warn",
  },
];

const recentActivity = [
  {
    dot: "green",
    text: (
      <>
        <strong>"The Great Gatsby"</strong> returned by <strong>A. Rivera</strong>
      </>
    ),
    time: "2 min ago",
  },
  {
    dot: "blue",
    text: (
      <>
        <strong>"1984"</strong> checked out by <strong>K. Chen</strong>
      </>
    ),
    time: "18 min ago",
  },
  {
    dot: "alert",
    text: (
      <>
        <strong>"Dune"</strong> loan overdue — <strong>M. Okafor</strong>
      </>
    ),
    time: "2 h ago",
  },
  {
    dot: "green",
    text: (
      <>
        <strong>"Fahrenheit 451"</strong> returned by <strong>J. Park</strong>
      </>
    ),
    time: "5 h ago",
  },
  {
    dot: "blue",
    text: (
      <>
        <strong>"The Hobbit"</strong> checked out by <strong>L. Santos</strong>
      </>
    ),
    time: "8 h ago",
  },
];

const genreCounts = [
  { genre: "FANTASY", count: 186 },
  { genre: "SCIFI", count: 142 },
  { genre: "MYSTERY", count: 128 },
  { genre: "THRILLER", count: 104 },
  { genre: "HORROR", count: 91 },
  { genre: "ROMANCE", count: 88 },
  { genre: "COMEDY", count: 76 },
  { genre: "DRAMA", count: 67 },
  { genre: "ADVENTURE", count: 58 },
  { genre: "OTHERS", count: 52 },
];

export default function Dashboard() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <div className="page-sub">LibExpress · overview</div>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className={`stat-delta ${s.deltaClass}`}>{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-4" style={{ flexWrap: "wrap" }}>
        <div className="panel" style={{ flex: "1 1 340px" }}>
          <div className="panel-header">
            <div className="panel-title">Recent Activity</div>
          </div>
          {recentActivity.map((a, i) => (
            <div key={i} className="activity-item">
              <div className={`activity-dot ${a.dot}`} />
              <div>
                <div className="activity-text">{a.text}</div>
                <div className="activity-time">{a.time}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="panel" style={{ flex: "1 1 340px" }}>
          <div className="panel-header">
            <div className="panel-title">Books by Genre</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {genreCounts.map((g) => (
              <div key={g.genre} className="flex items-center justify-between">
                <span className="genre-tag">{g.genre}</span>
                <span className="mono" style={{ color: "var(--muted)" }}>
                  {g.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
