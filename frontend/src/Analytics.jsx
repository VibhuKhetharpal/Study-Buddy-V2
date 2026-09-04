import { useEffect, useState } from "react";
import ActionButton from "./components/ActionButton.jsx";
import { getStats, getSessions, retrainModel } from "./api.js";

function StatCard({ label, value, color, subtitle }) {
  return (
    <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 8, padding: "1.25rem" }}>
      <div style={{ fontSize: "0.7rem", color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
        {label}
      </div>
      <div style={{ fontSize: "2rem", fontWeight: 500, color, marginBottom: subtitle ? "0.25rem" : 0 }}>
        {value}
      </div>
      {subtitle && <div style={{ fontSize: "0.7rem", color: "#8b949e" }}>{subtitle}</div>}
    </div>
  );
}

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [retraining, setRetraining] = useState(false);
  const [retrainMsg, setRetrainMsg] = useState("");

  useEffect(() => {
    getStats().then((d) => d && !d.error && setStats(d)).catch(() => {});
    getSessions().then((d) => Array.isArray(d) && setSessions(d)).catch(() => {});
  }, []);

  const handleRetrain = () => {
    setRetraining(true);
    setRetrainMsg("Retraining in progress...");
    retrainModel()
      .then((d) => {
        if (d && d.error) {
          setRetrainMsg(`Failed: ${d.error}`);
        } else {
          setRetrainMsg(`Retrained successfully (${d.user_labels_used ?? 0} user corrections included)`);
          getStats().then((s) => s && !s.error && setStats(s)).catch(() => {});
        }
      })
      .catch(() => setRetrainMsg("Failed to connect to backend"))
      .finally(() => setRetraining(false));
  };

  const totalLogs = stats?.total || 0;
  const studyLogs = stats?.study || 0;
  const distractLogs = stats?.distract || 0;
  const overallFocus = totalLogs > 0 ? Math.round((studyLogs / totalLogs) * 100) : 0;
  const totalSessions = sessions.length;

  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace", background: "#0d1117", color: "#e6edf3", padding: "2rem", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.2rem", fontWeight: 500, color: "#7ee787", marginBottom: "0.4rem", letterSpacing: "0.05em" }}>
            study_buddy / analytics
          </h1>
          <p style={{ fontSize: "0.75rem", color: "#8b949e", margin: 0 }}>
            All-time historical telemetry and model performance metrics
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <StatCard label="Overall Focus" value={`${overallFocus}%`} color="#7ee787" subtitle={`${studyLogs} study vs ${distractLogs} distract`} />
        <StatCard label="Total Sessions" value={totalSessions} color="#e6edf3" subtitle="Completed & ongoing" />
        <StatCard label="Total Activities" value={totalLogs} color="#8b949e" subtitle="Logged across all sessions" />
        <StatCard label="User Corrections" value={stats?.corrected ?? 0} color="#e3b341" subtitle="Human ground truth entries" />
        <StatCard label="Mistakes Caught" value={stats?.mistakes ?? 0} color="#f85149" subtitle="Predictions corrected by you" />
      </div>

      <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 8, padding: "1.5rem", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "0.9rem", fontWeight: 500, color: "#e6edf3", marginBottom: "0.5rem" }}>
          Active Learning & Model Retraining
        </h2>
        <p style={{ fontSize: "0.75rem", color: "#8b949e", lineHeight: 1.5, marginBottom: "1.25rem" }}>
          Every correction you make in the dashboard is saved as your personal ground truth. Triggering retraining combines the original seed data with all your human corrections, recalculates vector embeddings, and fits a freshly optimized model.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <ActionButton onClick={handleRetrain} disabled={retraining} color="green">
            {retraining ? "retraining..." : "retrain model now"}
          </ActionButton>
          <span style={{ fontSize: "0.75rem", color: retrainMsg.includes("Failed") ? "#f85149" : "#7ee787" }}>
            {retrainMsg}
          </span>
        </div>
      </div>

      {stats?.recent && stats.recent.length > 0 && (
        <div>
          <div style={{ fontSize: "0.7rem", color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
            Recently Classified Windows
          </div>
          <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 8, overflow: "hidden" }}>
            {stats.recent.slice(0, 10).map((r, i) => {
              const label = r.user_label || r.predicted_label;
              const isStudy = label === "study";
              return (
                <div
                  key={r.id || i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.6rem 1rem",
                    borderBottom: i < 9 ? "1px solid #21262d" : "none",
                    fontSize: "0.75rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0, flex: 1 }}>
                    <span style={{ color: "#7ee787", fontWeight: 500 }}>{r.app_name}</span>
                    <span style={{ color: "#8b949e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.window_title}
                    </span>
                  </div>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: "0.65rem",
                      background: isStudy ? "#1a3a2a" : "#3a1a1a",
                      color: isStudy ? "#7ee787" : "#f85149",
                      marginLeft: "1rem",
                      flexShrink: 0,
                    }}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
