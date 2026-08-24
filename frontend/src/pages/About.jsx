import { Link } from "react-router-dom";
import "./About.css";

const PRINCIPLES = [
  { n: "01", title: "Personal by design", body: "Nexora learns how you prefer to think, work and recharge—then shapes every interaction around you.", symbol: "✦" },
  { n: "02", title: "Calm, not cluttered", body: "Technology should create headspace. Every screen is considered, focused and intentionally simple.", symbol: "◌" },
  { n: "03", title: "Private at the core", body: "Your thoughts, goals and personal patterns belong to you. Trust is a product feature, not fine print.", symbol: "◇" },
];
const PILLARS = [
  { label: "Learn", text: "Knowledge shaped to your pace", className: "learn" },
  { label: "Plan", text: "Time shaped to your priorities", className: "plan" },
  { label: "Grow", text: "Wellbeing shaped to your life", className: "grow" },
];

export default function About() {
  return <div className="about-page">
    <section className="about-hero"><div className="about-hero__light" aria-hidden="true" /><div className="container about-hero__inner">
      <div className="about-hero__copy"><span className="about-kicker"><i /> About Nexora</span><h1>Technology should feel<br />more <em>human.</em></h1><p>We’re building an intelligence that understands the whole person—not just the next task. One thoughtful space for learning, planning and becoming.</p><a href="#story" className="about-hero__explore">Our story <span>↓</span></a></div>
      <div className="about-orbit" aria-hidden="true"><div className="about-orbit__ring about-orbit__ring--one" /><div className="about-orbit__ring about-orbit__ring--two" /><div className="about-orbit__ring about-orbit__ring--three" /><div className="about-orbit__core"><span>N</span><small>adaptive<br />intelligence</small></div><div className="about-orbit__sat about-orbit__sat--learn"><i />Learn</div><div className="about-orbit__sat about-orbit__sat--plan"><i />Plan</div><div className="about-orbit__sat about-orbit__sat--grow"><i />Grow</div></div>
    </div></section>
    <section className="about-story" id="story"><div className="container about-story__grid"><div className="about-story__index">01 <span /></div><div className="about-story__content"><span className="about-kicker">Why we exist</span><h2>Life doesn’t happen in separate tabs.</h2><p className="about-story__lead">The way you learn affects how you plan. The way you plan affects how you feel. Yet most technology treats every part of your life as a separate problem.</p><div className="about-story__columns"><p>Nexora began with a different idea: what if one intelligence could understand these connections? Not to run your life, but to help you move through it with more clarity and intention.</p><p>That means adapting to your learning style, respecting your energy, and helping turn your goals into days that feel genuinely possible.</p></div></div></div></section>
    <section className="about-system"><div className="container"><div className="about-system__heading"><span className="about-kicker">One connected system</span><h2>Three sides of a fuller life.</h2></div><div className="about-pillars">{PILLARS.map((item, index) => <div className={`about-pillar about-pillar--${item.className}`} key={item.label}><span className="about-pillar__number">0{index + 1}</span><div className="about-pillar__shape"><i /><i /></div><h3>{item.label}</h3><p>{item.text}</p></div>)}</div></div></section>
    <section className="about-principles"><div className="container"><div className="about-principles__head"><div><span className="about-kicker">What guides us</span><h2>Built on quiet principles.</h2></div><p>The choices behind Nexora are as important as the intelligence within it.</p></div><div className="about-principles__grid">{PRINCIPLES.map(item => <article className="about-principle" key={item.n}><div className="about-principle__top"><span>{item.n}</span><i>{item.symbol}</i></div><h3>{item.title}</h3><p>{item.body}</p></article>)}</div></div></section>
    <section className="about-closing"><div className="about-closing__orb" aria-hidden="true" /><div className="container about-closing__inner"><span className="about-kicker">The next chapter is yours</span><h2>A more thoughtful relationship<br />with technology starts here.</h2><p>Bring your goals, your curiosity, and your beautifully human way of thinking.</p><Link to="/signup" className="btn btn-primary">Begin with Nexora <span>→</span></Link></div></section>
  </div>;
}
