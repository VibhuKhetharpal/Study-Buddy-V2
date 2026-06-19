const COLORS = {
  study: "#7ee787",
  distract: "#f85149",
  mixed: "#e3b341",
  empty: "#21262d",
};

export default function Heatbar({ slices, height = 28 }) {
  if (!slices || slices.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: 2,
        height,
        width: "100%",
      }}
    >
      {slices.map((label, i) => (
        <div
          key={i}
          title={label}
          style={{
            flex: 1,
            background: COLORS[label],
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}

