import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./AIScheduler.css";
import "./StudyPlanner.css";
import "./PlannerEmbedded.css";
import { adjustStudyPlan, createStudyPlan, getStudyPlan, planSchedule, rescheduleStudyPlan, setStudyTaskComplete } from "../api/ai.js";

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
  const navigate = useNavigate();
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
  const [studyPlan, setStudyPlan] = useState(null);
  const [subject, setSubject] = useState("");
  const [syllabus, setSyllabus] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [dailyMinutes, setDailyMinutes] = useState(60);
  const [generatingStudyPlan, setGeneratingStudyPlan] = useState(false);
  const [completion, setCompletion] = useState(null);
  const [adjustment, setAdjustment] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const promptRef = useRef(null);
  const today = new Date();
  const firstName = (user.full_name || user.email.split("@")[0]).split(" ")[0];
  const greeting = today.getHours() < 12 ? "Good morning" : today.getHours() < 18 ? "Good afternoon" : "Good evening";
  useEffect(() => { getStudyPlan().then(async (plan) => { if (!plan) return; const hasOverdue = plan.tasks.some((task) => task.status !== "completed" && task.scheduled_date < new Date().toISOString().slice(0, 10)); if (hasOverdue) { const adjusted = await rescheduleStudyPlan(plan.id); setStudyPlan(adjusted); if (adjusted.rescheduled?.length) setSupportMessage(adjusted.message); } else setStudyPlan(plan); }).catch(() => {}); }, []);

  async function generateStudyPlan(event) {
    event.preventDefault();
    if (!subject.trim()) { setPlannerError("Please enter the subject or course name."); return; }
    if (syllabus.trim().length < 10) { setPlannerError("Please add a little more syllabus detail so Nexora can build useful topics."); return; }
    if (!targetDate) { setPlannerError("Please choose an exam or target date."); return; }
    setGeneratingStudyPlan(true); setPlannerError("");
    try { setStudyPlan(await createStudyPlan(subject.trim(), syllabus.trim(), targetDate, Number(dailyMinutes))); }
    catch { setPlannerError("I couldnâ€™t build the plan just yet. Letâ€™s try again."); }
    finally { setGeneratingStudyPlan(false); }
  }

  async function toggleTask(task) {
    const previous = studyPlan.progress.percentage;
    try { const next = await setStudyTaskComplete(studyPlan.id, task.id, task.status !== "completed"); setStudyPlan(next); if (task.status !== "completed") setCompletion({ title: task.title, previous, percentage: next.progress.percentage }); }
    catch { setPlannerError("I couldnâ€™t update that task just yet. Your plan is still safe."); }
  }

  async function rebalance() {
    try { const next = await rescheduleStudyPlan(studyPlan.id); setStudyPlan(next); setSupportMessage(next.rescheduled?.length ? next.message : "Your plan is already comfortably up to date."); }
    catch { setPlannerError("I couldnâ€™t rebalance the plan just yet. Nothing has been lost."); }
  }

  async function adjust(event) {
    event.preventDefault(); if (!adjustment.trim()) return;
    try { setStudyPlan(await adjustStudyPlan(studyPlan.id, adjustment.trim())); setAdjustment(""); setSupportMessage("Your future sessions have been gently rebalanced. Completed work was preserved."); }
    catch { setPlannerError("I couldnâ€™t adjust the plan just yet. Your current schedule is unchanged."); }
  }

  function startFocus(task) {
    localStorage.setItem(`nexora-focus-active:${user.id}`, "true");
    localStorage.setItem(`nexora-deep-focus:${user.id}`, JSON.stringify({ elapsed: 0, status: "active", objective: task.title, plannerTask: { planId: studyPlan.id, taskId: task.id }, questions: 0, concepts: 0, weak: 0 }));
    navigate("/learning-space");
  }

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

      <PlannerInput subject={subject} setSubject={setSubject} syllabus={syllabus} setSyllabus={setSyllabus} targetDate={targetDate} setTargetDate={setTargetDate} dailyMinutes={dailyMinutes} setDailyMinutes={setDailyMinutes} generating={generatingStudyPlan} hasPlan={Boolean(studyPlan)} today={today} promptRef={promptRef} onSubmit={generateStudyPlan} clearError={() => setPlannerError("")} error={plannerError} />

      <div className="scheduler__grid">
        <section className="calendar-card">
          <header className="calendar-card__top"><div><strong>{today.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong><span>{view} plan</span></div><div className="calendar-nav"><button type="button" aria-label="Previous period">‹</button><button type="button">Today</button><button type="button" aria-label="Next period">›</button></div></header>
          <div className="calendar-week">{week.map((date) => <div className={date.toDateString() === today.toDateString() ? "is-today" : ""} key={date.toISOString()}><span>{date.toLocaleDateString(undefined, { weekday: "short" })}</span><strong>{date.getDate()}</strong></div>)}</div>
          {studyPlan && <div className="generated-calendar-tasks">{Object.entries(studyPlan.tasks.reduce((days, task) => ({ ...days, [task.scheduled_date]: [...(days[task.scheduled_date] || []), task] }), {})).sort(([a], [b]) => a.localeCompare(b)).map(([day, tasks]) => <section key={day}><header><span>{new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { weekday: "long" })}</span><strong>{new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</strong></header>{tasks.map((task) => <article className={task.status === "completed" ? "is-complete" : ""} key={task.id}><button className="task-check" onClick={() => toggleTask(task)} aria-label={`Complete ${task.title}`}>{task.status === "completed" ? "✓" : ""}</button><div><span>{task.unit}</span><h3>{task.title}</h3><p>{task.start_time}–{task.end_time}</p></div>{task.status !== "completed" && <button className="task-focus" onClick={() => startFocus(task)}>Focus</button>}</article>)}</section>)}</div>}
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
        {!studyPlan ? <form className="syllabus-builder syllabus-builder--embedded" onSubmit={generateStudyPlan}><label><span>Subject or course</span><input value={subject} onChange={(e) => { setSubject(e.target.value); setPlannerError(""); }} placeholder="Data Structures & Algorithms" /></label><label className="syllabus-builder__text"><span>Paste your syllabus or describe everything you need to study</span><textarea ref={promptRef} rows="7" value={syllabus} onChange={(e) => { setSyllabus(e.target.value); setPlannerError(""); }} placeholder={"Arrays\nLinked Lists\nStacks and Queues\nTrees\nGraphs"} /></label><label className="syllabus-upload"><input type="file" accept=".txt,.md,.csv" onChange={(e) => { const file = e.target.files[0]; if (file) file.text().then((text) => { setSyllabus(text); setPlannerError(""); }); }} /><span>Upload text syllabus</span></label><div className="syllabus-builder__row"><label><span>Exam / target date</span><input type="date" min={today.toISOString().slice(0,10)} value={targetDate} onChange={(e) => { setTargetDate(e.target.value); setPlannerError(""); }} /></label><label><span>Study time per day</span><select value={dailyMinutes} onChange={(e) => setDailyMinutes(e.target.value)}><option value="30">30 minutes</option><option value="60">1 hour</option><option value="90">1.5 hours</option><option value="120">2 hours</option><option value="180">3 hours</option></select></label></div><button type="submit" disabled={generatingStudyPlan}>{generatingStudyPlan ? "Understanding your syllabus…" : "Generate Study Plan"}</button></form> : <form onSubmit={analyse} className="planner-prompt"><textarea ref={promptRef} rows="3" value={prompt} onChange={(event) => { setPrompt(event.target.value); setUnderstood(null); setScheduled(false); setPlannerError(""); }} placeholder="Tell Nexora how your existing plan should change." /><div className="planner-details"><label><span>Deadline</span><input value={deadline} onChange={(event) => setDeadline(event.target.value)} placeholder="e.g. September 15" /></label><label><span>Purpose</span><input value={purpose} onChange={(event) => setPurpose(event.target.value)} placeholder="e.g. Prepare for my exam" /></label></div><button type="submit" disabled={!prompt.trim() || planning}>{planning ? "Planning…" : "Plan my schedule"} <span>→</span></button></form>}
        {plannerError && <div className="planner-error" role="alert">{plannerError}</div>}
        {understood && <div className="understood"><div className="understood__heading"><div><span>Understood</span><h3>{clarification || "I’ll plan around these details"}</h3></div>{scheduled && <strong className="understood__success">Schedule updated</strong>}</div><div className="understood__facts"><div><span>Type</span><strong>{understood.type}</strong></div><div><span>Date / time</span><strong>{understood.date}</strong></div><div><span>Goal</span><strong>{understood.goal}</strong></div><div><span>Constraint</span><strong>{(understood.constraints || []).join(" · ") || "Flexible"}</strong></div></div><p>{clarification ? "Add the missing detail in the prompt above, then ask Nexora to continue." : "Review the generated sessions, then apply the revised plan."}</p><button type="button" onClick={createSchedule} disabled={scheduled || Boolean(clarification)}>{scheduled ? "Plan updated" : clarification ? "Waiting for details" : "Apply schedule"} <span>{scheduled ? "✓" : "→"}</span></button></div>}
      </section>
      {studyPlan && <StudyPlanDashboard plan={studyPlan} onToggle={toggleTask} onFocus={startFocus} onRebalance={rebalance} adjustment={adjustment} setAdjustment={setAdjustment} onAdjust={adjust} supportMessage={supportMessage} />}
      {completion && <div className="progress-celebration" role="dialog" aria-modal="true"><section><button className="progress-celebration__close" onClick={() => setCompletion(null)}>Ã—</button><span>Nicely done</span><h2>You completed {completion.title}</h2><p>{progressMessage(completion.percentage)}</p><div className="progress-celebration__bar"><i style={{ width: `${completion.percentage}%` }} /></div><strong>{completion.percentage}% complete</strong><button onClick={() => setCompletion(null)}>Continue</button></section></div>}
    </main></div>
  );
}

function PlannerInput({ subject, setSubject, syllabus, setSyllabus, targetDate, setTargetDate, dailyMinutes, setDailyMinutes, generating, hasPlan, today, promptRef, onSubmit, clearError, error }) {
  return <section className="planner-card planner-card--primary"><div className="planner-card__intro"><span className="planner-card__mark"><img src="/nexora-mark.png" alt="" /></span><div><span className="scheduler__eyebrow">Let Nexora plan it for you</span><h2>Describe your goal in your own words.</h2></div></div><form className="syllabus-builder syllabus-builder--embedded" onSubmit={onSubmit}><label><span>Subject or course</span><input value={subject} onChange={(e) => { setSubject(e.target.value); clearError(); }} placeholder="Data Structures & Algorithms" /></label><label className="syllabus-builder__text"><span>Paste your syllabus or describe everything you need to study</span><textarea ref={promptRef} rows="6" value={syllabus} onChange={(e) => { setSyllabus(e.target.value); clearError(); }} placeholder={"Arrays\nLinked Lists\nStacks and Queues\nTrees\nGraphs"} /></label><label className="syllabus-upload"><input type="file" accept=".txt,.md,.csv" onChange={(e) => { const file = e.target.files[0]; if (file) file.text().then((text) => { setSyllabus(text); clearError(); }); }} /><span>Upload text syllabus</span></label><div className="syllabus-builder__row"><label><span>Exam / target date</span><input type="date" min={today.toISOString().slice(0,10)} value={targetDate} onChange={(e) => { setTargetDate(e.target.value); clearError(); }} /></label><label><span>Study time per day</span><select value={dailyMinutes} onChange={(e) => setDailyMinutes(e.target.value)}><option value="30">30 minutes</option><option value="60">1 hour</option><option value="90">1.5 hours</option><option value="120">2 hours</option><option value="180">3 hours</option></select></label></div><button type="submit" disabled={generating}>{generating ? "Understanding your syllabus…" : hasPlan ? "Update Study Plan" : "Generate Study Plan"}</button></form>{error && <div className="planner-error" role="alert">{error}</div>}</section>;
}

function progressMessage(value) {
  if (value >= 95) return "You did it. Your study plan is complete.";
  if (value >= 80) return "Youâ€™re almost there. Keep going at your pace.";
  if (value >= 60) return "Youâ€™re more than halfway there.";
  if (value >= 40) return "Youâ€™re making great progress. Keep it up.";
  if (value >= 20) return "Youâ€™re getting started â€” keep going.";
  return "Every journey starts somewhere. Youâ€™ve got this.";
}

function StudyPlanDashboard({ plan, onToggle, onFocus, onRebalance, adjustment, setAdjustment, onAdjust, supportMessage }) {
  const today = new Date().toISOString().slice(0, 10);
  const todaysTasks = plan.tasks.filter((task) => task.scheduled_date === today);
  const shownTasks = todaysTasks.length ? todaysTasks : plan.tasks.filter((task) => task.status !== "completed").slice(0, 4);
  const upcoming = Object.entries(plan.tasks.filter((task) => task.scheduled_date > today && task.status !== "completed").reduce((days, task) => ({ ...days, [task.scheduled_date]: (days[task.scheduled_date] || 0) + 1 }), {})).slice(0, 3);
  return <section className="study-plan-dashboard"><header><div><span className="scheduler__eyebrow">Today&apos;s plan</span><h2>{plan.subject}</h2><p>{plan.progress.completed_topics} of {plan.progress.total_topics} topics complete · Target {new Date(`${plan.target_date}T00:00:00`).toLocaleDateString()}</p></div><div className="study-plan-progress"><strong>{plan.progress.percentage}%</strong><span><i style={{ width: `${plan.progress.percentage}%` }} /></span></div></header><div className="study-plan-grid"><div className="today-study-tasks">{shownTasks.length ? shownTasks.map((task) => <article className={task.status === "completed" ? "is-complete" : ""} key={task.id}><button className="task-check" onClick={() => onToggle(task)} aria-label={`${task.status === "completed" ? "Reopen" : "Complete"} ${task.title}`}>{task.status === "completed" ? "âœ“" : ""}</button><div><span>{task.unit}</span><h3>{task.title}</h3><p>{task.scheduled_date === today ? "Today" : new Date(`${task.scheduled_date}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {task.start_time}â€“{task.end_time}</p></div>{task.status !== "completed" && <button className="task-focus" onClick={() => onFocus(task)}>Start Focus Session</button>}</article>) : <p className="study-plan-empty">Nothing is scheduled today. Take the breathing room.</p>}</div><aside className="study-plan-upcoming"><span>Upcoming</span>{upcoming.map(([day, count]) => <p key={day}><strong>{new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { weekday: "long" })}</strong>{count} topic{count === 1 ? "" : "s"}</p>)}<button onClick={onRebalance}>Check & reschedule unfinished work</button></aside></div>{supportMessage && <div className="scheduler-support">{supportMessage}</div>}<form className="adjust-plan" onSubmit={onAdjust}><label><span>Adjust my plan</span><input value={adjustment} onChange={(e) => setAdjustment(e.target.value)} placeholder="I have only 1 hour tomorrow" /></label><button disabled={!adjustment.trim()}>Rebalance</button></form></section>;
}
