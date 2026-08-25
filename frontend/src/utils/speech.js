const SPEECH_KEY = "nexora-speech-enabled";
export const SPEECH_EVENT = "nexora:speech-preference";

export function speechEnabled() {
  return localStorage.getItem(SPEECH_KEY) !== "false";
}

export function setSpeechEnabled(enabled) {
  localStorage.setItem(SPEECH_KEY, String(enabled));
  if (!enabled) window.speechSynthesis?.cancel();
  window.dispatchEvent(new CustomEvent(SPEECH_EVENT, { detail: enabled }));
}

export function sanitizeSpeechText(value) {
  return String(value ?? "")
    .replace(/```[\s\S]*?```/g, " code example ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/^\s*(?:[-*+] |\d+[.)]\s+)/gm, "")
    .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[*#_~>|]/g, "")
    .replace(/\s*[-–—]\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}
