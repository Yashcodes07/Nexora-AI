import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Auth.css";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const requestedPath = location.state?.from?.pathname;

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const currentUser = await login(form, remember);
      const destination = currentUser.learning_preferences?.neurodivergent_profiles?.length ? "/learning-space" : "/preferences";
      navigate(requestedPath || destination, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!loading && user) return <Navigate to={requestedPath || (user.learning_preferences ? "/learning-space" : "/preferences")} replace />;

  return (
    <div className="auth">
      <div className="auth__card">
        <span className="eyebrow">Welcome back</span>
        <h1 className="auth__title">Log in to Nexora AI</h1>
        <p className="auth__subtitle">Pick up right where you left off.</p>

        {error && <div className="auth__error" role="alert">{error}</div>}
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
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="auth__link">
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? "Logging in…" : "Log in"}
            </button>
          </form>

        <p className="auth__footer">
          Don&apos;t have an account? <Link to="/signup" state={location.state}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
