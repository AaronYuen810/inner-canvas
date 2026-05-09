import { ReflectionAnalysis } from "@/lib/sessionState";

const MODIFIER_GUIDANCE: Record<string, string> = {
  "More hopeful":
    "Brighten lighting, use a warmer palette, and include a clearer sense of path forward.",
  "More abstract":
    "Reduce literal human figure details and increase symbolic forms and composition.",
  "More intense":
    "Increase contrast, scale, motion, and emotional pressure without introducing horror.",
  "Less dark":
    "Soften shadows, reduce visual heaviness, and preserve emotional complexity.",
};

function formatList(items: string[]): string {
  const cleaned = items.map((item) => item.trim()).filter(Boolean);
  if (cleaned.length === 0) {
    return "none provided";
  }

  return cleaned.join(", ");
}

export function buildImagePrompt(
  analysis: ReflectionAnalysis,
  confirmedVisibleTone: string[],
  style?: string,
  modifier?: string
): string {
  const safeStyle = style?.trim();
  const safeModifier = modifier?.trim();
  const modifierInstruction = safeModifier
    ? MODIFIER_GUIDANCE[safeModifier] || safeModifier
    : "none";

  return [
    "Create one symbolic, emotionally gentle visual interpretation of a spoken reflection.",
    "",
    `Reflection summary: ${analysis.summary.trim() || "none provided"}`,
    `Main themes: ${formatList(analysis.themes)}`,
    `Emotional keywords from the user's own words: ${formatList(analysis.emotionalKeywords)}`,
    `Metaphors: ${formatList(analysis.metaphors)}`,
    `Inner conflicts: ${formatList(analysis.conflicts)}`,
    `Possible visual symbols: ${formatList(analysis.visualSymbols)}`,
    `One-sentence interpretation framing: ${analysis.oneSentenceInterpretation.trim() || "none provided"}`,
    `Confirmed visible tone estimate: ${formatList(confirmedVisibleTone)}`,
    `Style direction: ${safeStyle || "symbolic, cinematic, intimate, reflective"}`,
    "",
    "Rules:",
    "- Speech content determines scene, symbols, objects, and narrative.",
    "- Visible tone only influences mood, color, lighting, atmosphere, and intensity.",
    "- Do not imply diagnosis or claim this image is the user's true emotion.",
    "- Avoid text, captions, labels, UI, medical imagery, and diagnostic symbolism.",
    "- Avoid horror unless explicitly requested.",
    "",
    `Modifier: ${modifierInstruction}`,
    "",
    "Output one polished square composition.",
  ].join("\n");
}
