import { useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import "./AIScheduler.css";
import { planSchedule } from "../api/ai.js";

const INITIAL_EVENTS = [
  { id: 1, dayOffset: 0, time: "11:00", title: "Linear Algebra", duration: "45 min", category: "Study", color: "study" },
  { id: 2, dayOffset: 0, time: "14:00", title: "Gym", duration: "1 hour", category: "Personal", color: "personal" },
  { id: 3, dayOffset: 0, time: "17:00", title: "ML Assignment", duration: "45 min", category: "Study", color: "study" },
];

const asText = (value, fallback = "") => typeof value === "string" && value.trim() ? value.trim() : fallback;

function normalizePlan(result, fallbackPrompt, fallbackDeadline, fallbackPurpose, currentEvents) {
  const source = result && typeof result === "object" && !Array.isArray(result) ? result : {};
  const raw = source.understood && typeof source.understood === "object" && !Array.isArray(source.understood) ? source.understood : {};
  const rawConstraints = Array.isArray(raw.constraints) ? raw.constraints : raw.constraints ? [raw.constraints] : [];
  const constraints = rawConstraints.map((item) => asText(item)).filter(Boolean);
  const events = (Array.isArray(source.events) ? source.events : currentEvents)
    .filter((item) => item && typeof item === "object" && !Array.isArray(item))
    .map((item, index) => ({
      id: item.id ?? Date.now() + index,
      dayOffset: Number.isInteger(Number(item.dayOffset)) ? Math.min(6, Math.max(0, Number(item.dayOffset))) : 0,
      time: /^([01]\d|2[0-3]):[0-5]\d$/.test(item.time) ? item.time : "19:00",
      title: asText(item.title, "Focused work session"),
      duration: asText(item.duration, "30 min"),
      category: asText(item.category, "Study"),
    }));
  return {
    understood: {
      type: asText(raw.type, "Study goal"),
      date: asText(raw.deadline ?? raw.date, fallbackDeadline || "Flexible"),
      goal: asText(raw.title ?? raw.goal, fallbackPrompt),
      constraints: constraints.length ? constraints : [asText(raw.purpose, fallbackPurpose || "Keep sessions manageable")],
    },
    events,
    operation: ["create", "update", "remove", "replace"].includes(source.operation) ? source.operation : "update",
    clarification: asText(source.clarification_question),
  };
}

function understandPrompt(prompt) {
  const lower = prompt.toLowerCase();
  const isExam = /exam|gate|test/.test(lower);
  const isDeadline = /submit|deadline|project|assignment|due/.test(lower);
  const isPersonal = /gym|appointment|personal|workout/.test(lower);
  const type = isExam ? "Exam" : isDeadline ? "Deadline" : isPersonal ? "Personal" : "Study goal";
  const dateMatch = prompt.match(/(?:on|by|from)\s+([A-Z]?[a-z]+\s+\d{1,2}(?:\s*(?:-|to)\s*[A-Z]?[a-z]*\s*\d{1,2})?|(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday))/i);
  const timeMatch = prompt.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i);
  const chapters = prompt.match(/\b(\d+)\s+(chapters?|topics?|modules?|sessions?)\b/i);
  const constraints = [];
  if (/sundays? free/.test(lower)) constraints.push("Keep Sundays free");
  if (/college/.test(lower)) constraints.push("Plan around college hours");
  if (/monday.*wednesday.*friday/.test(lower)) constraints.push("Repeats Mon, Wed and Fri");
  return {
    type,
    date: dateMatch?.[1] || (timeMatch ? timeMatch[1].toUpperCase() : "Flexible"),
    goal: chapters ? `Complete ${chapters[1]} ${chapters[2]}` : isPersonal ? "Add recurring commitment" : isDeadline ? "Finish before the deadline" : "Build manageable sessions",
    constraints: constraints.length ? constraints : ["Keep sessions short and achievable"],
  };
}

export default function AIScheduler() {
  const { user } = useAuth();
  const [view, setView] = useState("Today");
  const [prompt, setPrompt] = useState("");
  const [understood, setUnderstood] = useState(null);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [scheduled, setScheduled] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [purpose, setPurpose] = useState("");
  const [plannedEvents, setPlannedEvents] = useState([]);
  const [planning, setPlanning] = useState(false);
  const [plannerHistory, setPlannerHistory] = useState([]);
  const [planOperation, setPlanOperation] = useState("create");
  const [clarification, setClarification] = useState("");
  const [plannerError, setPlannerError] = useState("");
  const promptRef = useRef(null);
  const today = new Date();
  const firstName = (user.full_name || user.email.split("@")[0]).split(" ")[0];
  const greeting = today.getHours() < 12 ? "Good morning" : today.getHours() < 18 ? "Good afternoon" : "Good evening";

  const week = useMemo(() => {
    const monday = new Date(today);
    const day = today.getDay() || 7;
    monday.setDate(today.getDate() - day + 1);
    return Array.from({ length: 5 }, (_, index) => {
      const date = new Date(monday); date.setDate(monday.getDate() + index); return date;
    });
  }, []);

  async function analyse(event) {
    event.preventDefault();
    if (!prompt.trim()) return;
    setPlanning(true); setScheduled(false); setPlannerError("");
    try {
      const request = prompt.trim();
      const result = await planSchedule(request, deadline || null, purpose || null, plannerHistory, events);
      const plan = normalizePlan(result, request, deadline, purpose, events);
      setUnderstood(plan.understood);
      setPlannedEvents(plan.events);
      setPlanOperation(plan.operation);
      setClarification(plan.clarification);
      setPlannerHistory((current) => [...current, { role: "user", content: request }, { role: "assistant", content: JSON.stringify({ understood: result.understood, operation: result.operation, clarification_question: result.clarification_question, events: result.events }) }].slice(-30));
    } catch (error) {
      setUnderstood(understandPrompt(prompt.trim()));
      setPlannedEvents([]);
      setClarification("");
      setPlannerError(error.message || "Nexora could not generate the plan. Please try again.");
    }
    finally { setPlanning(false); }
  }

  function createSchedule() {
    const color = understood.type === "Personal" ? "personal" : understood.type === "Exam" || understood.type === "Deadline" ? "deadline" : "study";
    const generated = plannedEvents.length ? plannedEvents.map((item, index) => ({ id: Date.now() + index, dayOffset: item.dayOffset ?? 0, time: item.time || "19:00", title: item.title || "Focused work session", duration: item.duration || "30 min", category: item.category || understood.type, color: item.category === "Personal" ? "personal" : item.category?.includes("Exam") ? "deadline" : item.category === "Wellbeing" ? "wellbeing" : "study" })) : [{ id: Date.now(), dayOffset: 0, time: "19:00", title: understood.type === "Personal" ? "New commitment" : "Focused work session", duration: "30 min", category: understood.type, color }];
    setEvents((current) => planOperation === "create" && current.length === 0 ? generated : generated.length ? generated : current);
    setScheduled(true);
  }

  return (
    <div className="scheduler"><div className="scheduler__glow" aria-hidden="true" /><main className="scheduler__inner">
      <header className="scheduler__header"><div><span className="scheduler__eyebrow">AI Scheduler</span><h1>{greeting}, {firstName}.</h1><p>Here&apos;s your plan for today.</p></div><div className="view-tabs" role="tablist">{["Today", "Week", "Month"].map((item) => <button type="button" role="tab" aria-selected={view === item} className={view === item ? "is-active" : ""} key={item} onClick={() => setView(item)}>{item}</button>)}</div></header>

      <div className="scheduler__grid">
        <section className="calendar-card">
          <header className="calendar-card__top"><div><strong>{today.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong><span>{view} plan</span></div><div className="calendar-nav"><button type="button" aria-label="Previous period">‹</button><button type="button">Today</button><button type="button" aria-label="Next period">›</button></div></header>
          <div className="calendar-week">{week.map((date) => <div className={date.toDateString() === today.toDateString() ? "is-today" : ""} key={date.toISOString()}><span>{date.toLocaleDateString(undefined, { weekday: "short" })}</span><strong>{date.getDate()}</strong></div>)}</div>
          {view === "Today" ? <div className="timeline">{["09:00", "11:00", "14:00", "17:00", "19:00", "20:00"].map((time) => { const event = events.find((item) => item.dayOffset === 0 && item.time === time); return <div className="timeline__row" key={time}><time>{new Date(`2026-01-01T${time}`).toLocaleTimeString([], { hour: "numeric" })}</time><div className="timeline__line" />{event && <article className={`schedule-event schedule-event--${event.color}`}><i /><div><strong>{event.title}</strong><span>{event.duration} · {event.category}</span></div><button type="button" aria-label={`Options for ${event.title}`}>•••</button></article>}</div>})}</div> : <div className={`calendar-overview calendar-overview--${view.toLowerCase()}`}>{view === "Week" ? week.map((date, index) => { const dayEvents = events.filter((event) => event.dayOffset === index).sort((a, b) => a.time.localeCompare(b.time)); return <div key={date.toISOString()}><strong>{date.toLocaleDateString(undefined, { weekday: "short" })} {date.getDate()}</strong>{dayEvents.map((event) => <span className={`mini-event mini-event--${event.color}`} key={event.id}><time>{new Date(`2026-01-01T${event.time}`).toLocaleTimeString([], { hour: "numeric" })}</time>{event.title}</span>)}</div>; }) : Array.from({ length: new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() }, (_, index) => { const dateNumber = index + 1; const mondayDate = week[0].getDate(); const dateEvents = events.filter((event) => mondayDate + event.dayOffset === dateNumber); return <span className={dateNumber === today.getDate() ? "is-today" : ""} key={dateNumber}>{dateNumber}{dateEvents.length > 0 && <i className={`month-event-dot month-event-dot--${dateEvents[0].color}`} />}</span>; })}</div>}
          <button className="add-something" type="button" onClick={() => promptRef.current?.focus()}><span>+</span> Add something</button>
        </section>

        <aside className="scheduler__side">
          <section className="deadline-card"><div className="deadline-card__top"><span className="category-dot category-dot--deadline" /> <strong>Next milestone</strong><small>Exam</small></div><h2>Maths Exam</h2><p>September 15 · <strong>22 days remaining</strong></p><div className="deadline-card__progress"><span style={{ width: "62%" }} /></div><footer><span>Preparation</span><strong>62%</strong></footer></section>
          <div className="category-key"><span><i className="study" /> Study</span><span><i className="personal" /> Personal</span><span><i className="deadline" /> Exam / deadline</span><span><i className="wellbeing-dot" /> Wellbeing</span></div>
        </aside>
      </div>

      <section className="planner-card">
        <div className="planner-card__intro"><span className="planner-card__mark"><img src="/nexora-mark.png" alt="" /></span><div><span className="scheduler__eyebrow">Let Nexora plan it for you</span><h2>Describe your goal in your own words.</h2></div></div>
        <form onSubmit={analyse} className="planner-prompt"><textarea ref={promptRef} rows="3" value={prompt} onChange={(event) => { setPrompt(event.target.value); setUnderstood(null); setScheduled(false); setPlannerError(""); }} placeholder="I have a math exam on September 15. I need to finish 6 chapters and want Sundays free." /><div className="planner-details"><label><span>Deadline</span><input value={deadline} onChange={(event) => setDeadline(event.target.value)} placeholder="e.g. September 15" /></label><label><span>Purpose</span><input value={purpose} onChange={(event) => setPurpose(event.target.value)} placeholder="e.g. Prepare for my exam" /></label></div><button type="submit" disabled={!prompt.trim() || planning}>{planning ? "Planning…" : "Plan my schedule"} <span>→</span></button></form>
        {plannerError && <div className="planner-error" role="alert">{plannerError}</div>}
        {understood && <div className="understood"><div className="understood__heading"><div><span>Understood</span><h3>{clarification || "I’ll plan around these details"}</h3></div>{scheduled && <strong className="understood__success">Schedule updated</strong>}</div><div className="understood__facts"><div><span>Type</span><strong>{understood.type}</strong></div><div><span>Date / time</span><strong>{understood.date}</strong></div><div><span>Goal</span><strong>{understood.goal}</strong></div><div><span>Constraint</span><strong>{(understood.constraints || []).join(" · ") || "Flexible"}</strong></div></div><p>{clarification ? "Add the missing detail in the prompt above, then ask Nexora to continue." : "Review the generated sessions, then apply the revised plan."}</p><button type="button" onClick={createSchedule} disabled={scheduled || Boolean(clarification)}>{scheduled ? "Plan updated" : clarification ? "Waiting for details" : "Apply schedule"} <span>{scheduled ? "✓" : "→"}</span></button></div>}
      </section>
    </main></div>
  );
}
