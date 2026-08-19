import { useState } from "react";
import { Link } from "react-router-dom";
import "./Auth.css";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="auth">
      <div className="auth__card">
        <span className="eyebrow">Welcome back</span>
        <h1 className="auth__title">Log in to Nexora AI</h1>
        <p className="auth__subtitle">Pick up right where you left off.</p>

        {submitted ? (
          <div className="auth__success">
            This is a UI preview, no account was created or signed in. Wire this form up to your
            auth API when you're ready.
          </div>
        ) : (
          <form className="auth__form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
              />
            </label>

            <div className="auth__row">
              <label className="checkbox">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#forgot" className="auth__link">
                Forgot password?
              </a>
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              Log in
            </button>
          </form>
        )}

        <p className="auth__footer">
          Don&apos;t have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
