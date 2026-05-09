import OpenAI from "openai";
import { NextResponse } from "next/server";

type ReflectionAnalysis = {
  summary: string;
  themes: string[];
  emotionalKeywords: string[];
  metaphors: string[];
  conflicts: string[];
  visualSymbols: string[];
  oneSentenceInterpretation: string;
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
  const model = process.env.OPENAI_TEXT_MODEL;

  if (!apiKey || !model) {
    return NextResponse.json(
      { error: "Service is temporarily unavailable. Please try again shortly." },
      { status: 500 }
    );
  }

  let transcript = "";

  try {
    const body = (await request.json()) as { transcript?: unknown };
    transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";
  } catch {
    return NextResponse.json(
      { error: "Please submit a valid reflection transcript and try again." },
      { status: 400 }
    );
  }

  if (!transcript) {
    return NextResponse.json(
      { error: "Please submit a valid reflection transcript and try again." },
      { status: 400 }
    );
  }

  const client = new OpenAI({ apiKey });

  try {
    const completion = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You analyze reflection transcripts and return JSON only. Treat the user's words as the source of truth. Do not diagnose, speculate clinically, or infer medical conditions.",
        },
        {
          role: "user",
          content:
            `Analyze the reflection transcript below and return only a JSON object with exactly these keys: ` +
            `summary, themes, emotionalKeywords, metaphors, conflicts, visualSymbols, oneSentenceInterpretation. ` +
            `The string-array fields must contain only strings. Transcript:\n\n${transcript}`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    const rawJson = getModelResponseText(content);

    if (!rawJson) {
      return NextResponse.json(
        {
          error:
            "We couldn’t process your reflection just now. Please try again.",
        },
        { status: 502 }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson) as unknown;
    } catch {
      return NextResponse.json(
        {
          error:
            "We couldn’t process your reflection just now. Please try again.",
        },
        { status: 502 }
      );
    }

    if (!isReflectionAnalysis(parsed)) {
      return NextResponse.json(
        {
          error:
            "We couldn’t process your reflection just now. Please try again.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      { error: "We couldn't analyze your reflection right now. Please try again." },
      { status: 500 }
    );
  }
}
