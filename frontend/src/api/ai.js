import { authenticatedRequest, authenticatedResponse } from "./auth.js";

function post(path, body) {
  return authenticatedRequest(`/api/ai${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

export const learningChat = (message, history = []) => post("/learning/chat", { message, history });
export const analyzeLearningVisual = (message, response, history = [], presentationMode = "preferences") => post("/learning/visual", { message, response, history, presentation_mode: presentationMode });
export async function streamLearningChat(message, history = [], onToken, presentationMode = "preferences") {
  const response = await authenticatedResponse("/api/ai/learning/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, presentation_mode: presentationMode }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail || "Unable to start the AI response.");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line);
      if (event.error) throw new Error(event.error);
      if (event.token) onToken(event.token);
    }
    if (done) break;
  }
}
export const vivaReply = (topic, message, history = [], sessionAction = "respond") => post("/viva", { topic, message, history, session_action: sessionAction });
export const gdReply = (topic, message, history = [], sessionAction = "respond") => post("/gd", { topic, message, history, session_action: sessionAction });
export const sessionReport = (mode, topic, history = []) => post(`/${mode}/report`, { topic, history });
export const generateTest = (topic, count = 5) => post("/test/generate", { topic, count });
export const wellbeingReply = (message, history = []) => post("/wellbeing", { message, history });
export const planSchedule = (prompt, deadline, purpose, history = [], existingEvents = []) => post("/scheduler/plan", { prompt, deadline, purpose, history, existing_events: existingEvents });
export const getStudyPlan = () => authenticatedRequest("/api/ai/scheduler/study-plan");
export const createStudyPlan = (subject, syllabus, targetDate, dailyMinutes) => post("/scheduler/study-plan", { subject, syllabus, target_date: targetDate, daily_minutes: dailyMinutes });
export const setStudyTaskComplete = (planId, taskId, completed) => authenticatedRequest(`/api/ai/scheduler/study-plan/${planId}/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed }) });
export const rescheduleStudyPlan = (planId) => post(`/scheduler/study-plan/${planId}/reschedule`, {});
export const adjustStudyPlan = (planId, instruction) => post(`/scheduler/study-plan/${planId}/adjust`, { instruction });
