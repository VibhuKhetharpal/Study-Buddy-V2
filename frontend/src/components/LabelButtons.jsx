import { useState } from "react";

export default function LabelButtons({ activeLabel, onSelect, labels = ["study", "distract"] }) {
  const STYLE = {
    study: { color: "#7ee787", border: "#2a5a3a", bg: "rgba(126,231,135,0.08)", bgActive: "#1a3a2a", bgHover: "rgba(126,231,135,0.16)" },
    distract: { color: "#f85149", border: "#5a2a2a", bg: "rgba(248,81,73,0.08)", bgActive: "#3a1a1a", bgHover: "rgba(248,81,73,0.16)" },
  };

  return (
    <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
      {labels.map((label) => (
        <LabelButton
          key={label}
          label={label}
          active={activeLabel === label}
          style={STYLE[label]}
          onClick={() => onSelect(label)}
        />
      ))}
    </div>
  );
}

function LabelButton({ label, active, style, onClick }) {
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);

  const bg = active ? style.bgActive : hover ? style.bgHover : style.bg;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        padding: "4px 10px",
        borderRadius: 5,
        fontSize: "0.65rem",
        fontFamily: "inherit",
        cursor: "pointer",
        border: `1px solid ${style.border}`,
        background: bg,
        color: style.color,
        transform: pressed ? "scale(0.96)" : "scale(1)",
        transition: "background 0.12s, transform 0.08s",
      }}
    >
      {label}
    </button>
  );
}
