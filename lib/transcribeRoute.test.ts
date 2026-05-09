import assert from "node:assert/strict";
import test from "node:test";

import { POST } from "../app/api/transcribe/route";

const ORIGINAL_ENV = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_TRANSCRIBE_MODEL: process.env.OPENAI_TRANSCRIBE_MODEL,
};

const ORIGINAL_FETCH = globalThis.fetch;

function setRequiredEnv() {
  process.env.OPENAI_API_KEY = "test-key";
  process.env.OPENAI_TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe";
}

function restoreEnvAndFetch() {
  process.env.OPENAI_API_KEY = ORIGINAL_ENV.OPENAI_API_KEY;
  process.env.OPENAI_TRANSCRIBE_MODEL = ORIGINAL_ENV.OPENAI_TRANSCRIBE_MODEL;
  globalThis.fetch = ORIGINAL_FETCH;
}

test.afterEach(() => {
  restoreEnvAndFetch();
});

test("returns transcript on successful transcription", async () => {
  setRequiredEnv();

  globalThis.fetch = async () =>
    new Response(JSON.stringify({ text: "calm and hopeful" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

  const formData = new FormData();
  formData.set("audio", new File(["fake-audio"], "sample.webm", { type: "audio/webm" }));
  const request = new Request("http://localhost/api/transcribe", {
    method: "POST",
    body: formData,
  });

  const response = await POST(request);
  const payload = (await response.json()) as { transcript: string };

  assert.equal(response.status, 200);
  assert.equal(payload.transcript, "calm and hopeful");
});

test("returns 400 when no file is provided", async () => {
  setRequiredEnv();

  const formData = new FormData();
  const request = new Request("http://localhost/api/transcribe", {
    method: "POST",
    body: formData,
  });

  const response = await POST(request);
  const payload = (await response.json()) as { error: string };

  assert.equal(response.status, 400);
  assert.match(payload.error, /upload exactly one valid audio file/i);
});

test("returns 400 when file is not audio", async () => {
  setRequiredEnv();

  const formData = new FormData();
  formData.set("audio", new File(["not-audio"], "notes.txt", { type: "text/plain" }));
  const request = new Request("http://localhost/api/transcribe", {
    method: "POST",
    body: formData,
  });

  const response = await POST(request);
  const payload = (await response.json()) as { error: string };

  assert.equal(response.status, 400);
  assert.match(payload.error, /upload exactly one valid audio file/i);
});

test("returns safe error when upstream transcription fails", async () => {
  setRequiredEnv();

  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: { message: "internal stack trace" } }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });

  const formData = new FormData();
  formData.set("audio", new File(["fake-audio"], "sample.webm", { type: "audio/webm" }));
  const request = new Request("http://localhost/api/transcribe", {
    method: "POST",
    body: formData,
  });

  const response = await POST(request);
  const payload = (await response.json()) as { error: string };

  assert.equal(response.status, 502);
  assert.equal(
    payload.error,
    "Transcription is currently unavailable. Please try again later."
  );
  assert.doesNotMatch(payload.error, /stack trace|internal/i);
});

