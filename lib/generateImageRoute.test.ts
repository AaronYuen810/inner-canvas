import assert from "node:assert/strict";
import test from "node:test";

import { POST } from "../app/api/generate-image/route";

type MockFetch = typeof fetch;

const VALID_BODY = {
  analysis: {
    summary: "Short summary",
    themes: ["theme one"],
    emotionalKeywords: ["calm"],
    metaphors: ["open road"],
    conflicts: ["certainty vs uncertainty"],
    visualSymbols: ["lantern"],
    oneSentenceInterpretation: "This image reflects one possible path through uncertainty.",
  },
  confirmedVisibleTone: ["thoughtful", "soft"],
  style: "watercolor",
  modifier: "More hopeful",
};

function setEnv() {
  process.env.OPENAI_API_KEY = "test-key";
  process.env.OPENAI_IMAGE_MODEL = "gpt-image-2";
}

test("POST /api/generate-image returns base64 image and prompt", async (t) => {
  setEnv();

  const mockFetch: MockFetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body ?? "{}"));
    assert.equal(body.model, "gpt-image-2");
    assert.equal(body.n, 1);
    assert.equal(body.size, "1024x1024");
    assert.equal(body.quality, "medium");
    assert.match(String(body.prompt), /Short summary/);
    assert.match(String(body.prompt), /thoughtful, soft/);
    assert.match(String(body.prompt), /Brighten lighting, use a warmer palette/);

    return new Response(
      JSON.stringify({
        created: 0,
        data: [{ b64_json: "mock-base64", revised_prompt: "Revised prompt" }],
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  };

  t.mock.method(globalThis, "fetch", mockFetch);

  const request = new Request("http://localhost/api/generate-image", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(VALID_BODY),
  });

  const response = await POST(request);
  const json = await response.json();

  assert.equal(response.status, 200);
  assert.equal(json.imageBase64, "mock-base64");
  assert.equal(json.revisedPrompt, "Revised prompt");
  assert.match(String(json.prompt), /Create one symbolic, emotionally gentle visual interpretation/);
});

test("POST /api/generate-image supports regenerate without modifier and keeps single-image output", async (t) => {
  setEnv();

  const mockFetch: MockFetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body ?? "{}"));
    assert.equal(body.n, 1);
    assert.match(String(body.prompt), /Modifier: none/);

    return new Response(
      JSON.stringify({
        created: 0,
        data: [{ b64_json: "mock-base64" }],
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  };

  t.mock.method(globalThis, "fetch", mockFetch);

  const request = new Request("http://localhost/api/generate-image", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ...VALID_BODY,
      modifier: undefined,
    }),
  });

  const response = await POST(request);
  const json = await response.json();

  assert.equal(response.status, 200);
  assert.equal(json.imageBase64, "mock-base64");
});

test("POST /api/generate-image returns 400 for invalid payload", async () => {
  setEnv();

  const request = new Request("http://localhost/api/generate-image", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ confirmedVisibleTone: ["thoughtful"] }),
  });

  const response = await POST(request);
  const json = await response.json();

  assert.equal(response.status, 400);
  assert.match(String(json.error), /provide analysis and confirmed visible tone/i);
});

test("POST /api/generate-image returns safe error when upstream fails", async (t) => {
  setEnv();

  const mockFetch: MockFetch = async () =>
    new Response(
      JSON.stringify({ error: { message: "internal stack trace details" } }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      }
    );

  t.mock.method(globalThis, "fetch", mockFetch);

  const request = new Request("http://localhost/api/generate-image", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(VALID_BODY),
  });

  const response = await POST(request);
  const json = await response.json();

  assert.equal(response.status, 502);
  assert.equal(
    json.error,
    "Image generation is currently unavailable. Please try again later."
  );
  assert.doesNotMatch(String(json.error), /stack trace|internal/i);
});
