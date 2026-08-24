import { useEffect, useRef, useState } from "react";
import { getDashboardSection } from "../api/auth.js";
import "./Dashboard.css";
import "./LearningSpace.css";
import LearningModeSession from "./LearningModeSession.jsx";

const MODES = [
  ["viva", "Viva mode", "Practice answering questions aloud."],
  ["discussion", "GD mode", "Build confidence, reasoning, and communication."],
  ["test", "Test mode", "Test yourself, find gaps, and learn from mistakes."],
];

export default function LearningSpace() {
  const [prompt, setPrompt] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modes, setModes] = useState({ viva: false, discussion: false, test: false });
  const [notice, setNotice] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [sessionMode, setSessionMode] = useState(null);
  const [pendingMode, setPendingMode] = useState(null);
  const [modeTopic, setModeTopic] = useState("");
  const fileInput = useRef(null);
  const settings = useRef(null);

  useEffect(() => { getDashboardSection("learning-space").catch(() => {}); }, []);
  useEffect(() => {
    function closeSettings(event) {
      if (!settings.current?.contains(event.target)) setSettingsOpen(false);
    }
    document.addEventListener("mousedown", closeSettings);
    return () => document.removeEventListener("mousedown", closeSettings);
  }, []);

  function submitPrompt(event) {
    event.preventDefault();
    if (!prompt.trim() && !attachment) return;
    const activeMode = Object.entries(modes).find(([, enabled]) => enabled)?.[0];
    if (activeMode) { setSessionMode(activeMode); return; }
    const title = prompt.trim() || `Study ${attachment.name}`;
    const chat = { id: Date.now(), title, prompt };
    setChatHistory((current) => [chat, ...current]);
    setActiveChat(chat.id);
    setNotice("Your study request is ready. Connect your AI pipeline here to begin the conversation.");
  }

  function newChat() {
    setPrompt(""); setAttachment(null); setNotice(""); setActiveChat(null);
  }

  function closeMode() { setSessionMode(null); setPendingMode(null); setModes({ viva: false, discussion: false, test: false }); }
  if (sessionMode) return <LearningModeSession mode={sessionMode} topic={modeTopic || prompt.trim() || attachment?.name || "Your selected topic"} onExit={closeMode} onLearn={(revisionPrompt) => { setPrompt(revisionPrompt); closeMode(); }} />;

  return (
    <div className="dashboard learning-chat">
      {pendingMode && <div className="mode-setup" role="dialog" aria-modal="true"><form onSubmit={(event) => { event.preventDefault(); if (!modeTopic.trim()) return; setPrompt(modeTopic.trim()); setPendingMode(null); setSessionMode(pendingMode); }}><button className="mode-setup__close" type="button" onClick={closeMode}>×</button><span className="eyebrow">{pendingMode === "viva" ? "Viva mode" : pendingMode === "discussion" ? "Group discussion" : "Test mode"}</span><h2>What topic would you like to {pendingMode === "viva" ? "practise" : pendingMode === "discussion" ? "discuss" : "be tested on"}?</h2><p>{pendingMode === "viva" ? "Nexora will become your examiner and read each question aloud." : pendingMode === "discussion" ? "Nexora will create participants with different viewpoints." : "Nexora will create a focused test around your topic."}</p><input autoFocus value={modeTopic} onChange={(event) => setModeTopic(event.target.value)} placeholder="Enter a topic" /><button className="btn btn-primary" type="submit" disabled={!modeTopic.trim()}>Continue →</button></form></div>}
      <div className="learning-chat__orb learning-chat__orb--one" aria-hidden="true" />
      <div className="learning-chat__orb learning-chat__orb--two" aria-hidden="true" />
      <div className={`learning-chat__layout ${historyOpen ? "has-history" : "history-collapsed"}`}>
        {!historyOpen && <button className="history-toggle" type="button" onClick={() => setHistoryOpen(true)} aria-label="Open chat history"><span /><span /><span /></button>}
        <aside className={`chat-history ${historyOpen ? "is-open" : ""}`}>
          <button className="chat-history__close" type="button" onClick={() => setHistoryOpen(false)} aria-label="Close chat history"><span /><span /><span /></button>
          <button className="chat-history__new" type="button" onClick={newChat}><span>+</span> New chat</button>
          <label className="chat-history__search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></svg>
            <input type="search" placeholder="Search chats" aria-label="Search chat history" />
          </label>
          <div className="chat-history__list">
            <span className="chat-history__label">Recent</span>
            {chatHistory.length === 0 ? <div className="chat-history__empty"><span>N</span><p>Your study conversations will appear here.</p></div> : chatHistory.map((chat) => <button type="button" className={activeChat === chat.id ? "is-active" : ""} key={chat.id} onClick={() => { setActiveChat(chat.id); setPrompt(chat.prompt); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15a3 3 0 0 1-3 3H8l-4 3V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3Z" /></svg><span>{chat.title}</span></button>)}
          </div>
          <div className="chat-history__footer"><span>History is stored here after you start a session.</span></div>
        </aside>
        <main className="learning-chat__inner">
        <header className="learning-chat__header">
          <span className="eyebrow">Learn anything, your way</span>
          <h1>What do you want to<br /><em>study today?</em></h1>
          <p>Ask a question or attach material. Learn one step at a time.</p>
        </header>

        <div className="learning-chat__suggestions">
          <span>Try asking</span>
          {["Explain a difficult concept", "Make a study plan", "Quiz me from my notes"].map((text) => <button type="button" key={text} onClick={() => setPrompt(text)}>{text}</button>)}
        </div>

        <form className="composer" onSubmit={submitPrompt}>
          <textarea
            value={prompt}
            onChange={(event) => { setPrompt(event.target.value); setNotice(""); }}
            placeholder="Ask Nexora to explain a topic, create a study plan, or help with an assignment..."
            aria-label="What do you want to study?"
            rows="4"
          />
          {attachment && <div className="composer__file"><span>DOC</span><div><strong>{attachment.name}</strong><small>{Math.max(1, Math.round(attachment.size / 1024))} KB</small></div><button type="button" aria-label="Remove attachment" onClick={() => setAttachment(null)}>×</button></div>}
          <div className="composer__toolbar">
            <div className="composer__tools">
              <input ref={fileInput} type="file" hidden accept=".pdf,.doc,.docx,.txt,.ppt,.pptx" onChange={(event) => setAttachment(event.target.files[0] || null)} />
              <button className="icon-button" type="button" onClick={() => fileInput.current?.click()} aria-label="Attach a study document" title="Attach document">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
              </button>
              <div className="mode-settings" ref={settings}>
                <button className={`icon-button ${settingsOpen ? "is-active" : ""}`} type="button" onClick={() => setSettingsOpen((open) => !open)} aria-label="Study mode settings" aria-expanded={settingsOpen} title="Study modes">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.6-1H3v-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88L4.2 7.06l2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6V3h4v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.6 1h.09v4H21a1.7 1.7 0 0 0-1.6 1Z" /></svg>
                </button>
                {settingsOpen && <div className="mode-menu">
                  <div className="mode-menu__header"><div><strong>Study modes</strong><span>Shape your learning session</span></div></div>
                  {MODES.map(([key, label, description]) => <div className="mode-menu__item" key={key}><div><strong>{label}</strong><p>{description}</p></div><button type="button" className={`switch ${modes[key] ? "is-on" : ""}`} onClick={() => { const enabling = !modes[key]; setModes({ viva: false, discussion: false, test: false, [key]: enabling }); setSettingsOpen(false); setModeTopic(prompt.trim()); if (enabling) setPendingMode(key); }} role="switch" aria-checked={modes[key]}><span /></button></div>)}
                </div>}
              </div>
              <span className="composer__hint">Attach notes or choose a study mode</span>
            </div>
            <button className="composer__send" type="submit" disabled={!prompt.trim() && !attachment} aria-label="Send study request">
              <span>Start learning</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 14-7-4 14-3-6-7-1Z" /></svg>
            </button>
          </div>
        </form>
        {notice && <div className="learning-chat__notice" role="status">{notice}</div>}

        </main>
      </div>
    </div>
  );
}
