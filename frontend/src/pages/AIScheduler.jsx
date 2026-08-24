import { useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import "./AIScheduler.css";

const INITIAL_EVENTS = [
  { id: 1, dayOffset: 0, time: "11:00", title: "Linear Algebra", duration: "45 min", category: "Study", color: "study" },
  { id: 2, dayOffset: 0, time: "14:00", title: "Gym", duration: "1 hour", category: "Personal", color: "personal" },
  { id: 3, dayOffset: 0, time: "17:00", title: "ML Assignment", duration: "45 min", category: "Study", color: "study" },
];

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

  function analyse(event) {
    event.preventDefault();
    if (!prompt.trim()) return;
    setUnderstood(understandPrompt(prompt.trim())); setScheduled(false);
  }

  function createSchedule() {
    const color = understood.type === "Personal" ? "personal" : understood.type === "Exam" || understood.type === "Deadline" ? "deadline" : "study";
    setEvents((current) => [...current, { id: Date.now(), dayOffset: 0, time: "19:00", title: understood.type === "Personal" ? "New commitment" : "Focused work session", duration: "30 min", category: understood.type, color }]);
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
        <div className="planner-card__intro"><span className="planner-card__mark">N</span><div><span className="scheduler__eyebrow">Let Nexora plan it for you</span><h2>Describe your goal in your own words.</h2></div></div>
        <form onSubmit={analyse} className="planner-prompt"><textarea ref={promptRef} rows="3" value={prompt} onChange={(event) => { setPrompt(event.target.value); setUnderstood(null); setScheduled(false); }} placeholder="I have a math exam on September 15. I need to finish 6 chapters and want Sundays free." /><button type="submit" disabled={!prompt.trim()}>Plan my schedule <span>→</span></button></form>
        {understood && <div className="understood"><div className="understood__heading"><div><span>Understood</span><h3>I&apos;ll plan around these details</h3></div>{scheduled && <strong className="understood__success">Schedule created</strong>}</div><div className="understood__facts"><div><span>Type</span><strong>{understood.type}</strong></div><div><span>Date / time</span><strong>{understood.date}</strong></div><div><span>Goal</span><strong>{understood.goal}</strong></div><div><span>Constraint</span><strong>{understood.constraints.join(" · ")}</strong></div></div><p>I&apos;ll create short sessions around your existing commitments and keep the plan flexible.</p><button type="button" onClick={createSchedule} disabled={scheduled}>{scheduled ? "Added to your plan" : "Create schedule"} <span>{scheduled ? "✓" : "→"}</span></button></div>}
      </section>
    </main></div>
  );
}
