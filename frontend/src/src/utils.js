export function dominantLabel(entries) {
  const labels = entries.map((e) => e.user_label || e.predicted_label);
  const study = labels.filter((l) => l === "study").length;
  const distract = labels.filter((l) => l === "distract").length;
  if (study > 0 && distract > 0) return "mixed";
  return study > 0 ? "study" : "distract";
}

export function groupLogs(rows) {
  const appMap = {};
  rows.forEach((row) => {
    if (!appMap[row.app_name]) {
      appMap[row.app_name] = { name: row.app_name, windows: {} };
    }
    if (!appMap[row.app_name].windows[row.window_title]) {
      appMap[row.app_name].windows[row.window_title] = {
        title: row.window_title,
        entries: [],
      };
    }
    appMap[row.app_name].windows[row.window_title].entries.push(row);
  });
  return Object.values(appMap).map((app) => ({
    ...app,
    windows: Object.values(app.windows),
  }));
}

export function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export function duration(start, end) {
  if (!start || !end) return "—";
  const diff = Math.floor((new Date(end) - new Date(start)) / 1000);
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// builds the heatbar: buckets all entries into N equal time-slices across
// the session and returns the dominant label per slice, used by Heatbar.jsx
export function buildHeatbar(rows, slices = 30) {
  if (!rows || rows.length === 0) return [];
  const sorted = [...rows].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );
  const start = new Date(sorted[0].timestamp).getTime();
  const end = new Date(sorted[sorted.length - 1].timestamp).getTime();
  const span = Math.max(end - start, 1);

  const buckets = Array.from({ length: slices }, () => []);
  sorted.forEach((row) => {
    const t = new Date(row.timestamp).getTime();
    const idx = Math.min(
      slices - 1,
      Math.floor(((t - start) / span) * slices)
    );
    buckets[idx].push(row);
  });

  return buckets.map((entries) =>
    entries.length === 0 ? "empty" : dominantLabel(entries)
  );
}

