import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Books from "./pages/Books";
import Loans from "./pages/Loans";
import Members from "./pages/Members";
import Fines from "./pages/Fines";

type Page = "dashboard" | "books" | "loans" | "members" | "fines";

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");

  const onNavigate = (id: string) => {
    setPage(id as Page);
  };

  const pages: Record<Page, React.ReactNode> = {
    dashboard: <Dashboard />,
    books: <Books />,
    loans: <Loans />,
    members: <Members />,
    fines: <Fines />,
  };

  return (
    <div className="app">
      <Sidebar active={page} onNavigate={onNavigate} />
      <main className="main">{pages[page]}</main>
    </div>
  );
}
