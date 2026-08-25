import { useEffect, useState } from "react";
import { setSpeechEnabled, SPEECH_EVENT, speechEnabled } from "../utils/speech.js";

export default function VoiceControl() {
  const [enabled, setEnabled] = useState(speechEnabled);
  useEffect(() => {
    const sync = (event) => setEnabled(event.detail);
    window.addEventListener(SPEECH_EVENT, sync);
    return () => window.removeEventListener(SPEECH_EVENT, sync);
  }, []);
  function toggle() {
    const next = !enabled;
    setSpeechEnabled(next);
    setEnabled(next);
  }
  return <button className={`voice-control ${enabled ? "" : "is-muted"}`} type="button" onClick={toggle} aria-pressed={!enabled} title={enabled ? "Disable spoken voice" : "Enable spoken voice"}>
    <span aria-hidden="true">{enabled ? "◖))" : "◖×"}</span>{enabled ? "Voice on" : "Voice off"}
  </button>;
}
