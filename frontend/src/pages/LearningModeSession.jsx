import { useEffect, useState } from "react";
import "./LearningModeSession.css";
import { MarkdownContent } from "../components/AdaptiveAnswer.jsx";
import { gdReply, generateTest, sessionReport, vivaReply } from "../api/ai.js";
import { sanitizeSpeechText, speechEnabled } from "../utils/speech.js";

const TEST_QUESTIONS = [
  { question: "Which data structure is best suited for implementing a priority queue?", options: ["Stack", "Queue", "Heap", "Linked List"], answer: "Heap", concept: "Heaps" },
  { question: "Which traversal finds the shortest path in an unweighted graph?", options: ["DFS", "BFS", "In-order", "Post-order"], answer: "BFS", concept: "Graph traversal" },
  { question: "What is the average lookup time of a hash table?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], answer: "O(1)", concept: "Hash tables" },
];

export default function LearningModeSession({ mode, topic, onExit, onLearn }) {
  if (mode === "test") return <TestSession topic={topic} onExit={onExit} onLearn={onLearn} />;
  return <ConversationSession mode={mode} topic={topic} onExit={onExit} />;
}

function ConversationSession({ mode, topic, onExit }) {
  const viva = mode === "viva";
  const [input, setInput] = useState("");
  const [turn, setTurn] = useState(1);
  const [messages, setMessages] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [listening, setListening] = useState(false);
  function speak(text, interrupt = true) {
    if (!viva || !speechEnabled() || !window.speechSynthesis || !text) return;
    if (interrupt) window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(sanitizeSpeechText(text));
    speech.rate = 0.9;
    speech.pitch = 1;
    window.speechSynthesis.speak(speech);
  }
  useEffect(() => {
    const latest = messages[messages.length - 1];
    if (latest?.from === "nexora") speak(latest.text, false);
  }, [messages, viva]);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  useEffect(() => {
    let active = true;
    setMessages([]); setReport(null); setTurn(1); setLoading(true);
    const start = viva ? vivaReply(topic, "Start the viva.", [], "start") : gdReply(topic, "Open the discussion.", [], "start");
    start.then((result) => { if (active) setMessages([{ from: "nexora", text: result.reply }]); })
      .catch(() => { if (active) setMessages([{ from: "nexora", text: viva ? `What is the central idea behind ${topic}?` : `What is your opening position on ${topic}, and why?` }]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [topic, viva]);
  function listen() { const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition; if (!Recognition) { setInput("Voice input is not supported by this browser."); return; } const recognition = new Recognition(); recognition.lang = "en-IN"; recognition.onstart = () => setListening(true); recognition.onend = () => setListening(false); recognition.onresult = (event) => setInput(event.results[0][0].transcript); recognition.start(); }

  async function respond(event) {
    event.preventDefault(); if (!input.trim()) return;
    const answer = input.trim();
    const history = messages.map((item) => ({ role: item.from === "you" ? "user" : "assistant", content: item.text }));
    setMessages((items) => [...items, { from: "you", text: answer }]);
    setInput(""); setTurn((value) => value + 1);
    try { const result = viva ? await vivaReply(topic, answer, history) : await gdReply(topic, answer, history); setMessages((items) => [...items, { from: "nexora", text: result.reply }]); }
    catch { setMessages((items) => [...items, { from: "nexora", text: viva ? (answer.length < 35 ? "Can you give one simple example?" : "How would your answer apply in a different situation?") : "**Asha — For:** Your point supports the motion, but it needs a clear real-world example.\n\n**Rohan — Against:** That claim may overlook an important cost or exception.\n\n**Question for you:** Which objection is harder for your position to answer?" }]); }
  }

  async function finishSession() {
    setReportLoading(true);
    const history = messages.map((item) => ({ role: item.from === "you" ? "user" : "assistant", content: item.text }));
    try { setReport(await sessionReport(mode, topic, history)); }
    catch { setReport({ headline: "Session complete", rating: "Review ready", strengths: ["You stayed engaged with the session"], improvements: ["Retry answers that felt unclear"] }); }
    finally { setReportLoading(false); }
  }

  if (report) return <div className="mode-report"><button onClick={onExit}>← Learning Space</button><span className="mode-kicker">{viva ? "Viva report" : "Your GD feedback"}</span><h1>{report.headline}</h1><div className="report-score"><strong>{report.rating}</strong><span>Overall performance</span></div><div className="report-grid"><section><h2>Strong</h2>{(report.strengths || []).map((item) => <p key={item}>✓ {item}</p>)}</section><section><h2>Improve</h2>{[...(report.improvements || []), ...(report.misconceptions || [])].map((item) => <p key={item}>△ {item}</p>)}</section></div><button className="mode-primary" onClick={onExit}>Return to Learning Space →</button></div>;

  return <div className="conversation-mode"><header><button onClick={onExit}>← Exit</button><div><span>{viva ? "Viva mode" : "Group discussion"}</span><h1>{topic}</h1></div><small>{viva ? `Question ${turn} of 10` : "Live discussion"}</small></header><main><div className="conversation-purpose">{viva ? "Practice answering questions aloud. Follow-ups adapt to your response." : "Build confidence, reasoning, and communication through opposing viewpoints."}</div>{loading && <div className="mode-message mode-message--nexora"><span>N</span><p>Preparing your session…</p></div>}{messages.map((message, index) => <div className={`mode-message mode-message--${message.from}`} key={index}><span>{message.from === "you" ? "You" : message.from === "nexora" ? "N" : message.from}</span>{message.from === "nexora" ? <MarkdownContent content={message.text} className="mode-message__body" /> : <p>{message.text}</p>}</div>)}</main><form onSubmit={respond}><textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder={viva ? "Answer in your own words…" : "Add your perspective…"} disabled={loading} /><div><button type="button" className="voice-button" onClick={listen}>{listening ? "Listening…" : "🎤 Answer by voice"}</button><button type="submit" disabled={!input.trim() || loading}>Respond →</button></div></form>{turn >= 3 && <button className="finish-session" onClick={finishSession} disabled={reportLoading}>{reportLoading ? "Preparing feedback…" : "Finish & view feedback"}</button>}</div>;
}

function TestSession({ topic, onExit, onLearn }) {
  const [index, setIndex] = useState(0); const [selected, setSelected] = useState(""); const [answers, setAnswers] = useState([]); const [done, setDone] = useState(false); const [questions, setQuestions] = useState([]); const [testLoading, setTestLoading] = useState(true); const [testError, setTestError] = useState("");
  function loadTest() { setTestLoading(true); setTestError(""); setQuestions([]); setIndex(0); setAnswers([]); setDone(false); generateTest(topic, TEST_QUESTIONS.length + 2).then((result) => { if (!result.questions?.length) throw new Error(); setQuestions(result.questions); }).catch(() => setTestError("Nexora couldnâ€™t prepare this topic-specific test yet. Please try again.")).finally(() => setTestLoading(false)); }
  useEffect(() => { loadTest(); }, [topic]);
  if (testLoading) return <div className="test-screen test-loading"><button className="test-exit" onClick={onExit}>Exit test</button><div><span>Test mode</span><h1>Preparing your {topic} testâ€¦</h1><p>Nexora is creating questions specifically for this topic.</p></div></div>;
  if (testError) return <div className="test-screen test-loading"><button className="test-exit" onClick={onExit}>Exit test</button><div><h1>Letâ€™s try that again.</h1><p>{testError}</p><button className="mode-primary" onClick={loadTest}>Retry topic test</button></div></div>;
  const question = questions[index];
  function next() { const updated = [...answers, { ...question, selected }]; setAnswers(updated); setSelected(""); if (index === questions.length - 1) setDone(true); else setIndex(index + 1); }
  if (done) { const correct = answers.filter((item) => item.selected === item.answer); const wrong = answers.filter((item) => item.selected !== item.answer); const learningTopic = wrong.length ? wrong.map((item) => item.concept).join(", ") : topic; return <div className="test-screen test-result"><span>Test result</span><h1>{correct.length} / {answers.length}</h1><p>{wrong.length ? `Needs attention: ${learningTopic}` : `You understood every question in ${topic}.`}</p><section>{answers.map((item, itemIndex) => <div className={item.selected === item.answer ? "is-correct" : "is-wrong"} key={item.question}><strong>{item.selected === item.answer ? "✓" : "×"} Question {itemIndex + 1}</strong><p>{item.question}</p>{item.selected !== item.answer && <small>Your answer: {item.selected} · Correct: {item.answer}<br />Review when this concept is preferable, not only its definition.</small>}</div>)}</section><div className="test-result__actions"><button onClick={onExit}>Finish test</button><button className="mode-primary" onClick={() => onLearn(`Teach me ${learningTopic} using short explanations and examples, then give me a quick check.`)}>{wrong.length ? "Learn this topic" : "Learn more about these topics"} →</button></div></div>; }
  return <div className="test-screen"><button className="test-exit" onClick={onExit}>Exit test</button><header><span>Test mode</span><h1>{topic}</h1><p>{questions.length} questions · Distraction-free</p></header><div className="test-progress"><span style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div><main><span>Question {index + 1} / {questions.length}</span><h2>{question.question}</h2><div className="test-options">{question.options.map((option) => <button className={selected === option ? "is-selected" : ""} onClick={() => setSelected(option)} key={option}><i />{option}</button>)}</div><button className="test-next" disabled={!selected} onClick={next}>{index === questions.length - 1 ? "Finish test" : "Next →"}</button></main><footer>{Math.round((index / questions.length) * 100)}% complete</footer></div>;
}
