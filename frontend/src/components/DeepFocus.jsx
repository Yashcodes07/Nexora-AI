import { useEffect, useState } from "react";
import AdaptiveAnswer from "./AdaptiveAnswer.jsx";
import "./DeepFocus.css";
import "./DeepFocusTutor.css";
import { setStudyTaskComplete } from "../api/ai.js";

const clock = (n) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
const formats = [
  ["visual", "Visual explanation", "Interactive diagram or visual model"],
  ["short_text", "Short text", "A concise answer in small sections"],
  ["speech", "Listen aloud", "A natural spoken explanation"],
  ["step_by_step", "Step by step", "One clear idea at a time"],
  ["preferences", "Use my preferences", "Use your saved learning choices"],
];

export default function DeepFocus({ userId, objective, messages, sending, notice, onSend, onExit, preferences }) {
  const key = `nexora-deep-focus:${userId || "guest"}`;
  const [state, setState] = useState(() => { try { return { elapsed: 0, status: "active", mode: "focus", stage: 0, thoughts: [], questions: 0, concepts: 0, weak: 0, objective, ...JSON.parse(localStorage.getItem(key) || "{}") }; } catch { return { elapsed: 0, status: "active", mode: "focus", stage: 0, thoughts: [], questions: 0, concepts: 0, weak: 0, objective }; } });
  const [entering, setEntering] = useState(true), [leaving, setLeaving] = useState(false), [question, setQuestion] = useState(""), [pendingQuestion, setPendingQuestion] = useState("");
  const update = (change) => setState((value) => ({ ...value, ...change }));
  useEffect(() => { const id = setTimeout(() => setEntering(false), 550); return () => clearTimeout(id); }, []);
  useEffect(() => { if (state.status !== "active") return; const id = setInterval(() => setState((s) => ({ ...s, elapsed: s.elapsed + 1 })), 1000); return () => clearInterval(id); }, [state.status]);
  useEffect(() => localStorage.setItem(key, JSON.stringify(state)), [key, state]);
  useEffect(() => { function keys(e) { if (e.target.matches("input,textarea")) return; const k = e.key.toLowerCase(); if (k === "escape") setLeaving(true); if (k === " ") { e.preventDefault(); setState((s) => ({ ...s, status: s.status === "active" ? "paused" : "active" })); } } window.addEventListener("keydown", keys); return () => window.removeEventListener("keydown", keys); }, []);
  const title = (state.objective || "Master your current topic").replace(/^(teach me|explain|help me study)\s+/i, "").slice(0, 70);
  function ask(e) { e.preventDefault(); if (!question.trim() || sending) return; setPendingQuestion(question.trim()); setQuestion(""); }
  function chooseFormat(format) { onSend(pendingQuestion, format); if (!state.objective || state.objective === "Master your current topic") update({ objective: pendingQuestion, questions: state.questions + 1 }); else update({ questions: state.questions + 1 }); setPendingQuestion(""); }
  function end() { setLeaving(false); update({ status: "complete", concepts: Math.max(state.concepts, state.stage ? 2 : 1), weak: state.questions ? 1 : 0 }); }
  async function finish() { if (state.plannerTask) { try { await setStudyTaskComplete(state.plannerTask.planId, state.plannerTask.taskId, true); } catch { /* Scheduler can reconcile later. */ } } localStorage.removeItem(key); onExit(); }
  if (entering) return <div className="df df-enter"><span><i />Entering Deep Focus…</span></div>;
  if (state.status === "complete") return <div className="df df-complete"><main><span>Session complete</span><strong>{clock(state.elapsed)}</strong><h1>{title} progressed</h1><p>✓ {state.concepts} concepts completed<br />✓ {state.questions} questions completed<br />✓ {state.weak} weak area identified</p><section><small>Nexora recommends</small><h2>{title} Revision</h2><p>Tomorrow · 6:30 PM</p></section><button onClick={finish}>Finish Session</button></main></div>;
  return <div className="df">
    <header><div><b>Deep Focus</b><small><i /> Focus {state.status === "active" ? "Active" : "Paused"}</small></div><button className="df-exit" onClick={() => setLeaving(true)}>Exit focus mode</button></header>
    <main className="df-main"><section className="df-objective df-objective--focus"><span>Deep learning environment</span><h1>You are currently in Focus Mode, where you can learn with maximum attention.</h1></section>
      <button className={`df-orb ${state.status === "paused" ? "paused" : ""}`} onClick={() => update({ status: state.status === "active" ? "paused" : "active" })}><strong>{clock(state.elapsed)}</strong><small>{state.status === "active" ? "Deep Focus" : "Paused"}</small></button>
      <section className="df-topic"><span>Current topic</span><h2>{title}</h2></section>
      <section className="df-tutor"><header><div><span>Nexora Tutor</span><p>Ask questions while staying in deep focus.</p></div></header><div className="df-tutor-chat">{messages.length === 0 && <div className="df-tutor-empty"><img src="/nexora-mark.png" alt="" /><h2>How can I help you learn?</h2><p>Your tutor is ready when you are.</p></div>}{messages.map((m, i) => <article className={`${m.role} ${m.presentationMode === "visual" ? "visual" : ""}`} key={i}>{m.role === "assistant" ? <AdaptiveAnswer content={m.content} preferences={preferences} visual={m.visual} presentationMode={m.presentationMode || "preferences"} complete={!sending || i < messages.length - 1} /> : <p>{m.content}</p>}</article>)}{sending && messages.at(-1)?.role !== "assistant" && <div className="df-tutor-thinking">Nexora is thinking…</div>}</div><form onSubmit={ask}><textarea autoFocus rows="2" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} placeholder="Ask Nexora anything about this topic…" /><button disabled={!question.trim() || sending}>{sending ? "Thinking…" : "Ask Nexora"}</button></form></section>
    </main>
    {notice && <output>{notice}</output>}
    {pendingQuestion && <div className="df-format" role="dialog" aria-modal="true" aria-labelledby="df-format-title"><section><button className="df-format-close" onClick={() => setPendingQuestion("")} aria-label="Cancel">×</button><span>Choose your format</span><h2 id="df-format-title">How would you like this explained?</h2><p>You can choose a different format for every question.</p><div>{formats.map(([value, label, description]) => <button key={value} onClick={() => chooseFormat(value)}><strong>{label}</strong><small>{description}</small></button>)}</div></section></div>}
    {leaving && <div className="df-modal"><section><span>Session active</span><h2>Leave Focus?</h2><p>Your current session: <strong>{clock(state.elapsed)}</strong></p><div><button onClick={() => setLeaving(false)}>Continue Focusing</button><button onClick={end}>End Session</button></div></section></div>}
  </div>;
}
