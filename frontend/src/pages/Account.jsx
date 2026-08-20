import { useAuth } from "../context/AuthContext.jsx";
import "./Auth.css";

export default function Account() {
  const { user } = useAuth();

  return (
    <div className="auth">
      <section className="auth__card">
        <span className="eyebrow">Your account</span>
        <h1 className="auth__title">{user.full_name || "Nexora user"}</h1>
        <p className="auth__subtitle">You are signed in.</p>
        <dl className="account__details">
          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Member since</dt>
            <dd>{new Date(user.created_at).toLocaleDateString()}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
