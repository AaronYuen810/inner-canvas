import OpenAI from "openai";
import { NextResponse } from "next/server";

import { buildImagePrompt } from "@/lib/promptBuilder";
import { ReflectionAnalysis } from "@/lib/sessionState";

const GENERATION_UNAVAILABLE_MESSAGE =
  "Image generation is currently unavailable. Please try again later.";
const INVALID_REQUEST_MESSAGE =
  "Please provide analysis and confirmed visible tone before generating an image.";

type GenerateImageRequest = {
  analysis?: unknown;
  confirmedVisibleTone?: unknown;
  style?: unknown;
  modifier?: unknown;
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isReflectionAnalysis(value: unknown): value is ReflectionAnalysis {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.summary === "string" &&
    isStringArray(candidate.themes) &&
    isStringArray(candidate.emotionalKeywords) &&
    isStringArray(candidate.metaphors) &&
    isStringArray(candidate.conflicts) &&
    isStringArray(candidate.visualSymbols) &&
    typeof candidate.oneSentenceInterpretation === "string"
  );
}

function normalizeTone(value: unknown): string[] | null {
  if (!isStringArray(value)) {
    return null;
  }

  const cleaned = value.map((tone) => tone.trim()).filter(Boolean);
  if (cleaned.length === 0) {
    return null;
  }

  return cleaned;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_IMAGE_MODEL;

  if (!apiKey || !model) {
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

  if (!isReflectionAnalysis(payload.analysis)) {
    return NextResponse.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  const confirmedVisibleTone = normalizeTone(payload.confirmedVisibleTone);
  if (!confirmedVisibleTone) {
    return NextResponse.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  const style = typeof payload.style === "string" ? payload.style : undefined;
  const modifier = typeof payload.modifier === "string" ? payload.modifier : undefined;
  const prompt = buildImagePrompt(payload.analysis, confirmedVisibleTone, style, modifier);

  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.images.generate({
      model,
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "medium",
    });

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
