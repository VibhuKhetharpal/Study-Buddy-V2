export function dominantLabel(entries) {
  if (!entries || entries.length === 0) return "empty";
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

export function parseUTC(iso) {
  if (!iso) return null;
  if (iso.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(iso)) {
    return new Date(iso);
  }
  return new Date(iso + "Z");
}

export function fmtTime(iso) {
  const d = parseUTC(iso);
  if (!d || isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function fmtDateTime(iso) {
  const d = parseUTC(iso);
  if (!d || isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export function duration(start, end) {
  const dStart = parseUTC(start);
  const dEnd = parseUTC(end);
  if (!dStart || !dEnd || isNaN(dStart.getTime()) || isNaN(dEnd.getTime())) return "—";
  const diff = Math.max(0, Math.floor((dEnd - dStart) / 1000));
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function buildHeatbar(rows, slices = 30) {
  if (!rows || rows.length === 0) return [];
  const validRows = rows.filter((r) => r.timestamp && !isNaN(parseUTC(r.timestamp)?.getTime()));
  if (validRows.length === 0) return [];

  const sorted = [...validRows].sort(
    (a, b) => parseUTC(a.timestamp) - parseUTC(b.timestamp)
  );
  const start = parseUTC(sorted[0].timestamp).getTime();
  const end = parseUTC(sorted[sorted.length - 1].timestamp).getTime();
  const span = Math.max(end - start, 1);

  const buckets = Array.from({ length: slices }, () => []);
  sorted.forEach((row) => {
    const t = parseUTC(row.timestamp).getTime();
    const rawIdx = Math.floor(((t - start) / span) * slices);
    const idx = Math.max(0, Math.min(slices - 1, isNaN(rawIdx) ? 0 : rawIdx));
    buckets[idx].push(row);
  });

  return buckets.map((entries) =>
    entries.length === 0 ? "empty" : dominantLabel(entries)
  );
}