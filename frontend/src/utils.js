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

export function groupRowsByHour(rows) {
  if (!rows || rows.length === 0) return [];
  const map = {};

  rows.forEach((row) => {
    const d = parseUTC(row.timestamp);
    if (!d || isNaN(d.getTime())) return;

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hour = d.getHours();
    const key = `${year}-${month}-${day}-${hour}`;

    if (!map[key]) {
      const startHour = new Date(year, d.getMonth(), d.getDate(), hour, 0, 0);
      const endHour = new Date(year, d.getMonth(), d.getDate(), hour + 1, 0, 0);

      const fmt = (date) =>
        date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

      map[key] = {
        key,
        startHour,
        label: `${fmt(startHour)} – ${fmt(endHour)}`,
        dateLabel: d.toLocaleDateString([], { month: "short", day: "numeric" }),
        entries: [],
      };
    }
    map[key].entries.push(row);
  });

  // Sort hours newest first
  const sorted = Object.values(map).sort((a, b) => b.startHour - a.startHour);

  return sorted.map((g, idx) => {
    // Within each hour, newest switches on top
    const entries = [...g.entries].sort(
      (a, b) => parseUTC(b.timestamp) - parseUTC(a.timestamp)
    );
    const study = entries.filter(
      (e) => (e.user_label || e.predicted_label) === "study"
    ).length;
    const distract = entries.filter(
      (e) => (e.user_label || e.predicted_label) === "distract"
    ).length;
    const total = study + distract;
    const focusPct = total > 0 ? Math.round((study / total) * 100) : 0;

    return {
      ...g,
      isCurrentHour: idx === 0,
      entries,
      study,
      distract,
      total,
      focusPct,
    };
  });
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
  const totalM = Math.floor(diff / 60);
  const s = diff % 60;
  if (totalM < 60) {
    return totalM > 0 ? (s > 0 ? `${totalM}m ${s}s` : `${totalM}m`) : `${s}s`;
  }
  const h = Math.floor(totalM / 60);
  const m = totalM % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// Builds a continuous timeline by forward-filling the active state across the session
export function buildHeatbar(rows, slices = 40) {
  if (!rows || rows.length === 0) return [];
  const validRows = rows.filter((r) => r.timestamp && !isNaN(parseUTC(r.timestamp)?.getTime()));
  if (validRows.length === 0) return [];

  const sorted = [...validRows].sort(
    (a, b) => parseUTC(a.timestamp) - parseUTC(b.timestamp)
  );
  const start = parseUTC(sorted[0].timestamp).getTime();
  const end = parseUTC(sorted[sorted.length - 1].timestamp).getTime();
  const span = Math.max(end - start, 1);
  const bucketSpan = span / slices;

  const buckets = [];
  for (let i = 0; i < slices; i++) {
    const bucketTime = start + (i + 0.5) * bucketSpan;
    let active = null;
    for (let j = 0; j < sorted.length; j++) {
      const t = parseUTC(sorted[j].timestamp).getTime();
      if (t <= bucketTime) {
        active = sorted[j];
      } else {
        break;
      }
    }
    const label = active
      ? (active.user_label || active.predicted_label)
      : (sorted[0].user_label || sorted[0].predicted_label);
    buckets.push(label || "study");
  }

  return buckets;
}