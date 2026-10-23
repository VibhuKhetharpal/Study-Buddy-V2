import { useState } from "react";

const COLORS = {
  study: "#7ee787",
  distract: "#f85149",
  mixed: "#e3b341",
  empty: "#21262d",
};

export default function Heatbar({ slices, height = 24 }) {
  const [hoveredSlice, setHoveredSlice] = useState(null);

  if (!slices || slices.length === 0) return null;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/* Live hover preview banner */}
      <div
        style={{
          minHeight: "24px",
          marginBottom: "6px",
          fontSize: "0.72rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          overflow: "hidden",
        }}
      >
        {hoveredSlice ? (
          <>
            <span
              style={{
                padding: "2px 6px",
                borderRadius: 4,
                fontSize: "0.6rem",
                fontWeight: 600,
                background: hoveredSlice.label === "study" ? "#1a3a2a" : "#3a1a1a",
                color: hoveredSlice.label === "study" ? "#7ee787" : "#f85149",
                flexShrink: 0,
              }}
            >
              {hoveredSlice.label === "study" ? "STUDY" : "DISTRACT"}
            </span>
            <span style={{ color: "#8b949e", flexShrink: 0 }}>
              {hoveredSlice.timeLabel}
            </span>
            <span style={{ color: "#484f58", flexShrink: 0 }}>·</span>
            <span style={{ color: "#7ee787", fontWeight: 500, flexShrink: 0 }}>
              {hoveredSlice.appName}
            </span>
            <span
              style={{
                color: "#c9d1d9",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                minWidth: 0,
              }}
            >
              {hoveredSlice.windowTitle}
            </span>
          </>
        ) : (
          <span style={{ color: "#484f58", fontSize: "0.68rem" }}>
            Hover over any block to inspect exact time, task, and distraction details
          </span>
        )}
      </div>

      {/* Timeline Bar with high-resolution blocks */}
      <div
        style={{
          display: "flex",
          gap: 1.5,
          height,
          width: "100%",
          background: "#0d1117",
          borderRadius: 4,
          padding: 2,
          border: "1px solid #21262d",
        }}
      >
        {slices.map((slice, i) => {
          const isObj = typeof slice === "object";
          const label = isObj ? slice.label : slice;
          const isHovered = hoveredSlice?.idx === i;

          return (
            <div
              key={i}
              onMouseEnter={() => setHoveredSlice(isObj ? slice : null)}
              onMouseLeave={() => setHoveredSlice(null)}
              style={{
                flex: 1,
                background: COLORS[label] || COLORS.study,
                borderRadius: 1.5,
                opacity: hoveredSlice ? (isHovered ? 1 : 0.45) : 0.9,
                transform: isHovered ? "scaleY(1.3)" : "none",
                transition: "transform 0.08s, opacity 0.08s",
                cursor: "crosshair",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
