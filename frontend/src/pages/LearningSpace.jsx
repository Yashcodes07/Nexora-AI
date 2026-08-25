import { useEffect, useRef, useState } from "react";
import { getDashboardSection } from "../api/auth.js";
import "./Dashboard.css";
import "./LearningSpace.css";
import LearningModeSession from "./LearningModeSession.jsx";
import { analyzeLearningVisual, streamLearningChat } from "../api/ai.js";
import { useAuth } from "../context/AuthContext.jsx";
import AdaptiveAnswer from "../components/AdaptiveAnswer.jsx";
import { sanitizeSpeechText, speechEnabled } from "../utils/speech.js";
import DeepFocus from "../components/DeepFocus.jsx";

const MODES = [
  ["viva", "Viva mode", "Practice answering questions aloud."],
  ["discussion", "GD mode", "Build confidence, reasoning, and communication."],
  ["test", "Test mode", "Test yourself, find gaps, and learn from mistakes."],
];

const RESPONSE_FORMATS = [
  ["visual", "Visual explanation", "Interactive diagram, timeline, graph, or algorithm."],
  ["short_text", "Short text", "A concise answer in small sections."],
  ["speech", "Listen aloud", "A natural spoken explanation, like Viva mode."],
  ["step_by_step", "Step by step", "One clear idea or action at a time."],
  ["preferences", "Use my preferences", "Let Nexora use your saved learning choices."],
];

export default function LearningSpace() {
  const { user } = useAuth();
  const historyStorageKey = `nexora-learning-history:${user?.id || "guest"}`;
  const savedHistory = (() => {
    try { return JSON.parse(localStorage.getItem(historyStorageKey) || "[]"); }
    catch { return []; }
  })();
  const [prompt, setPrompt] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modes, setModes] = useState({ viva: false, discussion: false, test: false });
  const [focusMode, setFocusMode] = useState(() => localStorage.getItem(`nexora-focus-active:${user?.id || "guest"}`) === "true");
  const [notice, setNotice] = useState("");
  const [chatHistory, setChatHistory] = useState(savedHistory);
  const [activeChat, setActiveChat] = useState(savedHistory[0]?.id || null);
  const [chatMessages, setChatMessages] = useState(savedHistory[0]?.messages || []);
  const [sending, setSending] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [sessionMode, setSessionMode] = useState(null);
  const [pendingMode, setPendingMode] = useState(null);
  const [modeTopic, setModeTopic] = useState("");
  const [queuedPrompt, setQueuedPrompt] = useState(null);
  const fileInput = useRef(null);
  const settings = useRef(null);

  useEffect(() => { getDashboardSection("learning-space").catch(() => {}); }, []);
  useEffect(() => {
    localStorage.setItem(historyStorageKey, JSON.stringify(chatHistory));
  }, [chatHistory, historyStorageKey]);
  useEffect(() => {
    function closeSettings(event) {
      if (!settings.current?.contains(event.target)) setSettingsOpen(false);
    }
    document.addEventListener("mousedown", closeSettings);
    return () => document.removeEventListener("mousedown", closeSettings);
  }, []);
  useEffect(() => {
    localStorage.setItem(`nexora-focus-active:${user?.id || "guest"}`, String(focusMode));
    document.body.classList.toggle("focus-mode-active", focusMode);
    if (!focusMode || !window.speechSynthesis || !speechEnabled()) return () => document.body.classList.remove("focus-mode-active");
    window.speechSynthesis.cancel();
    const announcement = new SpeechSynthesisUtterance("You have entered focus mode. This helps you learn with maximum attention");
    announcement.rate = 0.88;
    announcement.pitch = 1;
    window.speechSynthesis.speak(announcement);
    return () => { window.speechSynthesis.cancel(); document.body.classList.remove("focus-mode-active"); };
  }, [focusMode, user?.id]);

  function submitPrompt(event) {
    event.preventDefault();
    if (!prompt.trim() && !attachment) return;
    const activeMode = Object.entries(modes).find(([, enabled]) => enabled)?.[0];
    if (activeMode) { setSessionMode(activeMode); return; }
    const message = prompt.trim() || `Help me study ${attachment.name}`;
    setQueuedPrompt(message);
  }

  function speakAnswer(content) {
    if (!speechEnabled()) { setNotice("Spoken voice is disabled. Use the Voice off button to enable it."); return; }
    if (!window.speechSynthesis) { setNotice("Speech playback is not supported by this browser."); return; }
    window.speechSynthesis.cancel();
    const plainText = sanitizeSpeechText(content);
    const speech = new SpeechSynthesisUtterance(plainText);
    speech.rate = 0.9; speech.pitch = 1;
    window.speechSynthesis.speak(speech);
  }

  async function sendPrompt(message, presentationMode) {
    setQueuedPrompt(null);
    const chatId = activeChat || Date.now();
    const userMessage = { role: "user", content: message, presentationMode };
    const nextMessages = [...chatMessages, userMessage];
    setActiveChat(chatId); setChatMessages(nextMessages); setPrompt(""); setAttachment(null); setNotice(""); setSending(true);
    setChatHistory((current) => current.some((chat) => chat.id === chatId) ? current.map((chat) => chat.id === chatId ? { ...chat, messages: nextMessages } : chat) : [{ id: chatId, title: message.slice(0, 55), messages: nextMessages }, ...current]);
    try {
      let reply = "";
      const llmHistory = chatMessages.map(({ role, content }) => ({ role, content }));
      await streamLearningChat(message, llmHistory, (token) => {
        reply += token;
        const streamed = [...nextMessages, { role: "assistant", content: reply, presentationMode }];
        setChatMessages(streamed);
        setChatHistory((current) => current.map((chat) => chat.id === chatId ? { ...chat, messages: streamed } : chat));
      }, presentationMode);
      if (!reply) throw new Error("The AI provider returned an empty response.");
      let visual = null;
      try {
        const result = presentationMode === "visual" || presentationMode === "preferences" ? await analyzeLearningVisual(message, reply, llmHistory, presentationMode) : null;
        if (result?.response_type === "visual") visual = result;
      } catch (visualError) {
        setNotice(`The explanation is ready, but its visual could not be generated: ${visualError.message}`);
      }
      const completed = [...nextMessages, { role: "assistant", content: reply, visual, presentationMode }];
      setChatMessages(completed);
      setChatHistory((current) => current.map((chat) => chat.id === chatId ? { ...chat, messages: completed } : chat));
      if (presentationMode === "speech") speakAnswer(reply);
    } catch (error) { setNotice(error.message); }
    finally { setSending(false); }
  }

  function newChat() {
    setPrompt(""); setAttachment(null); setNotice(""); setActiveChat(null); setChatMessages([]);
  }

  function closeMode() { setSessionMode(null); setPendingMode(null); setModes({ viva: false, discussion: false, test: false }); }
  if (sessionMode) return <LearningModeSession mode={sessionMode} topic={modeTopic || prompt.trim() || attachment?.name || "Your selected topic"} onExit={closeMode} onLearn={(revisionPrompt) => { setPrompt(revisionPrompt); closeMode(); }} />;
  if (focusMode) return <DeepFocus userId={user?.id} objective={prompt.trim() || chatHistory.find((chat) => chat.id === activeChat)?.title || "Master your current topic"} messages={chatMessages} sending={sending} notice={notice} onSend={(message, format = "preferences") => sendPrompt(message, format)} onExit={() => setFocusMode(false)} preferences={user?.learning_preferences} />;

  return (
    <div className="dashboard learning-chat">
      {pendingMode && <div className="mode-setup" role="dialog" aria-modal="true"><form onSubmit={(event) => { event.preventDefault(); if (!modeTopic.trim()) return; setPrompt(modeTopic.trim()); setPendingMode(null); setSessionMode(pendingMode); }}><button className="mode-setup__close" type="button" onClick={closeMode}>×</button><span className="eyebrow">{pendingMode === "viva" ? "Viva mode" : pendingMode === "discussion" ? "Group discussion" : "Test mode"}</span><h2>What topic would you like to {pendingMode === "viva" ? "practise" : pendingMode === "discussion" ? "discuss" : "be tested on"}?</h2><p>{pendingMode === "viva" ? "Nexora will become your examiner and read each question aloud." : pendingMode === "discussion" ? "Nexora will create participants with different viewpoints." : "Nexora will create a focused test around your topic."}</p><input autoFocus value={modeTopic} onChange={(event) => setModeTopic(event.target.value)} placeholder="Enter a topic" /><button className="btn btn-primary" type="submit" disabled={!modeTopic.trim()}>Continue →</button></form></div>}
      {queuedPrompt && <div className="response-format-modal" role="dialog" aria-modal="true" aria-labelledby="response-format-title"><div><button className="response-format-modal__close" type="button" onClick={() => setQueuedPrompt(null)} aria-label="Cancel response">×</button><span className="eyebrow">Choose your format</span><h2 id="response-format-title">How would you like this explained?</h2><p>You can choose a different format for every question.</p><div className="response-format-grid">{RESPONSE_FORMATS.map(([key, label, description]) => <button type="button" key={key} onClick={() => sendPrompt(queuedPrompt, key)}><strong>{label}</strong><span>{description}</span></button>)}</div></div></div>}
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
            {chatHistory.length === 0 ? <div className="chat-history__empty"><span>N</span><p>Your study conversations will appear here.</p></div> : chatHistory.map((chat) => <button type="button" className={activeChat === chat.id ? "is-active" : ""} key={chat.id} onClick={() => { setActiveChat(chat.id); setChatMessages(chat.messages || []); setPrompt(""); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15a3 3 0 0 1-3 3H8l-4 3V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3Z" /></svg><span>{chat.title}</span></button>)}
          </div>
          <div className="chat-history__footer"><span>History is stored here after you start a session.</span></div>
        </aside>
        <main className="learning-chat__inner">
        {chatMessages.length === 0 && <header className="learning-chat__header">
          <span className="eyebrow">Learn anything, your way</span>
          <h1>What do you want to<br /><em>study today?</em></h1>
          <p>Ask a question or attach material. Learn one step at a time.</p>
        </header>}

        {chatMessages.length === 0 && <div className="learning-chat__suggestions">
          <span>Try asking</span>
          {["Explain a difficult concept", "Make a study plan", "Quiz me from my notes"].map((text) => <button type="button" key={text} onClick={() => setPrompt(text)}>{text}</button>)}
        </div>}

        {chatMessages.length > 0 && <section className="learning-conversation" aria-live="polite">{chatMessages.map((message, index) => <article className={`learning-message learning-message--${message.role} ${message.presentationMode === "visual" ? "learning-message--visual" : ""}`} key={index}><span>{message.role === "assistant" ? "N" : "You"}</span><div>{message.role === "assistant" ? <AdaptiveAnswer content={message.content} preferences={user?.learning_preferences} visual={message.visual} presentationMode={message.presentationMode} complete={!sending || index < chatMessages.length - 1} /> : message.content}</div></article>)}{sending && chatMessages.at(-1)?.role !== "assistant" && <article className="learning-message learning-message--assistant"><span>N</span><div className="typing-dots"><i /><i /><i /></div></article>}</section>}

        <form className="composer" onSubmit={submitPrompt}>
          <textarea
            value={prompt}
            onChange={(event) => { setPrompt(event.target.value); setNotice(""); }}
            placeholder="Ask Nexora to explain a topic, create a study plan, or help with an assignment..."
            aria-label="What do you want to study?"
            rows="4"
            onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }}
          />
          {attachment && <div className="composer__file"><span>DOC</span><div><strong>{attachment.name}</strong><small>{Math.max(1, Math.round(attachment.size / 1024))} KB</small></div><button type="button" aria-label="Remove attachment" onClick={() => setAttachment(null)}>×</button></div>}
          <div className="composer__toolbar">
            <div className="composer__tools">
              <input ref={fileInput} type="file" hidden accept=".pdf,.doc,.docx,.txt,.ppt,.pptx" onChange={(event) => setAttachment(event.target.files[0] || null)} />
              <button className="icon-button" type="button" onClick={() => fileInput.current?.click()} aria-label="Attach a study document" title="Attach document">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
              </button>
              <button className="focus-entry" type="button" onClick={() => setFocusMode(true)} aria-label="Enter focus mode">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" /><circle cx="12" cy="12" r="3" /></svg>
                <span>Focus mode</span>
              </button>
              <div className="mode-settings" ref={settings}>
                <button className={`icon-button ${settingsOpen ? "is-active" : ""}`} type="button" onClick={() => setSettingsOpen((open) => !open)} aria-label="Study mode settings" aria-expanded={settingsOpen} title="Study modes">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.6-1H3v-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88L4.2 7.06l2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6V3h4v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.6 1h.09v4H21a1.7 1.7 0 0 0-1.6 1Z" /></svg>
                </button>
                {settingsOpen && <div className="mode-menu">
                  <div className="mode-menu__header"><div><strong>Study modes</strong><span>Shape your learning session</span></div></div>
                  {MODES.map(([key, label, description]) => <div className="mode-menu__item" key={key}><div><strong>{label}</strong><p>{description}</p></div><button type="button" className={`switch ${(key === "focus" ? focusMode : modes[key]) ? "is-on" : ""}`} onClick={() => { if (key === "focus") { setSettingsOpen(false); setFocusMode(true); return; } const enabling = !modes[key]; setModes({ viva: false, discussion: false, test: false, [key]: enabling }); setSettingsOpen(false); setModeTopic(prompt.trim()); if (enabling) setPendingMode(key); }} role="switch" aria-checked={key === "focus" ? focusMode : Boolean(modes[key])}><span /></button></div>)}
                </div>}
              </div>
              <span className="composer__hint">Attach notes or choose a study mode</span>
            </div>
            <button className="composer__send" type="submit" disabled={sending || (!prompt.trim() && !attachment)} aria-label="Send study request">
              <span>{sending ? "Thinking…" : chatMessages.length ? "Send" : "Start learning"}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 14-7-4 14-3-6-7-1Z" /></svg>
            </button>
          </div>
        </form>
        {notice && <div className="learning-chat__notice" role="status">{notice}</div>}

        </main>
      </div>
    </div>
  );
}

export function FocusLearningSpace({ messages, prompt, setPrompt, sending, notice, onSend, onExit, preferences }) {
  const conversationEnd = useRef(null);
  useEffect(() => { conversationEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);
  function submit(event) {
    event.preventDefault();
    const message = prompt.trim();
    if (message && !sending) onSend(message);
  }
  return <div className="focus-space">
    <header className="focus-space__topbar"><div><i aria-hidden="true" /><span>Focus mode</span></div><button type="button" onClick={onExit}>Exit focus mode</button></header>
    <main className="focus-space__main">
      {messages.length === 0 && <section className="focus-space__welcome"><span>Quiet learning</span><h1>One idea at a time.</h1><p>Ask what you want to understand. Everything else can wait.</p></section>}
      {messages.length > 0 && <section className="focus-space__conversation" aria-live="polite">{messages.map((message, index) => <article className={`focus-space__message focus-space__message--${message.role}`} key={index}>{message.role === "assistant" ? <AdaptiveAnswer content={message.content} preferences={preferences} visual={null} presentationMode="preferences" complete={!sending || index < messages.length - 1} /> : <p>{message.content}</p>}</article>)}{sending && messages.at(-1)?.role !== "assistant" && <div className="focus-space__thinking">Thinking quietly…</div>}<div ref={conversationEnd} /></section>}
      <form className="focus-space__composer" onSubmit={submit}><textarea autoFocus value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="What would you like to understand?" rows="2" /><button type="submit" disabled={sending || !prompt.trim()}>{sending ? "Thinking…" : "Ask"}</button></form>
      {notice && <p className="focus-space__notice" role="status">{notice}</p>}
    </main>
  </div>;
}
