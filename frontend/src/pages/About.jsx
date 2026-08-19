import "./About.css";

const VALUES = [
  { title: "Clarity first", body: "We'd rather ship a plain answer than a clever one that confuses." },
  { title: "Respect your data", body: "You control what's connected, and you can disconnect at any time." },
  { title: "Built to last", body: "Steady, dependable tooling instead of features chasing a trend." },
];

export default function About() {
  return (
    <div className="about">
      <section className="about__hero">
        <div className="container">
          <span className="eyebrow">About Nexora AI</span>
          <h1 className="about__title">Software that gets out of the way</h1>
          <p className="about__lede">
            Nexora AI started as a small internal tool for cutting through repetitive research and
            reporting work. We kept it because it made the difference between a slow afternoon and
            a finished task, so we built it into something anyone can use.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container about__grid">
          <div>
            <h2 className="about__h2">What we're building</h2>
            <p className="about__p">
              Most tools ask you to change how you work. Nexora AI is built to fit into the tools
              you already use, connect to the context you already have, and answer in plain
              language, so the output is something you can act on immediately.
            </p>
          </div>
          <div>
            <h2 className="about__h2">Where we're headed</h2>
            <p className="about__p">
              We're focused on making Nexora AI faster, more accurate, and easier to trust,
              one release at a time. No sprawling feature list, just a tool that keeps getting
              better at the job it already does.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--muted">
        <div className="container">
          <h2 className="section__title">What we care about</h2>
          <div className="values-grid">
            {VALUES.map((v) => (
              <div className="value-card" key={v.title}>
                <h3>{v.title}</h3>
                <p>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
