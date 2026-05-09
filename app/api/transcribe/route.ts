import { NextResponse } from "next/server";
import OpenAI from "openai";

const TRANSCRIBE_UNAVAILABLE_MESSAGE =
  "Transcription is currently unavailable. Please try again later.";
const INVALID_AUDIO_MESSAGE =
  "Please upload exactly one valid audio file and try again.";

function isSupportedRecordingType(fileType: string): boolean {
  const normalizedType = fileType.toLowerCase();
  return normalizedType.startsWith("audio/") || normalizedType.startsWith("video/");
}

function getSingleAudioFile(formData: FormData): File | null {
  const files = Array.from(formData.values()).filter(
    (value): value is File => value instanceof File
  );

  if (files.length !== 1) {
    return null;
  }

  const [file] = files;
  if (!file || file.size === 0) {
    return null;
  }

  if (file.type && !isSupportedRecordingType(file.type)) {
    return null;
  }

  return file;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_TRANSCRIBE_MODEL;

  if (!apiKey || !model) {
    return NextResponse.json(
      { error: TRANSCRIBE_UNAVAILABLE_MESSAGE },
      { status: 500 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: INVALID_AUDIO_MESSAGE }, { status: 400 });
  }

  const file = getSingleAudioFile(formData);
  if (!file) {
    return NextResponse.json({ error: INVALID_AUDIO_MESSAGE }, { status: 400 });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const transcription = await openai.audio.transcriptions.create({
      file,
      model,
    });

    const transcript = transcription.text?.trim();
    if (!transcript) {
      throw new Error("Missing transcript");
    }

    return NextResponse.json({ transcript });
  } catch {
    return NextResponse.json(
      { error: TRANSCRIBE_UNAVAILABLE_MESSAGE },
      { status: 502 }
    );
  }
}
