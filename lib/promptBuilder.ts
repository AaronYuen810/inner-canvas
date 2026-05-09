import { MixedSignalBrief } from "@/lib/sessionState";

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
  mixedSignalBrief: MixedSignalBrief,
  modifier?: string
): string {
  const safeModifier = modifier?.trim();
  const modifierInstruction = safeModifier
    ? MODIFIER_GUIDANCE[safeModifier] || safeModifier
    : "none";

  return [
    "Create one symbolic, emotionally gentle visual interpretation of a spoken reflection.",
    "Use the structured mixed-signal brief below as the source of truth.",
    "",
    `Transcript summary: ${mixedSignalBrief.transcriptSummary.trim() || "none provided"}`,
    `Spoken valence: ${mixedSignalBrief.spokenValence}`,
    `Visual affect: ${mixedSignalBrief.visualAffect}`,
    `Signal relationship: ${mixedSignalBrief.signalRelationship}`,
    `Scene energy: ${mixedSignalBrief.sceneEnergy}`,
    `Spatial mood: ${mixedSignalBrief.spatialMood}`,
    `Palette mood: ${mixedSignalBrief.paletteMood}`,
    `Abstraction level: ${mixedSignalBrief.abstractionLevel}`,
    `Confidence: ${mixedSignalBrief.confidence}`,
    `Spoken themes: ${formatList(mixedSignalBrief.spokenThemes)}`,
    `Spoken emotions: ${formatList(mixedSignalBrief.spokenEmotions)}`,
    `Visual affect signals: ${formatList(mixedSignalBrief.visualAffectSignals)}`,
    `Signal tensions: ${formatList(mixedSignalBrief.signalTensions)}`,
    `Symbolic elements: ${formatList(mixedSignalBrief.symbolicElements)}`,
    `Scene concept: ${mixedSignalBrief.sceneConcept.trim() || "none provided"}`,
    `Atmosphere: ${mixedSignalBrief.atmosphere.trim() || "none provided"}`,
    `Composition: ${mixedSignalBrief.composition.trim() || "none provided"}`,
    "",
    "Rules:",
    "- Speech content determines scene, symbols, objects, and narrative.",
    "- Visual affect may co-author atmosphere, scale, tension, and composition.",
    "- Do not let visual affect fully override the spoken reflection.",
    "- Do not imply diagnosis or claim this image is the user's true emotion.",
    "- Avoid text, captions, labels, UI, medical imagery, and diagnostic symbolism.",
    "- Avoid horror unless explicitly requested.",
    "",
    `Modifier: ${modifierInstruction}`,
    "",
    "Output one polished square composition.",
  ].join("\n");
}
