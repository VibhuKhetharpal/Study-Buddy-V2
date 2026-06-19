import { useState } from "react";

const PRESETS = {
  green: { color: "#7ee787", border: "#2a5a3a", bg: "rgba(126,231,135,0.08)", bgActive: "rgba(126,231,135,0.16)" },
  red: { color: "#f85149", border: "#5a2a2a", bg: "rgba(248,81,73,0.08)", bgActive: "rgba(248,81,73,0.16)" },
  yellow: { color: "#e3b341", border: "#5a4a1a", bg: "rgba(227,179,65,0.08)", bgActive: "rgba(227,179,65,0.16)" },
};

export default function ActionButton({ children, onClick, color = "green", disabled = false, small = false }) {
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);
  const s = PRESETS[color];

  return (
    <button
      onClick={(e) => {
        if (disabled) return;
        e.stopPropagation();
        onClick(e);
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      disabled={disabled}
      style={{
        padding: small ? "4px 10px" : "6px 16px",
        borderRadius: 5,
        fontSize: small ? "0.65rem" : "0.75rem",
        fontFamily: "inherit",
        cursor: disabled ? "default" : "pointer",
        border: `1px solid ${s.border}`,
        background: hover && !disabled ? s.bgActive : s.bg,
        color: s.color,
        opacity: disabled ? 0.5 : 1,
        transform: pressed && !disabled ? "scale(0.96)" : "scale(1)",
        transition: "background 0.12s, transform 0.08s",
      }}
    >
      {children}
    </button>
  );
}
