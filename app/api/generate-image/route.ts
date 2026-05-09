import OpenAI from "openai";
import { NextResponse } from "next/server";

import { buildImagePrompt } from "@/lib/promptBuilder";
import { MixedSignalBrief } from "@/lib/sessionState";

const GENERATION_UNAVAILABLE_MESSAGE =
  "Image generation is currently unavailable. Please try again later.";
const INVALID_REQUEST_MESSAGE =
  "Please provide a valid mixed-signal brief before generating an image.";

type GenerateImageRequest = {
  mixedSignalBrief?: unknown;
  modifier?: unknown;
};

const DEFAULT_IMAGE_MODEL = "gpt-image-2";
const FALLBACK_IMAGE_MODELS = ["gpt-image-1", "gpt-image-1-mini"] as const;

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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isEnumValue<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && allowed.includes(value as T);
}

function isMixedSignalBrief(value: unknown): value is MixedSignalBrief {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.transcriptSummary === "string" &&
    isEnumValue(candidate.spokenValence, SPOKEN_VALENCE_VALUES) &&
    isEnumValue(candidate.visualAffect, VISUAL_AFFECT_VALUES) &&
    isEnumValue(candidate.signalRelationship, SIGNAL_RELATIONSHIP_VALUES) &&
    isEnumValue(candidate.sceneEnergy, SCENE_ENERGY_VALUES) &&
    isEnumValue(candidate.spatialMood, SPATIAL_MOOD_VALUES) &&
    isEnumValue(candidate.paletteMood, PALETTE_MOOD_VALUES) &&
    isEnumValue(candidate.abstractionLevel, ABSTRACTION_LEVEL_VALUES) &&
    isEnumValue(candidate.confidence, CONFIDENCE_VALUES) &&
    isStringArray(candidate.spokenThemes) &&
    isStringArray(candidate.spokenEmotions) &&
    isStringArray(candidate.visualAffectSignals) &&
    isStringArray(candidate.signalTensions) &&
    isStringArray(candidate.symbolicElements) &&
    typeof candidate.sceneConcept === "string" &&
    typeof candidate.atmosphere === "string" &&
    typeof candidate.composition === "string"
  );
}

function normalizeModel(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function modelCandidates(configuredModel: string | null): string[] {
  const candidates = [configuredModel ?? DEFAULT_IMAGE_MODEL, ...FALLBACK_IMAGE_MODELS];
  return [...new Set(candidates)];
}

function supportsGptImageQuality(model: string): boolean {
  return model.startsWith("gpt-image-");
}

function shouldRetryWithFallback(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { status?: unknown; message?: unknown };
  const status = typeof candidate.status === "number" ? candidate.status : null;
  const message = typeof candidate.message === "string" ? candidate.message.toLowerCase() : "";

  if (status === 403 && message.includes("verified to use the model")) {
    return true;
  }

  if ((status === 400 || status === 404) && message.includes("model")) {
    return true;
  }

  return false;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  const configuredModel = normalizeModel(process.env.OPENAI_IMAGE_MODEL);

  if (!apiKey) {
    return NextResponse.json(
      { error: GENERATION_UNAVAILABLE_MESSAGE },
      { status: 500 }
    );
  }

  let payload: GenerateImageRequest;
  try {
    payload = (await request.json()) as GenerateImageRequest;
  } catch {
    return NextResponse.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  if (!isMixedSignalBrief(payload.mixedSignalBrief)) {
    return NextResponse.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  const modifier = typeof payload.modifier === "string" ? payload.modifier : undefined;
  const prompt = buildImagePrompt(payload.mixedSignalBrief, modifier);

  try {
    const openai = new OpenAI({ apiKey });
    let response: Awaited<ReturnType<typeof openai.images.generate>> | null = null;

    for (const model of modelCandidates(configuredModel)) {
      try {
        response = await openai.images.generate({
          model,
          prompt,
          n: 1,
          size: "1024x1024",
          ...(supportsGptImageQuality(model) ? { quality: "medium" as const } : {}),
        });
        break;
      } catch (error) {
        if (!shouldRetryWithFallback(error)) {
          throw error;
        }
      }
    }

    if (!response) {
      throw new Error("No image model is available for this API key");
    }

    const image = response.data?.[0];
    const imageBase64 = image?.b64_json;

    if (!imageBase64) {
      throw new Error("Missing image payload");
    }

    return NextResponse.json({
      imageBase64,
      prompt,
      revisedPrompt: typeof image.revised_prompt === "string" ? image.revised_prompt : undefined,
    });
  } catch {
    return NextResponse.json(
      { error: GENERATION_UNAVAILABLE_MESSAGE },
      { status: 502 }
    );
  }
}
