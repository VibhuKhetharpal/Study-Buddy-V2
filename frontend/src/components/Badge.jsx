const STYLES = {
  study: { background: "#1a3a2a", color: "#7ee787" },
  distract: { background: "#3a1a1a", color: "#f85149" },
  mixed: { background: "#2a2510", color: "#e3b341" },
  mismatch: { background: "#3a2a10", color: "#e3b341" },
};

export default function Badge({ label, mismatch = false }) {
  const key = mismatch ? "mismatch" : label;
  const style = STYLES[key] || STYLES.mixed;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: "0.65rem",
        ...style,
      }}
    >
      {label}
      {mismatch ? " !" : ""}
    </span>
  );
}

