import assert from "node:assert/strict";
import test from "node:test";

import { POST } from "../app/api/analyze-facial-expression/route";

type MockFetch = typeof fetch;

const FRAME = "data:image/jpeg;base64,aGVsbG8=";

function setEnv() {
  process.env.OPENAI_API_KEY = "test-key";
  process.env.OPENAI_VISION_MODEL = "gpt-4.1-mini";
}

test("POST /api/analyze-facial-expression returns normalized facial affect", async (t) => {
  setEnv();

  const mockFetch: MockFetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body ?? "{}"));
    assert.equal(body.model, "gpt-4.1-mini");
    assert.equal(body.response_format.type, "json_object");
    assert.equal(body.messages[1].content.filter((item: { type: string }) => item.type === "image_url").length, 3);

    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                primaryEmotion: "Tense",
                secondaryEmotions: ["Focused", "Sad"],
                visualEvidence: ["Brow drawn together", "Lowered gaze"],
                sceneInfluence:
                  "Add compressed space and taut lighting while preserving the reflection's symbols.",
                confidence: "medium",
              }),
            },
          },
        ],
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  };

  t.mock.method(globalThis, "fetch", mockFetch);

  const request = new Request("http://localhost/api/analyze-facial-expression", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      consent: true,
      frames: [FRAME, FRAME, FRAME],
    }),
  });

  const response = await POST(request);
  const json = await response.json();

  assert.equal(response.status, 200);
  assert.equal(json.primaryEmotion, "tense");
  assert.deepEqual(json.secondaryEmotions, ["focused", "sad"]);
  assert.deepEqual(json.visualEvidence, ["brow drawn together", "lowered gaze"]);
  assert.equal(json.confidence, "medium");
});

test("POST /api/analyze-facial-expression requires explicit consent", async () => {
  setEnv();

  const request = new Request("http://localhost/api/analyze-facial-expression", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      frames: [FRAME, FRAME, FRAME],
    }),
  });

  const response = await POST(request);
  const json = await response.json();

  assert.equal(response.status, 400);
  assert.match(String(json.error), /provide consent/i);
});

test("POST /api/analyze-facial-expression rejects invalid frame payloads", async () => {
  setEnv();

  const request = new Request("http://localhost/api/analyze-facial-expression", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      consent: true,
      frames: ["not-an-image"],
    }),
  });

  const response = await POST(request);
  const json = await response.json();

  assert.equal(response.status, 400);
  assert.match(String(json.error), /valid sampled frames/i);
});

test("POST /api/analyze-facial-expression returns safe error for invalid model JSON", async (t) => {
  setEnv();

  const mockFetch: MockFetch = async () =>
    new Response(
      JSON.stringify({
        choices: [{ message: { content: "{\"primaryEmotion\":\"tense\"}" } }],
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );

  t.mock.method(globalThis, "fetch", mockFetch);

  const request = new Request("http://localhost/api/analyze-facial-expression", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      consent: true,
      frames: [FRAME, FRAME, FRAME],
    }),
  });

  const response = await POST(request);
  const json = await response.json();

  assert.equal(response.status, 502);
  assert.match(String(json.error), /currently unavailable/i);
});
