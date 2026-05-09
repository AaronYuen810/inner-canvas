import { MixedSignalBrief } from "@/lib/sessionState";

const MODIFIER_GUIDANCE: Record<string, string> = {
  "More hopeful":
    "Brighten lighting, use a warmer palette, and include a clearer sense of path forward.",
  "More abstract":
    "Push further into non-representational shapes, layered symbolism, texture, and spatial rhythm.",
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
    "Create an abstract symbolic visual journal image.",
    "Subject: an emotionally gentle abstract composition that translates a spoken reflection into symbolic space, objects, light, texture, movement, and environmental forms.",
    "Style: polished editorial art direction, layered symbolism, soft cinematic lighting, tactile atmosphere, refined color harmony, no literal portraiture.",
    "Composition: square format, balanced focal structure, clear foreground/midground/background depth, visually coherent at thumbnail size.",
    "Mood and palette: derive emotional tone, energy, spatial pressure, and color temperature from the mixed-signal brief.",
    "Constraint: do not depict recognizable people, faces, portraits, bodies, selfies, silhouettes, or literal human figures.",
    "Translate any references to a person into abstract spatial forms, objects, light, texture, movement, or environmental symbolism.",
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
    "- Speech content determines symbols, objects, visual metaphors, and narrative atmosphere.",
    "- Visual affect may co-author atmosphere, scale, tension, and composition.",
    "- Do not let visual affect fully override the spoken reflection.",
    "- Do not imply diagnosis or claim this image is the user's true emotion.",
    "- Avoid text, captions, labels, UI, medical imagery, and diagnostic symbolism.",
    "- Avoid horror unless explicitly requested.",
    "- Apply any modifier within the abstract no-human-figure constraint.",
    "",
    `Modifier: ${modifierInstruction}`,
    "",
    "Output one polished square composition.",
  ].join("\n");
}
