import { useEffect, useState } from "react";
import { getDashboardSection } from "../api/auth.js";
import "./Dashboard.css";

const pageContent = {
  "learning-space": {
    eyebrow: "Learn your way", title: "Learning Space", intro: "A calm, adaptive space built around your learning preferences.",
    cards: [["Continue learning", "Your active courses and lessons will appear here."], ["Recommended for you", "Personalised material will be selected using your preferred learning style."], ["Learning library", "Explore topics, save resources, and build your own path."]],
    empty: "No courses yet", emptyText: "Start a new topic and Nexora will adapt the experience to you.", action: "Explore a topic",
  },
  wellbeing: {
    eyebrow: "Pause and reset", title: "Wellbeing", intro: "Small check-ins help you learn with your energy, not against it.",
    cards: [["How are you feeling?", "Take a quick, private check-in before your next session."], ["Mindful breaks", "Short, low-pressure activities to help you reset your focus."], ["Your rhythm", "Notice patterns in focus and build routines that feel sustainable."]],
    empty: "A gentle moment for you", emptyText: "Try one slow breath, relax your shoulders, and choose one small next step.", action: "Start check-in",
  },
  "ai-scheduler": {
    eyebrow: "Plan with less pressure", title: "AI Scheduler", intro: "Create a realistic plan that responds to your goals, time, and focus needs.",
    cards: [["Today", "See a clear, distraction-free view of your day."], ["Smart planning", "Break large goals into manageable sessions automatically."], ["Flexible routines", "Move unfinished tasks without guilt and rebalance your plan."]],
    empty: "Your schedule is clear", emptyText: "Add a goal and Nexora will suggest a comfortable first session.", action: "Add your first goal",
  },
};

export function FeatureDashboard({ section }) {
  const content = pageContent[section];
  const [data, setData] = useState(null);
  useEffect(() => { getDashboardSection(section).then(setData).catch(() => {}); }, [section]);

  return (
    <div className="dashboard dashboard--feature">
      <div className="container dashboard__inner">
        <header className="feature__header"><span className="eyebrow">{content.eyebrow}</span><h1>{data?.title || content.title}</h1><p>{data?.description || content.intro}</p></header>
        <section className="feature__grid">
          {content.cards.map(([title, text], index) => <article className="feature__card" key={title}><span>0{index + 1}</span><h2>{title}</h2><p>{text}</p></article>)}
        </section>
        <section className="feature__empty"><div className="feature__empty-mark">{section === "ai-scheduler" ? "AI" : section === "wellbeing" ? "WB" : "LS"}</div><div><h2>{content.empty}</h2><p>{content.emptyText}</p></div><button className="btn btn-primary" type="button">{content.action}</button></section>
      </div>
    </div>
  );
}
