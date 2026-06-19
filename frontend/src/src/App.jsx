import { useState } from "react";
import Dashboard from "./Dashboard.jsx";
import History from "./History.jsx";

export default function App() {
  const [page, setPage] = useState("dashboard");

  return (
    <div>
      <nav style={{ display: "flex", gap: "1.5rem", padding: "2rem 2rem 0", background: "#0d1117", fontFamily: "'JetBrains Mono', monospace" }}>
        <a
          onClick={() => setPage("dashboard")}
          style={{
            fontSize: "0.8rem",
            letterSpacing: "0.05em",
            cursor: "pointer",
            color: page === "dashboard" ? "#7ee787" : "#8b949e",
          }}
        >
          dashboard
        </a>
        <a
          onClick={() => setPage("history")}
          style={{
            fontSize: "0.8rem",
            letterSpacing: "0.05em",
            cursor: "pointer",
            color: page === "history" ? "#7ee787" : "#8b949e",
          }}
        >
          history
        </a>
      </nav>
      {page === "dashboard" ? <Dashboard /> : <History />}
    </div>
  );
}

