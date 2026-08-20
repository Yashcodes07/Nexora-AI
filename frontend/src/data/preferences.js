export const PREFERENCE_QUESTIONS = [
  {
    key: "learning_methods",
    title: "How do you prefer to learn new concepts?",
    hint: "Select up to 3",
    type: "multi",
    max: 3,
    options: [
      ["visuals", "🖼️ Visuals / diagrams"],
      ["short_text", "📝 Short & simple text"],
      ["audio", "🎧 Audio / spoken explanation"],
      ["step_by_step", "🔢 Step-by-step explanation"],
      ["examples", "💡 Examples / demonstrations"],
    ],
  },
  {
    key: "content_amount",
    title: "How much should I show you at once?",
    hint: "Choose one",
    type: "single",
    options: [
      ["small_chunks", "Small chunks — one idea at a time"],
      ["moderate", "Moderate — a few ideas together"],
      ["detailed", "Detailed — give me the complete explanation"],
    ],
  },
  {
    key: "focus_support",
    title: "What helps you stay focused?",
    hint: "Select up to 2",
    type: "multi",
    max: 2,
    options: [
      ["short_sections", "Short sections"],
      ["progress_indicators", "Clear progress / completion indicators"],
      ["checklists", "Checklists"],
      ["frequent_breaks", "Frequent breaks"],
      ["minimal_distractions", "Minimal distractions"],
      ["uninterrupted", "I prefer uninterrupted learning"],
    ],
  },
  {
    key: "difficulty_strategy",
    title: "When something is difficult, what should I try first?",
    hint: "Choose one",
    type: "single",
    options: [
      ["simplify", "Simplify it"],
      ["smaller_steps", "Break it into smaller steps"],
      ["visual", "Give me a visual"],
      ["example", "Give me an example"],
      ["explain_differently", "Explain it differently"],
    ],
  },
  {
    key: "avoidances",
    title: "What should I avoid?",
    hint: "Select all that apply",
    type: "multi",
    options: [
      ["long_paragraphs", "Long paragraphs"],
      ["too_much_information", "Too much information at once"],
      ["too_many_things", "Too many things on screen"],
      ["excessive_animations", "Excessive animations"],
      ["time_pressure", "Time pressure"],
      ["nothing_specific", "Nothing specific"],
    ],
  },
  {
    key: "neurodivergent_profiles",
    title: "Does any of the following describe you?",
    description: "This helps us personalize your learning experience.",
    hint: "Choose one",
    type: "single_array",
    options: [
      ["adhd", "ADHD"],
      ["autism", "Autism / Autism Spectrum Disorder (ASD)"],
      ["dyslexia", "Dyslexia"],
      ["dyspraxia", "Dyspraxia / Developmental Coordination Disorder (DCD)"],
      ["dyscalculia", "Dyscalculia"],
      ["other_neurodivergence", "Other neurodivergence"],
      ["prefer_not_to_say", "Prefer not to say"],
      ["none", "None of these"],
    ],
  },
];

export function preferenceLabel(value) {
  for (const question of PREFERENCE_QUESTIONS) {
    const option = question.options.find(([optionValue]) => optionValue === value);
    if (option) return option[1];
  }
  return value;
}
