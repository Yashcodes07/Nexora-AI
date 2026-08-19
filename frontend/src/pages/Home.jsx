import { Link } from "react-router-dom";
import "./Home.css";

const FEATURES = [
  {
    title: "Instant answers",
    body: "Ask in plain language and get grounded, well-reasoned responses in seconds.",
  },
  {
    title: "Works with your data",
    body: "Connect documents and tools so every answer reflects your actual context.",
  },
  {
    title: "Built for teams",
    body: "Share workspaces, review history, and keep everyone working from one source of truth.",
  },
  {
    title: "Private by design",
    body: "Your data stays yours. Nothing is used to train models without your say.",
  },
];

const STEPS = [
  { n: "01", title: "Connect", body: "Link the tools and files your team already works in." },
  { n: "02", title: "Ask", body: "Describe what you need in your own words, no prompts to memorize." },
  { n: "03", title: "Ship", body: "Take the output straight into your workflow and move on." },
];

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero__glow" aria-hidden="true" />
        <div className="container hero__inner">
          <div className="hero__copy">
            <span className="eyebrow">Nexora AI</span>
            <h1 className="hero__title">
              Clarity, on demand.
            </h1>
            <p className="hero__subtitle">
              Nexora AI turns scattered questions and messy context into clear, dependable
              answers, so your team spends less time searching and more time deciding.
            </p>
            <div className="hero__cta">
              <Link to="/signup" className="btn btn-primary">
                Get started free
              </Link>
              <Link to="/about" className="btn btn-outline">
                See how it works
              </Link>
            </div>
          </div>

          <div className="hero__visual" aria-hidden="true">
            <svg className="branch-art" viewBox="0 0 360 360" fill="none">
              <path
                className="branch-line branch-line--1"
                d="M180 330 C180 260 150 240 150 190 C150 150 175 140 175 100 C175 70 155 55 155 30"
                stroke="url(#branchGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                className="branch-line branch-line--2"
                d="M180 300 C180 250 220 235 222 195 C224 160 205 145 210 110"
                stroke="url(#branchGrad)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                className="branch-line branch-line--3"
                d="M150 190 C120 180 105 195 80 185"
                stroke="url(#branchGrad)"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
              <path
                className="branch-line branch-line--4"
                d="M222 195 C250 188 262 200 288 192"
                stroke="url(#branchGrad)"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
              <circle className="branch-dot branch-dot--1" cx="155" cy="30" r="6" />
              <circle className="branch-dot branch-dot--2" cx="210" cy="110" r="4.5" />
              <circle className="branch-dot branch-dot--3" cx="80" cy="185" r="4.5" />
              <circle className="branch-dot branch-dot--4" cx="288" cy="192" r="4.5" />
              <circle className="branch-dot branch-dot--5" cx="180" cy="330" r="7" />
              <defs>
                <linearGradient id="branchGrad" x1="60" y1="30" x2="300" y2="330" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#e2a06a" />
                  <stop offset="1" stopColor="#8fa397" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section__title">Everything you need, none of the clutter</h2>
          <p className="section__subtitle">
            A focused set of tools that stay out of your way until you need them.
          </p>

          <div className="feature-grid">
            {FEATURES.map((f) => (
              <div className="feature-card" key={f.title}>
                <div className="feature-card__icon" />
                <h3 className="feature-card__title">{f.title}</h3>
                <p className="feature-card__body">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--muted">
        <div className="container">
          <h2 className="section__title">Up and running in three steps</h2>

          <div className="steps">
            {STEPS.map((s) => (
              <div className="step" key={s.n}>
                <span className="step__n">{s.n}</span>
                <h3 className="step__title">{s.title}</h3>
                <p className="step__body">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container cta-band">
          <div>
            <h2 className="section__title" style={{ marginBottom: 8 }}>
              Ready to try Nexora AI?
            </h2>
            <p className="section__subtitle" style={{ margin: 0 }}>
              Create a free account, no credit card required.
            </p>
          </div>
          <Link to="/signup" className="btn btn-primary">
            Create free account
          </Link>
        </div>
      </section>
    </div>
  );
}