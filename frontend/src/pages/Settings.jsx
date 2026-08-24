import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import LearningPreferences from "./LearningPreferences.jsx";
import "./Dashboard.css";
import "./Settings.css";

export default function Settings() {
  const { user, updateAccount } = useAuth();
  const [name, setName] = useState(user.full_name || "");
  const [password, setPassword] = useState("");
  const [editingPreferences, setEditingPreferences] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function saveProfile(event) {
    event.preventDefault(); setError(""); setMessage("");
    try { await updateAccount({ full_name: name }); setMessage("Profile updated."); }
    catch (err) { setError(err.message); }
  }

  async function changePassword(event) {
    event.preventDefault(); setError(""); setMessage("");
    try { await updateAccount({ password }); setPassword(""); setMessage("Password updated securely."); }
    catch (err) { setError(err.message); }
  }

  if (editingPreferences) return <LearningPreferences initialPreferences={user.learning_preferences} onCancel={() => setEditingPreferences(false)} />;

  return <div className="dashboard dashboard--feature"><div className="container dashboard__inner settings">
    <header className="feature__header"><span className="eyebrow">Make Nexora yours</span><h1>Settings</h1><p>Manage your account, security, and the way Nexora adapts to you.</p></header>
    {(message || error) && <div className={error ? "settings__notice settings__notice--error" : "settings__notice"}>{error || message}</div>}
    <div className="settings__grid">
      <aside className="settings__menu"><a href="#profile" className="is-active">Profile</a><a href="#learning">Learning preferences</a><a href="#security">Login & security</a><a href="#accessibility">Accessibility</a></aside>
      <div className="settings__content">
        <section id="profile" className="settings__section"><div><h2>Profile information</h2><p>Update the name shown across your Nexora experience.</p></div><form onSubmit={saveProfile}><label className="field"><span>Full name</span><input value={name} onChange={(event) => setName(event.target.value)} /></label><label className="field"><span>Email address</span><input value={user.email} disabled /></label><button className="btn btn-primary" type="submit">Save profile</button></form></section>
        <section id="learning" className="settings__section"><div><h2>Learning preferences</h2><p>Control content detail, focus support, explanations, and accessibility preferences.</p></div><button className="btn btn-outline" type="button" onClick={() => setEditingPreferences(true)}>Review preferences</button></section>
        <section id="security" className="settings__section"><div><h2>Login & security</h2><p>Use at least eight characters for a strong new password.</p></div><form onSubmit={changePassword}><label className="field"><span>New password</span><input type="password" minLength="8" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter a new password" /></label><button className="btn btn-outline" type="submit">Change password</button></form></section>
        <section id="accessibility" className="settings__section"><div><h2>Accessibility</h2><p>Nexora follows your system settings for reduced motion and supports keyboard navigation throughout.</p></div><div className="settings__status"><span>System preferences</span><strong>Enabled</strong></div></section>
      </div>
    </div>
  </div></div>;
}
