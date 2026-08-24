import { useAuth } from "../context/AuthContext.jsx";
import { PREFERENCE_QUESTIONS, preferenceLabel } from "../data/preferences.js";
import "./Auth.css";
import "./Dashboard.css";

export default function Account() {
  const { user } = useAuth();

  return (
    <div className="dashboard dashboard--feature">
      <section className="container dashboard__inner account__card">
        <div className="account__hero"><div className="account__avatar">{(user.full_name || user.email)[0].toUpperCase()}</div><div><span className="eyebrow">Your profile</span><h1 className="auth__title">{user.full_name || "Nexora user"}</h1><p>Account details, login information, and personal learning preferences.</p></div></div>
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
        <div className="account__preferences">
          <div className="account__preferences-heading">
            <h2>Learning preferences</h2>
            <a className="btn btn-ghost account__edit" href="/settings#learning">Change preferences</a>
          </div>
          {PREFERENCE_QUESTIONS.map((question) => {
            const answer = user.learning_preferences?.[question.key];
            const values = Array.isArray(answer) ? answer : answer ? [answer] : [];
            return (
              <div className="account__preference" key={question.key}>
                <h3>{question.title}</h3>
                <p>{values.length ? values.map(preferenceLabel).join(", ") : "Skipped"}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
