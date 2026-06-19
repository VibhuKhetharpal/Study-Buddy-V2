import { useState } from "react";
import Dashboard from "./Dashboard.jsx";
import History from "./History.jsx";

function NavTab({ label, active, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: "inherit",
        fontSize: "0.8rem",
        letterSpacing: "0.05em",
        cursor: "pointer",
        padding: "0.5rem 1.1rem",
        borderRadius: 6,
        border: active ? "1px solid #2a5a3a" : "1px solid transparent",
        background: active ? "rgba(126,231,135,0.1)" : hover ? "#161b22" : "transparent",
        color: active ? "#7ee787" : "#8b949e",
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      {label}
    </button>
  );
}

export default function App() {
  const [page, setPage] = useState("dashboard");

  return (
    <div>
      <nav
        style={{
          display: "flex",
          gap: "0.5rem",
          padding: "1.5rem 2rem",
          background: "#0d1117",
          borderBottom: "1px solid #21262d",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <NavTab label="dashboard" active={page === "dashboard"} onClick={() => setPage("dashboard")} />
        <NavTab label="history" active={page === "history"} onClick={() => setPage("history")} />
      </nav>
      {page === "dashboard" ? <Dashboard /> : <History />}
    </div>
  );
}
