import { useState } from "react";
import Badge from "./Badge.jsx";
import LabelButtons from "./LabelButtons.jsx";
import { groupRowsByHour, fmtTime } from "../utils.js";
import { setLabel, deleteLog } from "../api.js";

function HourBlock({ hourGroup, defaultOpen, onChanged }) {
  const [open, setOpen] = useState(defaultOpen);

  const focusColor =
    hourGroup.focusPct >= 75
      ? "#7ee787"
      : hourGroup.focusPct >= 50
      ? "#e3b341"
      : "#f85149";

  return (
    <div
      style={{
        background: "#161b22",
        border: "1px solid #30363d",
        borderRadius: 8,
        marginBottom: "0.75rem",
        overflow: "hidden",
      }}
    >
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 1rem",
          cursor: "pointer",
          userSelect: "none",
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
            {hourGroup.label}
          </span>
          <span style={{ fontSize: "0.7rem", color: "#8b949e" }}>
            {hourGroup.dateLabel}
          </span>
          {hourGroup.isCurrentHour && (
            <span
              style={{
                fontSize: "0.6rem",
                padding: "2px 6px",
                borderRadius: 4,
                background: "rgba(126, 231, 135, 0.15)",
                color: "#7ee787",
                border: "1px solid #2a5a3a",
              }}
            >
              ● CURRENT HOUR
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <span style={{ fontSize: "0.7rem", color: "#8b949e" }}>
            {hourGroup.total} switches
          </span>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 500,
              color: focusColor,
              minWidth: "45px",
              textAlign: "right",
            }}
          >
            {hourGroup.focusPct}% Focus
          </span>
        </div>
      </div>

      {open && (
        <div style={{ borderTop: "1px solid #21262d" }}>
          {hourGroup.entries.map((entry) => {
            const label = entry.user_label || entry.predicted_label;
            const mismatch =
              entry.user_label && entry.user_label !== entry.predicted_label;
            return (
              <div
                key={entry.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.5rem 1rem 0.5rem 2rem",
                  borderBottom: "1px solid #0d1117",
                  fontSize: "0.75rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "#8b949e",
                    minWidth: 70,
                    flexShrink: 0,
                  }}
                >
                  {fmtTime(entry.timestamp)}
                </span>
                <span
                  style={{
                    color: "#7ee787",
                    fontWeight: 500,
                    flexShrink: 0,
                    minWidth: 100,
                  }}
                >
                  {entry.app_name}
                </span>
                <span
                  title={entry.window_title}
                  style={{
                    color: "#c9d1d9",
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    minWidth: 0,
                  }}
                >
                  {entry.window_title}
                </span>

                <Badge label={label} mismatch={mismatch} />

                <LabelButtons
                  activeLabel={entry.user_label}
                  onSelect={(l) => setLabel(entry.id, l).then(() => onChanged())}
                />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete entry "${entry.window_title}"?`)) {
                      deleteLog(entry.id).then(() => onChanged());
                    }
                  }}
                  title="Delete log entry"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#484f58",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                  onMouseEnter={(e) => (e.target.style.color = "#f85149")}
                  onMouseLeave={(e) => (e.target.style.color = "#484f58")}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function HourlyActivity({ rows, onChanged }) {
  if (!rows || rows.length === 0) {
    return (
      <div style={{ color: "#8b949e", fontSize: "0.8rem", padding: "1.5rem 0" }}>
        No logs recorded for this session yet.
      </div>
    );
  }

  const hourGroups = groupRowsByHour(rows);

  return (
    <div>
      {hourGroups.map((g, idx) => (
        <HourBlock
          key={g.key}
          hourGroup={g}
          defaultOpen={idx === 0}
          onChanged={onChanged}
        />
      ))}
    </div>
  );
}
