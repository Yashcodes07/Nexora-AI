import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/auth.js";
import "./Auth.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState(token ? "" : "This password reset link is invalid.");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const result = await resetPassword(token, form.password);
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
        <h1 className="auth__title">Choose a new password</h1>
        <p className="auth__subtitle">Reset links expire after 30 minutes and work only once.</p>

        {error && <div className="auth__error" role="alert">{error}</div>}
        {message ? (
          <>
            <div className="auth__success" role="status">{message}</div>
            <Link to="/login" className="btn btn-primary btn-block auth__next">Log in</Link>
          </>
        ) : (
          <form className="auth__form" onSubmit={handleSubmit}>
            <label className="field">
              <span>New password</span>
              <input
                type="password"
                name="password"
                required
                minLength="8"
                maxLength="128"
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
              />
            </label>
            <label className="field">
              <span>Confirm new password</span>
              <input
                type="password"
                name="confirmPassword"
                required
                minLength="8"
                maxLength="128"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={handleChange}
              />
            </label>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting || !token}>
              {submitting ? "Resetting password…" : "Reset password"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
