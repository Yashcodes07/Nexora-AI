import { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../api/auth.js";
import "./Auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await requestPasswordReset(email);
      setMessage(result.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth">
      <section className="auth__card">
        <span className="eyebrow">Account recovery</span>
        <h1 className="auth__title">Forgot your password?</h1>
        <p className="auth__subtitle">
          Enter your email and we’ll send you a secure reset link.
        </p>

        {error && <div className="auth__error" role="alert">{error}</div>}
        {message ? (
          <div className="auth__success" role="status">
            {message}
            <span className="auth__demo-hint">
              For this demo, open the email inbox at <a href="http://localhost:8025" target="_blank" rel="noreferrer">localhost:8025</a>.
            </span>
          </div>
        ) : (
          <form className="auth__form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? "Sending reset link…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="auth__footer">
          Remembered your password? <Link to="/login">Back to login</Link>
        </p>
      </section>
    </div>
  );
}
