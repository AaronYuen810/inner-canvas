import assert from "node:assert/strict";
import test from "node:test";

import { POST } from "../app/api/generate-image/route";

type MockFetch = typeof fetch;

const VALID_BRIEF = {
  transcriptSummary: "A person processing uncertainty while moving toward clarity.",
  spokenValence: "mixed",
  visualAffect: "tense",
  signalRelationship: "ambivalent",
  sceneEnergy: "low",
  spatialMood: "compressed",
  paletteMood: "muted_cool",
  abstractionLevel: "semi_figurative",
  confidence: "medium",
  spokenThemes: ["transition", "self-trust"],
  spokenEmotions: ["uncertain", "hopeful"],
  visualAffectSignals: ["tight jaw", "brow drawn"],
  signalTensions: ["fear vs growth"],
  symbolicElements: ["lantern", "forked path"],
  sceneConcept: "A threshold scene where shadowed weight gives way to a lit opening.",
  atmosphere: "Quiet pressure with restrained hope.",
  composition: "Foreground barriers with a narrow center path opening in the distance.",
};

function setEnv() {
  process.env.OPENAI_API_KEY = "test-key";
  process.env.OPENAI_IMAGE_MODEL = "gpt-image-2";
}

test("POST /api/generate-image returns base64 image and built prompt", async (t) => {
  setEnv();

  const mockFetch: MockFetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body ?? "{}"));
    assert.equal(body.model, "gpt-image-2");
    assert.equal(body.n, 1);
    assert.equal(body.size, "1024x1024");
    assert.equal(body.quality, "medium");
    assert.match(String(body.prompt), /A person processing uncertainty while moving toward clarity/);
    assert.match(String(body.prompt), /Signal relationship: ambivalent/);
    assert.match(String(body.prompt), /Signal tensions: fear vs growth/);
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
    body: JSON.stringify({
      mixedSignalBrief: VALID_BRIEF,
      modifier: "More hopeful",
    }),
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
      mixedSignalBrief: VALID_BRIEF,
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
    body: JSON.stringify({ modifier: "More hopeful" }),
  });

  const response = await POST(request);
  const json = await response.json();

  assert.equal(response.status, 400);
  assert.match(String(json.error), /mixed-signal brief/i);
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
    body: JSON.stringify({
      mixedSignalBrief: VALID_BRIEF,
      modifier: "More hopeful",
    }),
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

test("POST /api/generate-image retries with fallback model when configured model is unavailable", async (t) => {
  setEnv();

  const seenModels: string[] = [];
  const mockFetch: MockFetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body ?? "{}"));
    seenModels.push(String(body.model));

    if (body.model === "gpt-image-2") {
      return new Response(
        JSON.stringify({
          error: {
            message:
              "Your organization must be verified to use the model `gpt-image-2`.",
          },
        }),
        {
          status: 403,
          headers: { "content-type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        created: 0,
        data: [{ b64_json: "fallback-base64", revised_prompt: "Fallback revised prompt" }],
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
      mixedSignalBrief: VALID_BRIEF,
      modifier: "More hopeful",
    }),
  });

  const response = await POST(request);
  const json = await response.json();

  assert.equal(response.status, 200);
  assert.equal(json.imageBase64, "fallback-base64");
  assert.deepEqual(seenModels, ["gpt-image-2", "gpt-image-1"]);
});

test("POST /api/generate-image defaults to gpt-image-2 when image model env is unset", async (t) => {
  process.env.OPENAI_API_KEY = "test-key";
  delete process.env.OPENAI_IMAGE_MODEL;

  const seenModels: string[] = [];
  const mockFetch: MockFetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body ?? "{}"));
    seenModels.push(String(body.model));

    return new Response(
      JSON.stringify({
        created: 0,
        data: [{ b64_json: "default-base64" }],
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
      mixedSignalBrief: VALID_BRIEF,
    }),
  });

  const response = await POST(request);
  const json = await response.json();

  assert.equal(response.status, 200);
  assert.equal(json.imageBase64, "default-base64");
  assert.deepEqual(seenModels, ["gpt-image-2"]);
});
