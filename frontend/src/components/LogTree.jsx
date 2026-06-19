import { useState } from "react";
import Badge from "./Badge.jsx";
import LabelButtons from "./LabelButtons.jsx";
import ActionButton from "./ActionButton.jsx";
import { groupLogs, dominantLabel, fmtTime } from "../utils.js";
import { setLabel, setBulkLabel } from "../api.js";

function WindowRow({ sessionId, winData, onChanged }) {
  const [open, setOpen] = useState(false);
  const dominant = dominantLabel(winData.entries);

  const allLabel = (label) => {
    setBulkLabel(sessionId, winData.title, label).then(() => onChanged());
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.55rem 1rem 0.55rem 2rem",
          borderBottom: "1px solid #0d1117",
        }}
      >
        <div
          onClick={() => setOpen(!open)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            flex: 1,
            cursor: "pointer",
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontSize: "0.55rem",
              color: "#484f58",
              display: "inline-block",
              transform: open ? "rotate(90deg)" : "none",
              transition: "transform 0.15s",
            }}
          >
            ▶
          </span>
          <span
            title={winData.title}
            style={{
              fontSize: "0.75rem",
              color: "#8b949e",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {winData.title}
          </span>
          <span style={{ fontSize: "0.7rem", color: "#484f58", minWidth: 28, textAlign: "right" }}>
            {winData.entries.length}x
          </span>
          <Badge label={dominant} />
        </div>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <ActionButton onClick={() => allLabel("study")} color="green" small>
            all study
          </ActionButton>
          <ActionButton onClick={() => allLabel("distract")} color="red" small>
            all distract
          </ActionButton>
        </div>
      </div>

      {open && (
        <div style={{ background: "#0d1117", borderTop: "1px solid #161b22" }}>
          {winData.entries.map((entry) => {
            const label = entry.user_label || entry.predicted_label;
            const mismatch = entry.user_label && entry.user_label !== entry.predicted_label;
            return (
              <div
                key={entry.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.4rem 1rem 0.4rem 3.5rem",
                  borderBottom: "1px solid #161b22",
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#30363d", flexShrink: 0 }} />
                <span style={{ fontSize: "0.7rem", color: "#484f58", minWidth: 75 }}>
                  {fmtTime(entry.timestamp)}
                </span>
                <Badge label={label} mismatch={mismatch} />
                <LabelButtons
                  activeLabel={entry.user_label}
                  onSelect={(l) => setLabel(entry.id, l).then(() => onChanged())}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AppGroup({ sessionId, appData, onChanged }) {
  const [open, setOpen] = useState(false);
  const allEntries = appData.windows.flatMap((w) => w.entries);
  const dominant = dominantLabel(allEntries);

  return (
    <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 8, marginBottom: "0.5rem", overflow: "hidden" }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.65rem 1rem", cursor: "pointer" }}
      >
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
        <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "#e6edf3", flex: 1 }}>{appData.name}</span>
        <span style={{ fontSize: "0.7rem", color: "#8b949e" }}>{allEntries.length}x</span>
        <Badge label={dominant} />
      </div>
      {open && (
        <div style={{ borderTop: "1px solid #21262d" }}>
          {appData.windows.map((winData) => (
            <WindowRow
              key={winData.title}
              sessionId={sessionId}
              winData={winData}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LogTree({ sessionId, rows, onChanged }) {
  if (!rows || rows.length === 0) {
    return <div style={{ color: "#484f58", fontSize: "0.8rem", padding: "1rem" }}>no logs for this session yet</div>;
  }
  const grouped = groupLogs(rows);
  return (
    <div>
      {grouped.map((appData) => (
        <AppGroup key={appData.name} sessionId={sessionId} appData={appData} onChanged={onChanged} />
      ))}
    </div>
  );
}
