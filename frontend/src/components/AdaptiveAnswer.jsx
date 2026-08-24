import { Fragment, lazy, Suspense } from "react";

const VisualRenderer = lazy(() => import("./VisualRenderer.jsx"));

function inlineMarkdown(text) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={index}>{part.slice(1, -1)}</code>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}

function MarkdownContent({ content }) {
  const lines = content.split("\n");
  const output = [];
  let list = [];
  let ordered = false;
  function flushList() {
    if (!list.length) return;
    const Tag = ordered ? "ol" : "ul";
    output.push(<Tag key={`list-${output.length}`}>{list.map((item, index) => <li key={index}>{inlineMarkdown(item)}</li>)}</Tag>);
    list = [];
  }
  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    const line = raw.trim();
    const next = lines[index + 1]?.trim() || "";
    if (line.includes("|") && /^\|?\s*:?-{3,}/.test(next)) {
      flushList();
      const cells = (value) => value.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
      const headers = cells(line);
      const rows = [];
      index += 2;
      while (index < lines.length && lines[index].includes("|")) { rows.push(cells(lines[index].trim())); index += 1; }
      index -= 1;
      output.push(<div className="answer-table-wrap" key={`table-${index}`}><table><thead><tr>{headers.map((header, cellIndex) => <th key={cellIndex}>{inlineMarkdown(header)}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{headers.map((_, cellIndex) => <td key={cellIndex}>{inlineMarkdown(row[cellIndex] || "")}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    const item = line.match(/^[-*]\s+(.+)/);
    const numbered = line.match(/^\d+[.)]\s+(.+)/);
    if (item || numbered) {
      if (list.length && ordered !== Boolean(numbered)) flushList();
      ordered = Boolean(numbered); list.push((item || numbered)[1]); continue;
    }
    flushList();
    if (!line) continue;
    const heading = line.match(/^(#{1,4})\s+(.+)/);
    if (heading) {
      const Tag = `h${Math.min(heading[1].length + 2, 5)}`;
      output.push(<Tag key={index}>{inlineMarkdown(heading[2])}</Tag>);
    } else if (line.startsWith("> ")) output.push(<blockquote key={index}>{inlineMarkdown(line.slice(2))}</blockquote>);
    else output.push(<p key={index}>{inlineMarkdown(line)}</p>);
  }
  flushList();
  return output;
}

export default function AdaptiveAnswer({ content, preferences, visual, presentationMode, complete = true }) {
  const avoidances = preferences?.avoidances || [];
  const compact = preferences?.content_amount === "small_chunks" || preferences?.learning_methods?.includes("short_text") || avoidances.includes("long_paragraphs") || avoidances.includes("too_much_information");
  const visualReady = complete && visual?.response_type === "visual";
  if (presentationMode === "visual") return <div className="visual-only-answer">
    {visualReady ? <Suspense fallback={<VisualGenerating />}><VisualRenderer spec={visual} visualOnly /></Suspense> : <VisualGenerating />}
  </div>;
  return <div className={`adaptive-answer ${compact ? "adaptive-answer--compact" : ""}`}>
    <MarkdownContent content={content} />
    {visualReady && <Suspense fallback={<div className="visual-loading">Preparing interactive explanation…</div>}><VisualRenderer spec={visual} /></Suspense>}
  </div>;
}

function VisualGenerating() {
  return <div className="visual-generating" role="status" aria-label="Building interactive visual"><div className="visual-generating__scene" aria-hidden="true"><i /><i /><i /><span /><span /></div></div>;
}
