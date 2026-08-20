import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { PREFERENCE_QUESTIONS } from "../data/preferences.js";
import "./Auth.css";

const INITIAL_PREFERENCES = {
  learning_methods: [],
  content_amount: "",
  focus_support: [],
  difficulty_strategy: "",
  avoidances: [],
  neurodivergent_profiles: [],
};

export default function LearningPreferences({ initialPreferences = null, onCancel = null }) {
  const [preferences, setPreferences] = useState(() =>
    initialPreferences
      ? { ...INITIAL_PREFERENCES, ...initialPreferences }
      : INITIAL_PREFERENCES
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { saveLearningPreferences } = useAuth();

  function selectSingle(key, value) {
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  function selectSingleArray(key, value) {
    setPreferences((current) => ({ ...current, [key]: [value] }));
  }

  function toggleMulti(question, value) {
    setPreferences((current) => {
      const selected = current[question.key];
      if (selected.includes(value)) {
        return { ...current, [question.key]: selected.filter((item) => item !== value) };
      }

      if (question.exclusive) {
        if (question.exclusive.includes(value)) {
          return { ...current, [question.key]: [value] };
        }
        return {
          ...current,
          [question.key]: [
            ...selected.filter((item) => !question.exclusive.includes(item)),
            value,
          ],
        };
      }

      if (question.key === "avoidances") {
        if (value === "nothing_specific") return { ...current, avoidances: [value] };
        return {
          ...current,
          avoidances: [...selected.filter((item) => item !== "nothing_specific"), value],
        };
      }

      if (question.max && selected.length >= question.max) return current;
      return { ...current, [question.key]: [...selected, value] };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const incomplete = PREFERENCE_QUESTIONS.some((question) => {
      const answer = preferences[question.key];
      return Array.isArray(answer) ? answer.length === 0 : !answer;
    });
    if (incomplete) {
      setError("Please answer all five questions before continuing.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await saveLearningPreferences(preferences);
      onCancel?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth preferences">
      <section className="auth__card preferences__card">
        <span className="eyebrow">Learning preferences</span>
        <h1 className="auth__title">
          {initialPreferences ? "Update how you learn" : "Help Nexora teach your way"}
        </h1>
        <p className="auth__subtitle">
          Choose what works best for you. These preferences will shape future explanations.
        </p>

        {error && <div className="auth__error" role="alert">{error}</div>}

        <form className="preferences__form" onSubmit={handleSubmit}>
          {PREFERENCE_QUESTIONS.map((question, index) => (
            <fieldset className="preferences__question" key={question.key}>
              <legend>
                <span className="preferences__number">{index + 1}</span>
                <span>{question.title}</span>
                <span className="preferences__hint">({question.hint})</span>
              </legend>
              {question.description && (
                <p className="preferences__description">{question.description}</p>
              )}
              <div className="preferences__options">
                {question.options.map(([value, label]) => {
                  const answer = preferences[question.key];
                  const selected = Array.isArray(answer) ? answer.includes(value) : answer === value;
                  return (
                    <button
                      type="button"
                      key={value}
                      className={`preferences__option ${selected ? "is-selected" : ""}`}
                      aria-pressed={selected}
                      onClick={() => {
                        if (question.type === "single") selectSingle(question.key, value);
                        else if (question.type === "single_array") {
                          selectSingleArray(question.key, value);
                        } else toggleMulti(question, value);
                      }}
                    >
                      <span>{label}</span>
                      <span className="preferences__check" aria-hidden="true">{selected ? "✓" : ""}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <div className="preferences__actions">
            {onCancel && (
              <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={submitting}>
                Cancel
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting
                ? "Saving preferences…"
                : initialPreferences ? "Save changes" : "Save and continue"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
