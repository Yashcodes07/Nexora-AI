import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Auth.css";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user, loading, signup } = useAuth();
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
      await signup({ full_name: form.name, email: form.email, password: form.password });
      navigate(requestedPath || "/preferences", { replace: true });
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
        <span className="eyebrow">Get started</span>
        <h1 className="auth__title">Create your account</h1>
        <p className="auth__subtitle">Free to start, no credit card required.</p>

        {error && <div className="auth__error" role="alert">{error}</div>}
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

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </form>

        <p className="auth__footer">
          Already have an account? <Link to="/login" state={location.state}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
