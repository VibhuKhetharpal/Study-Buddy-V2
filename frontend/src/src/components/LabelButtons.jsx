export default function LabelButtons({ activeLabel, onSelect, labels = ["study", "distract"] }) {
  const STYLE = {
    study: { color: "#7ee787", border: "#1a3a2a", bg: "#1a3a2a" },
    distract: { color: "#f85149", border: "#3a1a1a", bg: "#3a1a1a" },
  };

  return (
    <div style={{ display: "flex", gap: "0.3rem", flexShrink: 0 }}>
      {labels.map((label) => {
        const active = activeLabel === label;
        const s = STYLE[label];
        return (
          <button
            key={label}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(label);
            }}
            style={{
              padding: "2px 8px",
              borderRadius: 4,
              fontSize: "0.62rem",
              fontFamily: "inherit",
              cursor: "pointer",
              border: `1px solid ${s.border}`,
              background: active ? s.bg : "transparent",
              color: s.color,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

