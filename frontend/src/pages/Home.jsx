import { Link } from "react-router-dom";
import "./Home.css";

const EXPERIENCES = [
  { number: "01", label: "Adaptive learning", title: "Learn in the way your mind works.", body: "Nexora adapts explanations, practice and visual thinking tools to your pace and learning preferences.", to: "/learning-space", action: "Explore Learning Space", icon: "spark" },
  { number: "02", label: "Mindful wellbeing", title: "Notice patterns before they become pressure.", body: "Check in, reflect and build healthier rhythms with a private space designed around your wellbeing.", to: "/wellbeing", action: "Discover Wellbeing", icon: "wave" },
  { number: "03", label: "Intelligent planning", title: "Turn your priorities into a realistic day.", body: "Let your AI scheduler shape focused, balanced plans around your energy, goals and available time.", to: "/ai-scheduler", action: "Meet AI Scheduler", icon: "orbit" },
];

const Brain = () => (
  <div className="brain-stage" aria-hidden="true">
    <div className="brain-stage__halo" />
    <img className="brain-stage__brand" src="/nexora-mark.png" alt="" />
    <svg className="brain" viewBox="0 0 620 560" fill="none">
      <defs>
        <linearGradient id="brainStroke" x1="102" y1="90" x2="520" y2="482" gradientUnits="userSpaceOnUse"><stop stopColor="#f4c091" /><stop offset=".48" stopColor="#df8d55" /><stop offset="1" stopColor="#91ab9b" /></linearGradient>
        <radialGradient id="brainFill" cx="0" cy="0" r="1" gradientTransform="translate(292 245) rotate(48) scale(300)"><stop stopColor="#d98a54" stopOpacity=".16" /><stop offset="1" stopColor="#688678" stopOpacity=".02" /></radialGradient>
        <filter id="nodeGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <path className="brain__silhouette" d="M304 105c-25-35-85-34-110 7-39-8-76 28-67 69-41 21-51 78-19 111-18 42 8 91 52 97 9 47 60 67 97 42 14 13 30 20 47 22V105Z" fill="url(#brainFill)" />
      <path className="brain__silhouette brain__silhouette--right" d="M316 105c25-35 85-34 110 7 39-8 76 28 67 69 41 21 51 78 19 111 18 42-8 91-52 97-9 47-60 67-97 42-14 13-30 20-47 22V105Z" fill="url(#brainFill)" />
      <g className="brain__outline"><path d="M304 109c-24-38-83-40-110 2-42-7-77 31-66 72-42 20-50 76-20 109-20 43 9 92 52 97 8 45 58 68 97 41 14 14 29 21 47 23" /><path d="M316 109c24-38 83-40 110 2 42-7 77 31 66 72 42 20 50 76 20 109 20 43-9 92-52 97-8 45-58 68-97 41-14 14-29 21-47 23" /><path d="M310 100v365" /></g>
      <g className="brain__folds">
        <path d="M193 112c-1 25 17 36 38 39 30 4 40 28 31 52" /><path d="M129 184c18-7 43-2 53 17 8 15 3 32-10 43" /><path d="M111 292c21-21 58-14 68 12 7 18 0 39-17 49" /><path d="M162 389c17-18 44-19 62-4 14 12 17 32 8 48" /><path d="M220 226c-20 7-30 28-23 47 6 17 22 26 39 25 25-2 42 18 40 40" /><path d="M272 119c-14 18-11 43 7 57 9 7 19 9 29 8" /><path d="M267 420c14-16 18-35 7-52" />
        <path d="M427 112c1 25-17 36-38 39-30 4-40 28-31 52" /><path d="M491 184c-18-7-43-2-53 17-8 15-3 32 10 43" /><path d="M509 292c-21-21-58-14-68 12-7 18 0 39 17 49" /><path d="M458 389c-17-18-44-19-62-4-14 12-17 32-8 48" /><path d="M400 226c20 7 30 28 23 47-6 17-22 26-39 25-25-2-42 18-40 40" /><path d="M348 119c14 18 11 43-7 57-9 7-19 9-29 8" /><path d="M353 420c-14-16-18-35-7-52" />
      </g>
      <g className="brain__network"><path d="M157 250 231 184 310 244 388 176 464 252" /><path d="M157 250 226 334 310 244 398 340 464 252" /><path d="M226 334 278 403M398 340l-55 67M231 184l42-53M388 176l-42-45" /></g>
      <g className="brain__nodes" filter="url(#nodeGlow)">{[[157,250],[231,184],[310,244],[388,176],[464,252],[226,334],[398,340],[278,403],[343,407],[273,131],[346,131]].map(([cx, cy], i) => <circle key={`${cx}-${cy}`} className={`brain__node brain__node--${(i % 4) + 1}`} cx={cx} cy={cy} r={i === 2 ? 6 : 4} />)}</g>
    </svg>
    <div className="brain-stage__tag brain-stage__tag--one"><span />Learns with you</div><div className="brain-stage__tag brain-stage__tag--two"><span />Plans around you</div><div className="brain-stage__tag brain-stage__tag--three"><span />Looks after you</div>
  </div>
);

export default function Home() {
  return <div className="home">
    <section className="home-hero"><div className="home-hero__ambient" aria-hidden="true" /><div className="container home-hero__inner">
      <div className="home-hero__copy"><div className="home-hero__eyebrow"><span /> Your space to learn, plan and grow</div><h1>Intelligence that<br /><em>understands you.</em></h1><p>Nexora AI brings learning, wellbeing and planning into one adaptive space—built around the way you think and the life you’re creating.</p><div className="home-hero__actions"><Link to="/signup" className="btn btn-primary home-hero__primary">Start your journey <span aria-hidden="true">→</span></Link><Link to="/about" className="home-hero__link">See how Nexora works <span aria-hidden="true">↗</span></Link></div></div><Brain />
    </div><a href="#experiences" className="home-hero__scroll" aria-label="Scroll to explore"><span /> Explore</a></section>
    <section className="home-intro" id="experiences"><div className="container home-intro__grid"><span className="home-kicker">Designed around you</span><div><h2>Not another tool.<br />A more thoughtful way forward.</h2><p>Every part of Nexora works together to understand your preferences, support your momentum and help you make space for what matters.</p><div className="home-intro__signals" aria-hidden="true"><span>Learn</span><i /><span>Plan</span><i /><span>Grow</span></div></div></div></section>
    <section className="home-experiences"><div className="container experience-grid">{EXPERIENCES.map(item => <article className="experience-card" key={item.number}><div className={`experience-card__art experience-card__art--${item.icon}`} aria-hidden="true"><i /><i /><i /></div><div className="experience-card__meta"><span>{item.number}</span>{item.label}</div><h3>{item.title}</h3><p>{item.body}</p><Link to={item.to}>{item.action} <span>→</span></Link></article>)}</div></section>
    <section className="home-manifesto"><div className="container home-manifesto__inner"><span className="home-kicker">One connected intelligence</span><blockquote>“The best technology doesn’t ask you to adapt to it. <em>It adapts to you.</em>”</blockquote><Link to="/signup" className="btn btn-primary">Create your Nexora space <span>→</span></Link></div></section>
  </div>;
}
