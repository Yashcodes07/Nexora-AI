import { useState } from "react";
import { Link } from "react-router-dom";
import "./Auth.css";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
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
        <span className="eyebrow">Get started</span>
        <h1 className="auth__title">Create your account</h1>
        <p className="auth__subtitle">Free to start, no credit card required.</p>

        {submitted ? (
          <div className="auth__success">
            This is a UI preview, no account was created. Wire this form up to your auth API when
            you're ready.
          </div>
        ) : (
          <form className="auth__form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Full name</span>
              <input
                type="text"
                name="name"
                required
                placeholder="Alex Rivera"
                value={form.name}
                onChange={handleChange}
              />
            </label>

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
                placeholder="At least 8 characters"
                value={form.password}
                onChange={handleChange}
              />
            </label>

            <button type="submit" className="btn btn-primary btn-block">
              Create account
            </button>
          </form>
        )}

        <p className="auth__footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
