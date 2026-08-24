import { useEffect, useRef, useState } from "react";
import { getDashboardSection } from "../api/auth.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./Wellbeing.css";
import { wellbeingReply } from "../api/ai.js";

const MOODS = [
  ["good", "Good", "😊"],
  ["okay", "Okay", "😐"],
  ["low", "Low", "😟"],
  ["overwhelmed", "Overwhelmed", "😣"],
];

const OPENERS = {
  good: "It’s lovely to hear there’s some good in today. What has felt supportive or energising?",
  okay: "Okay is enough. Would you like to share what has been taking up space in your mind?",
  low: "Thank you for noticing that. We can take this slowly—what feels heaviest right now?",
  overwhelmed: "You don’t need to untangle everything at once. What is the one thing asking for the most attention?",
};

export default function Wellbeing() {
  const { user } = useAuth();
  const [mood, setMood] = useState("");
  const [checkingIn, setCheckingIn] = useState(false);
  const [ambientOn, setAmbientOn] = useState(false);
  const [ambientVolume, setAmbientVolume] = useState(0.12);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const audioRef = useRef(null);

  useEffect(() => { getDashboardSection("wellbeing").catch(() => {}); }, []);
  useEffect(() => () => stopAmbience(), []);

  function startAmbience() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const master = context.createGain();
    master.gain.value = ambientVolume;
    master.connect(context.destination);

    // Soft filtered noise with a slow swell resembles wind moving through leaves.
    const rainBuffer = context.createBuffer(1, context.sampleRate * 6, context.sampleRate);
    const rainData = rainBuffer.getChannelData(0);
    let roomNoise = 0;
    for (let index = 0; index < rainData.length; index += 1) {
      roomNoise = roomNoise * 0.82 + (Math.random() * 2 - 1) * 0.18;
      rainData[index] = roomNoise * 0.88 + (Math.random() * 2 - 1) * 0.12;
    }
    const rain = context.createBufferSource();
    const rainFilter = context.createBiquadFilter();
    const rainGain = context.createGain();
    const roomFilter = context.createBiquadFilter();
    const roomGain = context.createGain();
    const breeze = context.createOscillator();
    const breezeDepth = context.createGain();
    rain.buffer = rainBuffer; rain.loop = true;
    rainFilter.type = "lowpass"; rainFilter.frequency.value = 1450; rainFilter.Q.value = 0.3;
    rainGain.gain.value = 0.42;
    roomFilter.type = "bandpass"; roomFilter.frequency.value = 3200; roomFilter.Q.value = 0.25;
    roomGain.gain.value = 0.08;
    breeze.type = "sine"; breeze.frequency.value = 0.075; breezeDepth.gain.value = 0.16;
    breeze.connect(breezeDepth).connect(rainGain.gain);
    rain.connect(rainFilter).connect(rainGain).connect(master);
    rain.connect(roomFilter).connect(roomGain).connect(master);
    rain.start(); breeze.start();
    audioRef.current = { context, rain, breeze, master };
  }

  function stopAmbience() {
    if (!audioRef.current) return;
    try {
      audioRef.current.rain.stop();
      audioRef.current.breeze.stop();
      audioRef.current.context.close();
    } catch { /* already stopped */ }
    audioRef.current = null;
  }

  function toggleAmbience() {
    if (ambientOn) stopAmbience(); else startAmbience();
    setAmbientOn((active) => !active);
  }

  function changeAmbientVolume(event) {
    const volume = Number(event.target.value);
    setAmbientVolume(volume);
    if (audioRef.current) audioRef.current.master.gain.setTargetAtTime(volume, audioRef.current.context.currentTime, 0.05);
  }

  function beginCheckIn() {
    const selectedMood = mood || "okay";
    setMood(selectedMood);
    setMessages([{ id: 1, from: "nexora", text: OPENERS[selectedMood] }]);
    setCheckingIn(true);
  }

  async function sendMessage(event) {
    event.preventDefault();
    if (!message.trim()) return;
    const userMessage = message.trim();
    const history = messages.map((item) => ({ role: item.from === "user" ? "user" : "assistant", content: item.text }));
    setMessages((current) => [...current, { id: Date.now(), from: "user", text: userMessage }]);
    setMessage("");
    try { const result = await wellbeingReply(userMessage, history); setMessages((current) => [...current, { id: Date.now() + 1, from: "nexora", text: result.reply }]); }
    catch { setMessages((current) => [...current, { id: Date.now() + 1, from: "nexora", text: "I’m still here with you. We can pause, or continue whenever you feel ready." }]); }
  }

  const firstName = (user.full_name || user.email.split("@")[0]).split(" ")[0];

  return (
    <div className="wellbeing">
      <div className="wellbeing__light" aria-hidden="true" />
      <div className={`ambient ${ambientOn ? "is-on" : ""}`}>
        <div className="ambient__title"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12" /></svg><strong>Ambient sound</strong></div>
        <input type="range" min="0.03" max="0.3" step="0.01" value={ambientVolume} onChange={changeAmbientVolume} aria-label="Ambient sound volume" />
        <div className="ambient__meta"><span>Leaves · Gentle</span><button type="button" onClick={toggleAmbience} aria-pressed={ambientOn}>{ambientOn ? "On" : "Off"}</button></div>
      </div>

      {!checkingIn ? (
        <main className="wellbeing__welcome">
          <section className="wellbeing__copy">
            <span className="wellbeing__eyebrow">A quiet moment for you</span>
            <h1>Welcome back, {firstName}.<br /><em>Take your time.</em></h1>
            <p className="wellbeing__comfort">You don’t have to fix anything right now.<br />Just notice how you feel.</p>

            <div className="mood-card">
              <div className="mood-card__heading"><div><h2>How are you feeling today?</h2><p>Choose whatever feels closest.</p></div><span>Private · 1 min</span></div>
              <div className="moods">
                {MOODS.map(([value, label, emoji]) => <button className={mood === value ? "is-selected" : ""} type="button" key={value} onClick={() => setMood(value)} aria-pressed={mood === value}><span>{emoji}</span><strong>{label}</strong></button>)}
              </div>
              <button className="wellbeing__start" type="button" onClick={beginCheckIn}>Start check-in <span>→</span></button>
              <p className="wellbeing__private">This check-in is private and takes about 1 minute.</p>
            </div>
          </section>

          <aside className="calm-scene" aria-label="A quiet window overlooking a warm sunset">
            <svg viewBox="0 0 520 620" role="img">
              <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#d79a6a" /><stop offset=".52" stopColor="#8d7b65" /><stop offset="1" stopColor="#344c3d" /></linearGradient><linearGradient id="wall" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#263d31" /><stop offset="1" stopColor="#14271f" /></linearGradient></defs>
              <rect width="520" height="620" rx="32" fill="url(#wall)" /><rect x="64" y="48" width="392" height="410" rx="180" fill="url(#sky)" /><circle cx="350" cy="235" r="66" fill="#f3c080" opacity=".85" /><path d="M64 370c80-55 120-22 184-58 70-40 126-20 208 24v122H64Z" fill="#294536" /><path d="M64 410c92-48 158-6 240-38 54-21 95-7 152 15v71H64Z" fill="#1c352a" /><path d="M50 500h420v45H50z" fill="#102219" /><path d="M125 520c-8-74 8-139 44-194M148 412c-54-12-67-42-70-80 44 8 71 30 70 80ZM159 375c8-52 36-73 75-83-4 45-27 73-75 83ZM141 464c-51-5-70-29-81-65 44 2 74 21 81 65ZM159 443c14-48 43-65 81-69-10 41-35 65-81 69Z" fill="#52725a" stroke="#789079" strokeWidth="3" /><ellipse cx="140" cy="540" rx="74" ry="25" fill="#0b1812" /><path d="M350 530c0-38 20-65 52-77-2 37-16 64-52 77ZM356 530c10-31 37-47 67-43-13 29-34 44-67 43Z" fill="#6f876b" /><rect x="322" y="530" width="90" height="52" rx="12" fill="#b1744e" /></svg>
            <p>A soft place to pause.</p>
          </aside>
        </main>
      ) : (
        <main className="checkin-chat">
          <header className="checkin-chat__header"><button type="button" onClick={() => setCheckingIn(false)}>← Back</button><div><span>Private check-in</span><h1>Take your time, {firstName}.</h1></div><span className="checkin-chat__mood">{MOODS.find(([value]) => value === mood)?.[2]}</span></header>
          <section className="checkin-chat__messages" aria-live="polite">
            <div className="checkin-chat__day">A quiet space · Just for you</div>
            {messages.map((item) => <div className={`checkin-message checkin-message--${item.from}`} key={item.id}>{item.from === "nexora" && <span className="checkin-message__mark"><img src="/nexora-mark.png" alt="" /></span>}<p>{item.text}</p></div>)}
          </section>
          <form className="checkin-composer" onSubmit={sendMessage}><textarea rows="2" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Share only what feels comfortable..." aria-label="Your check-in message" /><div><span>There is no right or wrong answer.</span><button type="submit" disabled={!message.trim()} aria-label="Send message">↑</button></div></form>
        </main>
      )}
    </div>
  );
}
