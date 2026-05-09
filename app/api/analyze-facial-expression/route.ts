import OpenAI from "openai";
import { NextResponse } from "next/server";

const INVALID_REQUEST_MESSAGE =
  "Please provide consent and one to five valid sampled frames before analysis.";
const UNAVAILABLE_MESSAGE =
  "Facial expression analysis is currently unavailable. Continuing without it is supported.";
const DEFAULT_VISION_MODEL = "gpt-4.1-mini";
const MAX_FRAMES = 5;

type FacialAffect = {
  primaryEmotion: string;
  secondaryEmotions: string[];
  visualEvidence: string[];
  sceneInfluence: string;
  confidence: "low" | "medium" | "high";
};

type AnalyzeFacialExpressionRequest = {
  consent?: unknown;
  frames?: unknown;
};

function isValidImageDataUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^data:image\/(png|jpeg|jpg|webp);base64,[a-z0-9+/=]+$/i.test(value.trim())
  );
}

function normalizeFrames(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const frames = value.map((frame) => (typeof frame === "string" ? frame.trim() : ""));
  if (frames.length === 0 || frames.length > MAX_FRAMES) {
    return null;
  }

  if (!frames.every(isValidImageDataUrl)) {
    return null;
  }

  return frames;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isConfidence(value: unknown): value is FacialAffect["confidence"] {
  return value === "low" || value === "medium" || value === "high";
}

function normalizeStringArray(value: unknown, maxItems: number): string[] {
  if (!isStringArray(value)) {
    return [];
  }

  return value
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeFacialAffect(value: unknown): FacialAffect | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const primaryEmotion =
    typeof candidate.primaryEmotion === "string"
      ? candidate.primaryEmotion.trim().toLowerCase()
      : "";
  const sceneInfluence =
    typeof candidate.sceneInfluence === "string"
      ? candidate.sceneInfluence.trim()
      : "";

  if (!primaryEmotion || !sceneInfluence || !isConfidence(candidate.confidence)) {
    return null;
  }

  return {
    primaryEmotion,
    secondaryEmotions: normalizeStringArray(candidate.secondaryEmotions, 4),
    visualEvidence: normalizeStringArray(candidate.visualEvidence, 6),
    sceneInfluence,
    confidence: candidate.confidence,
  };
}

function getModelResponseText(content: unknown): string | null {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return null;

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

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_VISION_MODEL || process.env.OPENAI_TEXT_MODEL || DEFAULT_VISION_MODEL;

  if (!apiKey) {
    return NextResponse.json({ error: UNAVAILABLE_MESSAGE }, { status: 500 });
  }

  let payload: AnalyzeFacialExpressionRequest;
  try {
    payload = (await request.json()) as AnalyzeFacialExpressionRequest;
  } catch {
    return NextResponse.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  if (payload.consent !== true) {
    return NextResponse.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  const frames = normalizeFrames(payload.frames);
  if (!frames) {
    return NextResponse.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  try {
    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You analyze sampled face frames for a creative reflection app. Return JSON only. Estimate visible affect for art direction, not diagnosis, identity, medical state, or a certain claim about the person.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Review these sampled frames from one short reflection recording. Return exactly this JSON shape: primaryEmotion string, secondaryEmotions string array, visualEvidence string array, sceneInfluence string, confidence one of low/medium/high. Use concise affect labels for internal scene generation. visualEvidence must describe observable facial cues only. sceneInfluence should say how the affect may co-author symbolic scene details without overriding the spoken reflection.",
            },
            ...frames.map((frame) => ({
              type: "image_url" as const,
              image_url: {
                url: frame,
                detail: "low" as const,
              },
            })),
          ],
        },
      ],
    });

    const rawJson = getModelResponseText(completion.choices[0]?.message?.content);
    if (!rawJson) {
      return NextResponse.json({ error: UNAVAILABLE_MESSAGE }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson) as unknown;
    } catch {
      return NextResponse.json({ error: UNAVAILABLE_MESSAGE }, { status: 502 });
    }

    const facialAffect = normalizeFacialAffect(parsed);
    if (!facialAffect) {
      return NextResponse.json({ error: UNAVAILABLE_MESSAGE }, { status: 502 });
    }

    return NextResponse.json(facialAffect);
  } catch {
    return NextResponse.json({ error: UNAVAILABLE_MESSAGE }, { status: 502 });
  }
}
