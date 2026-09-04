import { useEffect, useState } from "react";
import LogTree from "./components/LogTree.jsx";
import ActionButton from "./components/ActionButton.jsx";
import { getSessions, getSessionLogs, getSummary, deleteSession } from "./api.js";
import { fmtDateTime, duration } from "./utils.js";

function SessionCard({ session, onDelete }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const total = (session.study || 0) + (session.distract || 0);
  const focusPct = total > 0 ? Math.round((session.study / total) * 100) : 0;
  const focusColor = focusPct >= 75 ? "#7ee787" : focusPct >= 50 ? "#e3b341" : "#f85149";

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && rows === null) {
      getSessionLogs(session.id)
        .then((data) => setRows(Array.isArray(data) ? data : []))
        .catch(() => setRows([]));
    }
  };

  const handleSummarize = (e) => {
    e.stopPropagation();
    if (summary) {
      setSummary(null);
      return;
    }
    setSummaryLoading(true);
    getSummary(session.id)
      .then((d) => setSummary(d.summary || d.error || "No summary available"))
      .catch(() => setSummary("Failed to fetch summary"))
      .finally(() => setSummaryLoading(false));
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Delete Session #${session.id} and all its logs?`)) {
      deleteSession(session.id).then(() => onDelete(session.id));
    }
  };

  return (
    <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 8, marginBottom: "1rem", overflow: "hidden" }}>
      <div
        onClick={toggle}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 1.25rem",
          cursor: "pointer",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
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
          <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "#e6edf3" }}>
            session #{session.id}
          </span>
          <span style={{ fontSize: "0.75rem", color: "#8b949e" }}>
            {fmtDateTime(session.start_time)} → {session.end_time ? fmtDateTime(session.end_time) : "ongoing"} (
            {duration(session.start_time, session.end_time)})
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
            <Stat label="Study" value={session.study || 0} color="#7ee787" />
            <Stat label="Distract" value={session.distract || 0} color="#f85149" />
            <Stat label="Focus" value={`${focusPct}%`} color={focusColor} />
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <ActionButton onClick={handleSummarize} disabled={summaryLoading} color="yellow" small>
              {summaryLoading ? "..." : summary ? "hide recap" : "recap"}
            </ActionButton>
            <ActionButton onClick={handleDelete} color="red" small>
              delete
            </ActionButton>
          </div>
        </div>
      </div>

      <div style={{ height: 3, background: "#21262d" }}>
        <div style={{ height: "100%", background: focusColor, width: `${focusPct}%` }} />
      </div>

      {summary && (
        <div style={{ background: "#0d1117", padding: "1rem 1.25rem", borderTop: "1px solid #21262d", fontSize: "0.8rem", color: "#c9d1d9", lineHeight: 1.5 }}>
          <div style={{ fontSize: "0.65rem", color: "#e3b341", textTransform: "uppercase", marginBottom: "0.3rem" }}>
            Session #{session.id} AI Summary
          </div>
          {summary}
        </div>
      )}

      {open && (
        <div style={{ borderTop: "1px solid #21262d", padding: "0.5rem" }}>
          {rows === null ? (
            <div style={{ color: "#484f58", fontSize: "0.75rem", padding: "1rem 1.25rem" }}>loading...</div>
          ) : (
            <LogTree
              sessionId={session.id}
              rows={rows}
              onChanged={() =>
                getSessionLogs(session.id)
                  .then((data) => setRows(Array.isArray(data) ? data : []))
                  .catch(() => setRows([]))
              }
            />
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: "0.6rem", color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ fontSize: "0.95rem", fontWeight: 500, color }}>{value}</div>
    </div>
  );
}

export default function History() {
  const [sessions, setSessions] = useState(null);

  const loadSessions = () => {
    getSessions()
      .then((data) => setSessions(Array.isArray(data) ? data : []))
      .catch(() => setSessions([]));
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleDeleteSession = (deletedId) => {
    setSessions((prev) => (prev ? prev.filter((s) => s.id !== deletedId) : []));
  };

  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace", background: "#0d1117", color: "#e6edf3", padding: "2rem", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.2rem", fontWeight: 500, color: "#7ee787", letterSpacing: "0.05em", margin: 0 }}>
          study_buddy / history
        </h1>
        <span style={{ fontSize: "0.75rem", color: "#8b949e" }}>
          {sessions ? `${sessions.length} sessions logged` : ""}
        </span>
      </div>

      {sessions === null ? (
        <div style={{ color: "#484f58", fontSize: "0.8rem" }}>loading...</div>
      ) : sessions.length === 0 ? (
        <div style={{ color: "#484f58", fontSize: "0.8rem", padding: "2rem 0" }}>no sessions yet</div>
      ) : (
        sessions.map((s) => (
          <SessionCard key={s.id} session={s} onDelete={handleDeleteSession} />
        ))
      )}
    </div>
  );
}
