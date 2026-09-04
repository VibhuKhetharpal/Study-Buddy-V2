const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

export async function getStats() {
  const r = await fetch(`${BASE}/stats`);
  return r.json();
}

export async function getLatestSession() {
  const r = await fetch(`${BASE}/latest_session`);
  return r.json();
}

export async function getSessionLogs(sessionId) {
  const r = await fetch(`${BASE}/session/${sessionId}/logs`);
  return r.json();
}

export async function getSessions() {
  const r = await fetch(`${BASE}/sessions`);
  return r.json();
}

export async function getSummary(sessionId) {
  const r = await fetch(`${BASE}/summary/${sessionId}`);
  return r.json();
}

export async function retrainModel() {
  const r = await fetch(`${BASE}/retrain`, { method: "POST" });
  return r.json();
}

export async function setLabel(id, label) {
  const r = await fetch(`${BASE}/label`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, label }),
  });
  return r.json();
}

export async function setBulkLabel(sessionId, windowTitle, label) {
  const r = await fetch(`${BASE}/label/bulk`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, window_title: windowTitle, label }),
  });
  return r.json();
}

export async function deleteSession(sessionId) {
  const r = await fetch(`${BASE}/session/${sessionId}`, { method: "DELETE" });
  return r.json();
}

export async function deleteLog(logId) {
  const r = await fetch(`${BASE}/log/${logId}`, { method: "DELETE" });
  return r.json();
}

export async function stopSession(sessionId) {
  const r = await fetch(`${BASE}/stop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sessionId ? { session_id: sessionId } : {}),
  });
  return r.json();
}
