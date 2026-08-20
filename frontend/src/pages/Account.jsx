import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { PREFERENCE_QUESTIONS, preferenceLabel } from "../data/preferences.js";
import LearningPreferences from "./LearningPreferences.jsx";
import "./Auth.css";

export default function Account() {
  const { user } = useAuth();
  const [editingPreferences, setEditingPreferences] = useState(false);

  if (
    !user.learning_preferences
    || !user.learning_preferences.neurodivergent_profiles?.length
  ) {
    return <LearningPreferences initialPreferences={user.learning_preferences} />;
  }
  if (editingPreferences) {
    return (
      <LearningPreferences
        initialPreferences={user.learning_preferences}
        onCancel={() => setEditingPreferences(false)}
      />
    );
  }

  return (
    <div className="auth">
      <section className="auth__card account__card">
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
        <div className="account__preferences">
          <div className="account__preferences-heading">
            <h2>Learning preferences</h2>
            <button
              type="button"
              className="btn btn-ghost account__edit"
              onClick={() => setEditingPreferences(true)}
            >
              Change preferences
            </button>
          </div>
          {PREFERENCE_QUESTIONS.map((question) => {
            const answer = user.learning_preferences[question.key];
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
