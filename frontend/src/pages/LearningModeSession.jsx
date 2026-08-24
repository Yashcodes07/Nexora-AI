import { useEffect, useState } from "react";
import "./LearningModeSession.css";

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
  const [messages, setMessages] = useState(() => viva ? [{ from: "nexora", text: `Let’s begin your viva on ${topic}. In your own words, what is the core idea?` }] : [
    { from: "A", text: `${topic} can create meaningful opportunities when used responsibly.` },
    { from: "B", text: "I disagree—the risks and unequal impact are often underestimated." },
    { from: "C", text: "Both views matter. The outcome depends on how people shape the change." },
  ]);
  const [report, setReport] = useState(false);
  const [listening, setListening] = useState(false);
  useEffect(() => { if (!viva || !window.speechSynthesis) return; const latest = [...messages].reverse().find((item) => item.from === "nexora"); if (!latest) return; window.speechSynthesis.cancel(); const speech = new SpeechSynthesisUtterance(latest.text); speech.rate = 0.9; window.speechSynthesis.speak(speech); }, [messages, viva]);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  function listen() { const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition; if (!Recognition) { setInput("Voice input is not supported by this browser."); return; } const recognition = new Recognition(); recognition.lang = "en-IN"; recognition.onstart = () => setListening(true); recognition.onend = () => setListening(false); recognition.onresult = (event) => setInput(event.results[0][0].transcript); recognition.start(); }

  function respond(event) {
    event.preventDefault(); if (!input.trim()) return;
    const answer = input.trim();
    const followUp = answer.length < 35 ? "Let’s approach that differently. Can you give one simple example?" : viva ? "Good. How is that different from the most closely related concept?" : "Participant B challenges that point. Can you respond directly with evidence or an example?";
    setMessages((items) => [...items, { from: "you", text: answer }, { from: "nexora", text: followUp }]);
    setInput(""); setTurn((value) => value + 1);
  }

  if (report) return <div className="mode-report"><button onClick={onExit}>← Learning Space</button><span className="mode-kicker">{viva ? "Viva report" : "Your GD feedback"}</span><h1>{viva ? "A thoughtful attempt." : "You stayed engaged and relevant."}</h1><div className="report-score"><strong>{viva ? "7 / 10" : "Good"}</strong><span>{viva ? "Questions answered" : "Overall contribution"}</span></div><div className="report-grid"><section><h2>Strong</h2><p>✓ Clear examples</p><p>✓ Stayed relevant</p><p>✓ Good conceptual foundation</p></section><section><h2>Improve</h2><p>△ Structure arguments more clearly</p><p>△ Respond directly to opposing views</p><p>△ Revise one weak concept</p></section></div><button className="mode-primary" onClick={() => { setReport(false); setTurn(1); }}>Practice weak concepts →</button></div>;

  return <div className="conversation-mode"><header><button onClick={onExit}>← Exit</button><div><span>{viva ? "Viva mode" : "Group discussion"}</span><h1>{topic}</h1></div><small>{viva ? `Question ${turn} of 10` : "4 participants"}</small></header><main><div className="conversation-purpose">{viva ? "Practice answering questions aloud. Follow-ups adapt to your response." : "Build confidence, reasoning, and communication through opposing viewpoints."}</div>{messages.map((message, index) => <div className={`mode-message mode-message--${message.from}`} key={index}><span>{message.from === "you" ? "You" : message.from === "nexora" ? "N" : message.from}</span><p>{message.text}</p></div>)}</main><form onSubmit={respond}><textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder={viva ? "Answer in your own words…" : "Add your perspective…"} /><div><button type="button" className="voice-button" onClick={listen}>{listening ? "Listening…" : "🎤 Answer by voice"}</button><button type="submit" disabled={!input.trim()}>Respond →</button></div></form>{turn >= 3 && <button className="finish-session" onClick={() => setReport(true)}>Finish & view feedback</button>}</div>;
}

function TestSession({ topic, onExit, onLearn }) {
  const [index, setIndex] = useState(0); const [selected, setSelected] = useState(""); const [answers, setAnswers] = useState([]); const [done, setDone] = useState(false);
  const question = TEST_QUESTIONS[index];
  function next() { const updated = [...answers, { ...question, selected }]; setAnswers(updated); setSelected(""); if (index === TEST_QUESTIONS.length - 1) setDone(true); else setIndex(index + 1); }
  if (done) { const correct = answers.filter((item) => item.selected === item.answer); const wrong = answers.filter((item) => item.selected !== item.answer); const learningTopic = wrong.length ? wrong.map((item) => item.concept).join(", ") : topic; return <div className="test-screen test-result"><span>Test result</span><h1>{correct.length} / {answers.length}</h1><p>{wrong.length ? `Needs attention: ${learningTopic}` : `You understood every question in ${topic}.`}</p><section>{answers.map((item, itemIndex) => <div className={item.selected === item.answer ? "is-correct" : "is-wrong"} key={item.question}><strong>{item.selected === item.answer ? "✓" : "×"} Question {itemIndex + 1}</strong><p>{item.question}</p>{item.selected !== item.answer && <small>Your answer: {item.selected} · Correct: {item.answer}<br />Review when this concept is preferable, not only its definition.</small>}</div>)}</section><div className="test-result__actions"><button onClick={onExit}>Finish test</button><button className="mode-primary" onClick={() => onLearn(`Teach me ${learningTopic} using short explanations and examples, then give me a quick check.`)}>{wrong.length ? "Learn this topic" : "Learn more about these topics"} →</button></div></div>; }
  return <div className="test-screen"><button className="test-exit" onClick={onExit}>Exit test</button><header><span>Test mode</span><h1>{topic}</h1><p>{TEST_QUESTIONS.length} questions · Distraction-free</p></header><div className="test-progress"><span style={{ width: `${((index + 1) / TEST_QUESTIONS.length) * 100}%` }} /></div><main><span>Question {index + 1} / {TEST_QUESTIONS.length}</span><h2>{question.question}</h2><div className="test-options">{question.options.map((option) => <button className={selected === option ? "is-selected" : ""} onClick={() => setSelected(option)} key={option}><i />{option}</button>)}</div><button className="test-next" disabled={!selected} onClick={next}>{index === TEST_QUESTIONS.length - 1 ? "Finish test" : "Next →"}</button></main><footer>{Math.round((index / TEST_QUESTIONS.length) * 100)}% complete</footer></div>;
}
