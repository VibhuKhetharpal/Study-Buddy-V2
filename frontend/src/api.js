const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

async function request(path, options = {}) {
  const r = await fetch(`${BASE}${path}`, options);
  const contentType = r.headers.get("content-type") || "";
  let data = null;
  if (contentType.includes("application/json")) {
    try {
      data = await r.json();
    } catch {
      data = null;
    }
  }
  if (!r.ok) {
    const msg = (data && data.error) ? data.error : `HTTP ${r.status}: ${r.statusText || "Request failed"}`;
    const err = new Error(msg);
    err.status = r.status;
    err.data = data;
    throw err;
  }
  return data !== null ? data : {};
}

export function getStats() {
  return request("/stats");
}

export function getLatestSession() {
  return request("/latest_session");
}

export function getSessionLogs(sessionId) {
  return request(`/session/${sessionId}/logs`);
}

export function getSessions() {
  return request("/sessions");
}

export function getSummary(sessionId) {
  return request(`/summary/${sessionId}`);
}

export function retrainModel() {
  return request("/retrain", { method: "POST" });
}

export function setLabel(id, label) {
  return request("/label", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, label }),
  });
}

export function setBulkLabel(sessionId, windowTitle, label) {
  return request("/label/bulk", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, window_title: windowTitle, label }),
  });
}

export function deleteSession(sessionId) {
  return request(`/session/${sessionId}`, { method: "DELETE" });
}

export function deleteLog(logId) {
  return request(`/log/${logId}`, { method: "DELETE" });
}

export function startSession() {
  return request("/start", { method: "POST" });
}

export function stopSession(sessionId) {
  return request("/stop", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sessionId ? { session_id: sessionId } : {}),
  });
}
