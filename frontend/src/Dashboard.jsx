import { useEffect, useState, useCallback } from "react";
import Heatbar from "./components/Heatbar.jsx";
import LogTree from "./components/LogTree.jsx";
import ActionButton from "./components/ActionButton.jsx";
import { getStats, getLatestSession, getSessionLogs, getSummary, retrainModel } from "./api.js";
import { buildHeatbar, fmtTime } from "./utils.js";

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 8, padding: "1rem" }}>
      <div style={{ fontSize: "0.7rem", color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.8rem", fontWeight: 500, color }}>{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [retrainMsg, setRetrainMsg] = useState("");

  const refreshLogs = useCallback((sid) => {
    if (!sid) return;
    getSessionLogs(sid)
      .then((data) => {
        if (Array.isArray(data)) setRows(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    getStats()
      .then((s) => s && !s.error && setStats(s))
      .catch(() => {});

    getLatestSession()
      .then((d) => {
        if (d && d.session_id) {
          setSessionId(d.session_id);
          refreshLogs(d.session_id);
        }
      })
      .catch(() => {});

    const interval = setInterval(() => {
      getStats()
        .then((s) => s && !s.error && setStats(s))
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshLogs]);

  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(() => refreshLogs(sessionId), 5000);
    return () => clearInterval(interval);
  }, [sessionId, refreshLogs]);

  const handleRetrain = () => {
    setRetraining(true);
    setRetrainMsg("retraining...");
    retrainModel()
      .then((d) => {
        if (d && d.error) {
          setRetrainMsg(`failed: ${d.error}`);
        } else {
          setRetrainMsg(`done — ${d.user_labels_used ?? 0} user labels used`);
        }
      })
      .catch(() => setRetrainMsg("failed to connect to backend"))
      .finally(() => setRetraining(false));
  };

  const handleSummary = () => {
    if (!sessionId) return;
    setSummaryLoading(true);
    setSummary(null);
    getSummary(sessionId)
      .then((d) => setSummary(d.summary || d.error || "No summary available"))
      .catch(() => setSummary("Failed to connect to backend for summary"))
      .finally(() => setSummaryLoading(false));
  };

  const heatSlices = buildHeatbar(rows);

  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace", background: "#0d1117", color: "#e6edf3", padding: "2rem", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "1.2rem", fontWeight: 500, color: "#7ee787", marginBottom: "1.5rem", letterSpacing: "0.05em" }}>
        study_buddy / dashboard
      </h1>

      {heatSlices.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "0.65rem", color: "#484f58", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            session timeline
          </div>
          <Heatbar slices={heatSlices} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.3rem", fontSize: "0.65rem", color: "#484f58" }}>
            <span>{fmtTime(rows[0]?.timestamp)}</span>
            <span>{fmtTime(rows[rows.length - 1]?.timestamp)}</span>
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <ActionButton onClick={handleRetrain} disabled={retraining} color="green">
          retrain model
        </ActionButton>
        <ActionButton onClick={handleSummary} disabled={!sessionId || summaryLoading} color="yellow">
          {summaryLoading ? "summarizing..." : "summarize session"}
        </ActionButton>
        <span style={{ fontSize: "0.7rem", color: "#8b949e" }}>{retrainMsg}</span>
      </div>

      {summary && (
        <div
          style={{
            background: "#161b22",
            border: "1px solid #30363d",
            borderRadius: 8,
            padding: "1rem",
            marginBottom: "1.5rem",
            fontSize: "0.8rem",
            color: "#c9d1d9",
            lineHeight: 1.6,
          }}
        >
          {summary}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <StatCard label="Total Logs" value={stats?.total ?? "—"} color="#8b949e" />
        <StatCard label="Study" value={stats?.study ?? "—"} color="#7ee787" />
        <StatCard label="Distract" value={stats?.distract ?? "—"} color="#f85149" />
        <StatCard label="Corrected" value={stats?.corrected ?? "—"} color="#e3b341" />
        <StatCard label="Model Mistakes" value={stats?.mistakes ?? "—"} color="#8b949e" />
      </div>

      <div style={{ fontSize: "0.7rem", color: "#484f58", marginBottom: "1rem" }}>
        {sessionId ? `showing session #${sessionId}` : "no sessions yet"}
      </div>

      <LogTree sessionId={sessionId} rows={rows} onChanged={() => refreshLogs(sessionId)} />
    </div>
  );
}
