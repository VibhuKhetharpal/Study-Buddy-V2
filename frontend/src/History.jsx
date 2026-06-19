import { useEffect, useState } from "react";
import LogTree from "./components/LogTree.jsx";
import { getSessions, getSessionLogs } from "./api.js";
import { fmtDateTime, duration } from "./utils.js";

function SessionCard({ session }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(null);

  const total = (session.study || 0) + (session.distract || 0);
  const focusPct = total > 0 ? Math.round((session.study / total) * 100) : 0;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && rows === null) {
      getSessionLogs(session.id).then(setRows);
    }
  };

  return (
    <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 8, marginBottom: "0.5rem", overflow: "hidden" }}>
      <div
        onClick={toggle}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", cursor: "pointer" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span
            style={{
              fontSize: "0.6rem",
              color: "#484f58",
              display: "inline-block",
              transform: open ? "rotate(90deg)" : "none",
              transition: "transform 0.15s",
            }}
          >
            ▶
          </span>
          <span style={{ fontSize: "0.8rem", fontWeight: 500 }}>session #{session.id}</span>
        </div>
        <span style={{ fontSize: "0.7rem", color: "#484f58" }}>
          {fmtDateTime(session.start_time)} → {session.end_time ? fmtDateTime(session.end_time) : "ongoing"} (
          {duration(session.start_time, session.end_time)})
        </span>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <Stat label="Total" value={total} color="#8b949e" />
          <Stat label="Study" value={session.study || 0} color="#7ee787" />
          <Stat label="Distract" value={session.distract || 0} color="#f85149" />
          <Stat label="Focus" value={`${focusPct}%`} color="#e3b341" />
        </div>
      </div>

      <div style={{ height: 3, background: "#21262d" }}>
        <div style={{ height: "100%", background: "#7ee787", width: `${focusPct}%` }} />
      </div>

      {open && (
        <div style={{ borderTop: "1px solid #21262d", padding: "0.5rem" }}>
          {rows === null ? (
            <div style={{ color: "#484f58", fontSize: "0.75rem", padding: "1rem 1.25rem" }}>loading...</div>
          ) : (
            <LogTree sessionId={session.id} rows={rows} onChanged={() => getSessionLogs(session.id).then(setRows)} />
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: "0.65rem", color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ fontSize: "1.1rem", fontWeight: 500, color }}>{value}</div>
    </div>
  );
}

export default function History() {
  const [sessions, setSessions] = useState(null);

  useEffect(() => {
    getSessions().then(setSessions);
  }, []);

  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace", background: "#0d1117", color: "#e6edf3", padding: "2rem", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "1.2rem", fontWeight: 500, color: "#7ee787", marginBottom: "2rem", letterSpacing: "0.05em" }}>
        study_buddy / history
      </h1>
      {sessions === null ? (
        <div style={{ color: "#484f58", fontSize: "0.8rem" }}>loading...</div>
      ) : sessions.length === 0 ? (
        <div style={{ color: "#484f58", fontSize: "0.8rem", padding: "2rem" }}>no sessions yet</div>
      ) : (
        sessions.map((s) => <SessionCard key={s.id} session={s} />)
      )}
    </div>
  );
}

