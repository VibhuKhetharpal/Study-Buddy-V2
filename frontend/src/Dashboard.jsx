import { useEffect, useState, useCallback } from "react";
import Heatbar from "./components/Heatbar.jsx";
import HourlyActivity from "./components/HourlyActivity.jsx";
import LogTree from "./components/LogTree.jsx";
import ActionButton from "./components/ActionButton.jsx";
import { getLatestSession, getSessionLogs, getSummary, stopSession } from "./api.js";
import { buildHeatbar, fmtTime, duration } from "./utils.js";

function StatCard({ label, value, color, subtitle }) {
  return (
    <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 8, padding: "1rem" }}>
      <div style={{ fontSize: "0.65rem", color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.75rem", fontWeight: 500, color, marginBottom: subtitle ? "0.2rem" : 0 }}>
        {value}
      </div>
      {subtitle && <div style={{ fontSize: "0.65rem", color: "#8b949e" }}>{subtitle}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [sessionId, setSessionId] = useState(null);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [showHeatbar, setShowHeatbar] = useState(true);
  const [activityView, setActivityView] = useState("hourly"); // "hourly" or "tree"

  const refreshLogs = useCallback((sid) => {
    if (!sid) return;
    getSessionLogs(sid)
      .then((data) => {
        if (Array.isArray(data)) setRows(data);
      })
      .catch(() => {});
  }, []);

  const loadLatest = useCallback(() => {
    getLatestSession()
      .then((d) => {
        if (d && d.session_id) {
          setSessionId(d.session_id);
          refreshLogs(d.session_id);
        }
      })
      .catch(() => {});
  }, [refreshLogs]);

  useEffect(() => {
    loadLatest();
    const interval = setInterval(loadLatest, 5000);
    return () => clearInterval(interval);
  }, [loadLatest]);

  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(() => refreshLogs(sessionId), 3000);
    return () => clearInterval(interval);
  }, [sessionId, refreshLogs]);

  const handleStop = () => {
    if (!sessionId) return;
    if (!window.confirm("Are you sure you want to end this session?")) return;
    setStopping(true);
    stopSession(sessionId)
      .then(() => {
        setStatusMsg("Session ended.");
        loadLatest();
      })
      .catch(() => setStatusMsg("Failed to stop session."))
      .finally(() => setStopping(false));
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

  // Compute session-specific metrics strictly from this session's rows
  const totalLogs = rows.length;
  const studyCount = rows.filter((r) => (r.user_label || r.predicted_label) === "study").length;
  const distractCount = rows.filter((r) => (r.user_label || r.predicted_label) === "distract").length;
  const focusPct = totalLogs > 0 ? Math.round((studyCount / totalLogs) * 100) : 0;
  const focusColor = focusPct >= 75 ? "#7ee787" : focusPct >= 50 ? "#e3b341" : "#f85149";

  const sessionDuration = rows.length > 1 ? duration(rows[0].timestamp, rows[rows.length - 1].timestamp) : "—";
  const lastEntry = rows.length > 0 ? rows[rows.length - 1] : null;
  const lastLabel = lastEntry ? lastEntry.user_label || lastEntry.predicted_label : null;

  const heatSlices = buildHeatbar(rows);

  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace", background: "#0d1117", color: "#e6edf3", padding: "2rem", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.2rem", fontWeight: 500, color: "#7ee787", marginBottom: "0.25rem", letterSpacing: "0.05em" }}>
            study_buddy / live_session
          </h1>
          <span style={{ fontSize: "0.75rem", color: "#8b949e" }}>
            {sessionId ? `Session #${sessionId}` : "No active session"}
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <ActionButton onClick={handleSummary} disabled={!sessionId || totalLogs === 0 || summaryLoading} color="yellow">
            {summaryLoading ? "summarizing..." : "summarize session"}
          </ActionButton>
          <ActionButton onClick={handleStop} disabled={!sessionId || stopping} color="red">
            {stopping ? "stopping..." : "end session"}
          </ActionButton>
        </div>
      </div>

      {statusMsg && (
        <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 6, padding: "0.5rem 1rem", marginBottom: "1rem", fontSize: "0.75rem", color: "#e3b341" }}>
          {statusMsg}
        </div>
      )}

      {/* Active task banner */}
      <div
        style={{
          background: "#161b22",
          border: "1px solid #30363d",
          borderRadius: 8,
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ minWidth: 0, flex: 1, marginRight: "1rem" }}>
          <div style={{ fontSize: "0.65rem", color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>
            Current Workflow
          </div>
          {lastEntry ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", overflow: "hidden" }}>
              <span style={{ color: "#7ee787", fontWeight: 500 }}>{lastEntry.app_name}</span>
              <span style={{ color: "#484f58" }}>—</span>
              <span style={{ color: "#e6edf3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {lastEntry.window_title}
              </span>
            </div>
          ) : (
            <span style={{ color: "#8b949e", fontSize: "0.8rem" }}>
              Waiting for activity. Run &apos;python agent/mac_tracker.py&apos; or &apos;windows_tracker.py&apos; to start.
            </span>
          )}
        </div>

        {lastLabel && (
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 5,
              fontSize: "0.7rem",
              fontWeight: 500,
              background: lastLabel === "study" ? "#1a3a2a" : "#3a1a1a",
              color: lastLabel === "study" ? "#7ee787" : "#f85149",
              flexShrink: 0,
            }}
          >
            {lastLabel === "study" ? "● FOCUSED" : "● DISTRACTED"}
          </span>
        )}
      </div>

      {/* Current session metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <StatCard label="Session Focus" value={`${focusPct}%`} color={focusColor} subtitle="Focus percentage" />
        <StatCard label="Duration" value={sessionDuration} color="#e6edf3" subtitle="Elapsed in session" />
        <StatCard label="Study Switches" value={studyCount} color="#7ee787" subtitle="Focused tasks" />
        <StatCard label="Distract Switches" value={distractCount} color="#f85149" subtitle="Distracted tasks" />
        <StatCard label="Total Switches" value={totalLogs} color="#8b949e" subtitle="Window transitions" />
      </div>

      {/* Heatbar Timeline */}
      {heatSlices.length > 0 && showHeatbar && (
        <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 8, padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
            <div style={{ fontSize: "0.65rem", color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Continuous Session Timeline (Green = Study, Red = Distraction)
            </div>
            <button
              onClick={() => setShowHeatbar(false)}
              style={{ background: "transparent", border: "none", color: "#484f58", fontSize: "0.65rem", cursor: "pointer" }}
              title="Hide timeline"
            >
              hide timeline
            </button>
          </div>
          <Heatbar slices={heatSlices} height={20} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.4rem", fontSize: "0.65rem", color: "#8b949e" }}>
            <span>{fmtTime(rows[0]?.timestamp)}</span>
            <span>{fmtTime(rows[rows.length - 1]?.timestamp)}</span>
          </div>
        </div>
      )}

      {summary && (
        <div
          style={{
            background: "#161b22",
            border: "1px solid #30363d",
            borderRadius: 8,
            padding: "1rem 1.25rem",
            marginBottom: "1.5rem",
            fontSize: "0.8rem",
            color: "#c9d1d9",
            lineHeight: 1.6,
          }}
        >
          <div style={{ fontSize: "0.7rem", color: "#e3b341", fontWeight: 500, marginBottom: "0.4rem", textTransform: "uppercase" }}>
            AI Session Recap
          </div>
          {summary}
        </div>
      )}

      {/* Activity Breakdown Header with View Switcher */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div style={{ fontSize: "0.75rem", color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Activity Timeline ({rows.length} total events)
        </div>

        <div style={{ display: "flex", gap: "0.3rem", background: "#161b22", padding: "3px", borderRadius: 6, border: "1px solid #30363d" }}>
          <button
            onClick={() => setActivityView("hourly")}
            style={{
              padding: "3px 10px",
              borderRadius: 4,
              fontSize: "0.65rem",
              fontFamily: "inherit",
              border: "none",
              cursor: "pointer",
              background: activityView === "hourly" ? "#21262d" : "transparent",
              color: activityView === "hourly" ? "#7ee787" : "#8b949e",
            }}
          >
            hourly breakdown
          </button>
          <button
            onClick={() => setActivityView("tree")}
            style={{
              padding: "3px 10px",
              borderRadius: 4,
              fontSize: "0.65rem",
              fontFamily: "inherit",
              border: "none",
              cursor: "pointer",
              background: activityView === "tree" ? "#21262d" : "transparent",
              color: activityView === "tree" ? "#7ee787" : "#8b949e",
            }}
          >
            grouped by app
          </button>
        </div>
      </div>

      {activityView === "hourly" ? (
        <HourlyActivity rows={rows} onChanged={() => refreshLogs(sessionId)} />
      ) : (
        <LogTree sessionId={sessionId} rows={rows} onChanged={() => refreshLogs(sessionId)} />
      )}
    </div>
  );
}
