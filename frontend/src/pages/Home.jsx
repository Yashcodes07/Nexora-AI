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
            <div className="orbit orbit--outer">
              <span className="node node--1" />
              <span className="node node--2" />
              <span className="node node--3" />
            </div>
            <div className="orbit orbit--inner">
              <span className="node node--4" />
              <span className="node node--5" />
            </div>
            <div className="core" />
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
