import OpenAI from "openai";
import { NextResponse } from "next/server";

import { DerivedEmotionalContext, MixedSignalBrief } from "@/lib/sessionState";

const INVALID_REQUEST_MESSAGE =
  "Please provide a valid reflection transcript with optional valid sampled frames.";
const MIXED_SIGNAL_UNAVAILABLE_MESSAGE =
  "Mixed-signal brief generation is currently unavailable. Please continue with a fallback canvas and try again.";

const DEFAULT_MIXED_SIGNAL_MODEL = "gpt-5.5";
const MAX_FRAMES = 5;

const SPOKEN_VALENCE_VALUES = ["negative", "mixed", "neutral", "positive"] as const;
const VISUAL_AFFECT_VALUES = [
  "calm",
  "guarded",
  "tense",
  "sad",
  "restless",
  "warm",
  "flat",
  "unreadable",
] as const;
const SIGNAL_RELATIONSHIP_VALUES = [
  "aligned",
  "contrasting",
  "amplifying",
  "masking",
  "ambivalent",
  "unclear",
] as const;
const SCENE_ENERGY_VALUES = ["still", "low", "medium", "high"] as const;
const SPATIAL_MOOD_VALUES = ["open", "balanced", "compressed", "fragmented"] as const;
const PALETTE_MOOD_VALUES = [
  "muted_warm",
  "muted_cool",
  "earthy",
  "desaturated",
  "high_contrast",
  "luminous",
] as const;
const ABSTRACTION_LEVEL_VALUES = ["symbolic", "semi_figurative", "abstract"] as const;
const CONFIDENCE_VALUES = ["low", "medium", "high"] as const;

type MixedSignalBriefRequest = {
  transcript?: unknown;
  frames?: unknown;
  previousDerivedEmotionalContext?: unknown;
};

function isValidImageDataUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^data:image\/(png|jpeg|jpg|webp);base64,[a-z0-9+/=]+$/i.test(value.trim())
  );
}

function normalizeFrames(value: unknown): string[] | null {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    return null;
  }

  const frames = value.map((frame) => (typeof frame === "string" ? frame.trim() : ""));
  if (frames.length > MAX_FRAMES) {
    return null;
  }

  if (!frames.every(isValidImageDataUrl)) {
    return null;
  }

  return frames;
}

function normalizeStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    return null;
  }

  return value.map((item) => item.trim()).filter(Boolean);
}

function normalizeEnum<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return (allowed.find((candidate) => candidate === normalized) ?? null) as T | null;
}

function normalizeModel(value: string | undefined): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_MIXED_SIGNAL_MODEL;
}

function normalizeDerivedEmotionalContext(value: unknown): DerivedEmotionalContext | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const visualAffect = normalizeEnum(candidate.visualAffect, VISUAL_AFFECT_VALUES);
  const visualAffectSignals = normalizeStringArray(candidate.visualAffectSignals);
  const signalRelationship = normalizeEnum(candidate.signalRelationship, SIGNAL_RELATIONSHIP_VALUES);
  const signalTensions = normalizeStringArray(candidate.signalTensions);
  const sceneEnergy = normalizeEnum(candidate.sceneEnergy, SCENE_ENERGY_VALUES);
  const spatialMood = normalizeEnum(candidate.spatialMood, SPATIAL_MOOD_VALUES);
  const paletteMood = normalizeEnum(candidate.paletteMood, PALETTE_MOOD_VALUES);
  const confidence = normalizeEnum(candidate.confidence, CONFIDENCE_VALUES);

  if (
    !visualAffect ||
    !visualAffectSignals ||
    !signalRelationship ||
    !signalTensions ||
    !sceneEnergy ||
    !spatialMood ||
    !paletteMood ||
    !confidence
  ) {
    return null;
  }

  return {
    visualAffect,
    visualAffectSignals,
    signalRelationship,
    signalTensions,
    sceneEnergy,
    spatialMood,
    paletteMood,
    confidence,
  };
}

function normalizeMixedSignalBrief(value: unknown): MixedSignalBrief | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const transcriptSummary =
    typeof candidate.transcriptSummary === "string" ? candidate.transcriptSummary.trim() : "";
  const spokenValence = normalizeEnum(candidate.spokenValence, SPOKEN_VALENCE_VALUES);
  const visualAffect = normalizeEnum(candidate.visualAffect, VISUAL_AFFECT_VALUES);
  const signalRelationship = normalizeEnum(candidate.signalRelationship, SIGNAL_RELATIONSHIP_VALUES);
  const sceneEnergy = normalizeEnum(candidate.sceneEnergy, SCENE_ENERGY_VALUES);
  const spatialMood = normalizeEnum(candidate.spatialMood, SPATIAL_MOOD_VALUES);
  const paletteMood = normalizeEnum(candidate.paletteMood, PALETTE_MOOD_VALUES);
  const abstractionLevel = normalizeEnum(candidate.abstractionLevel, ABSTRACTION_LEVEL_VALUES);
  const confidence = normalizeEnum(candidate.confidence, CONFIDENCE_VALUES);
  const spokenThemes = normalizeStringArray(candidate.spokenThemes);
  const spokenEmotions = normalizeStringArray(candidate.spokenEmotions);
  const visualAffectSignals = normalizeStringArray(candidate.visualAffectSignals);
  const signalTensions = normalizeStringArray(candidate.signalTensions);
  const symbolicElements = normalizeStringArray(candidate.symbolicElements);
  const sceneConcept = typeof candidate.sceneConcept === "string" ? candidate.sceneConcept.trim() : "";
  const atmosphere = typeof candidate.atmosphere === "string" ? candidate.atmosphere.trim() : "";
  const composition = typeof candidate.composition === "string" ? candidate.composition.trim() : "";

  if (
    !transcriptSummary ||
    !spokenValence ||
    !visualAffect ||
    !signalRelationship ||
    !sceneEnergy ||
    !spatialMood ||
    !paletteMood ||
    !abstractionLevel ||
    !confidence ||
    !spokenThemes ||
    !spokenEmotions ||
    !visualAffectSignals ||
    !signalTensions ||
    !symbolicElements ||
    !sceneConcept ||
    !atmosphere ||
    !composition
  ) {
    return null;
  }

  return {
    transcriptSummary,
    spokenValence,
    visualAffect,
    signalRelationship,
    sceneEnergy,
    spatialMood,
    paletteMood,
    abstractionLevel,
    confidence,
    spokenThemes,
    spokenEmotions,
    visualAffectSignals,
    signalTensions,
    symbolicElements,
    sceneConcept,
    atmosphere,
    composition,
  };
}

function getModelResponseText(content: unknown): string | null {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return null;
  }

  for (const item of content) {
    if (
      item &&
      typeof item === "object" &&
      "type" in item &&
      "text" in item &&
      (item as { type?: unknown }).type === "text" &&
      typeof (item as { text?: unknown }).text === "string"
    ) {
      return (item as { text: string }).text;
    }
  }

  return null;
}

function buildPromptText(
  transcript: string,
  previousDerivedEmotionalContext: DerivedEmotionalContext | null,
  frameCount: number
): string {
  const derivedContextText = previousDerivedEmotionalContext
    ? JSON.stringify(previousDerivedEmotionalContext)
    : "none provided";

  return [
    "Analyze the reflection transcript and optional sampled frames.",
    "Return JSON only with exactly these keys:",
    "transcriptSummary, spokenValence, visualAffect, signalRelationship, sceneEnergy, spatialMood, paletteMood, abstractionLevel, confidence, spokenThemes, spokenEmotions, visualAffectSignals, signalTensions, symbolicElements, sceneConcept, atmosphere, composition.",
    "Field rules:",
    "- transcriptSummary: write 1-2 concise sentences in first person, as if the user is summarizing what they said. Use only the transcript content; do not summarize sampled frames or add diagnosis.",
    "Enum rules:",
    "- spokenValence: negative|mixed|neutral|positive",
    "- visualAffect: calm|guarded|tense|sad|restless|warm|flat|unreadable",
    "- signalRelationship: aligned|contrasting|amplifying|masking|ambivalent|unclear",
    "- sceneEnergy: still|low|medium|high",
    "- spatialMood: open|balanced|compressed|fragmented",
    "- paletteMood: muted_warm|muted_cool|earthy|desaturated|high_contrast|luminous",
    "- abstractionLevel: symbolic|semi_figurative|abstract",
    "- confidence: low|medium|high",
    "Safety rules:",
    "- Do not diagnose or infer medical conditions.",
    "- Use transcript content as source of truth for themes, symbols, and narrative.",
    "- Use visual frames only to infer visible affect and atmosphere.",
    `Sampled frame count: ${frameCount}`,
    `Transcript:\n${transcript}`,
    `previousDerivedEmotionalContext: ${derivedContextText}`,
  ].join("\n");
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = normalizeModel(process.env.OPENAI_MIXED_SIGNAL_MODEL);

  if (!apiKey) {
    return NextResponse.json({ error: MIXED_SIGNAL_UNAVAILABLE_MESSAGE }, { status: 500 });
  }

  let payload: MixedSignalBriefRequest;
  try {
    payload = (await request.json()) as MixedSignalBriefRequest;
  } catch {
    return NextResponse.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  const transcript = typeof payload.transcript === "string" ? payload.transcript.trim() : "";
  if (!transcript) {
    return NextResponse.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  const frames = normalizeFrames(payload.frames);
  if (!frames) {
    return NextResponse.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  const hasPreviousDerivedContext = payload.previousDerivedEmotionalContext !== undefined;
  const previousDerivedEmotionalContext = hasPreviousDerivedContext
    ? normalizeDerivedEmotionalContext(payload.previousDerivedEmotionalContext)
    : null;

  if (hasPreviousDerivedContext && !previousDerivedEmotionalContext) {
    return NextResponse.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You produce structured mixed-signal briefs for symbolic art direction. Return JSON only and never include markdown or explanations.",
        },
        {
          role: "user",
          content:
            frames.length === 0
              ? buildPromptText(transcript, previousDerivedEmotionalContext, 0)
              : [
                  {
                    type: "text",
                    text: buildPromptText(
                      transcript,
                      previousDerivedEmotionalContext,
                      frames.length
                    ),
                  },
                  ...frames.map((frame) => ({
                    type: "image_url" as const,
                    image_url: { url: frame, detail: "low" as const },
                  })),
                ],
        },
      ],
    });

    const rawJson = getModelResponseText(completion.choices[0]?.message?.content);
    if (!rawJson) {
      return NextResponse.json({ error: MIXED_SIGNAL_UNAVAILABLE_MESSAGE }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson) as unknown;
    } catch {
      return NextResponse.json({ error: MIXED_SIGNAL_UNAVAILABLE_MESSAGE }, { status: 502 });
    }

    const brief = normalizeMixedSignalBrief(parsed);
    if (!brief) {
      return NextResponse.json({ error: MIXED_SIGNAL_UNAVAILABLE_MESSAGE }, { status: 502 });
    }

    return NextResponse.json(brief);
  } catch {
    return NextResponse.json({ error: MIXED_SIGNAL_UNAVAILABLE_MESSAGE }, { status: 502 });
  }
}
