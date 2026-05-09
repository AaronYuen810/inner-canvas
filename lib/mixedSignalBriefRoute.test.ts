import assert from "node:assert/strict";
import test from "node:test";

import { POST } from "../app/api/mixed-signal-brief/route";

type MockFetch = typeof fetch;

const FRAME = "data:image/jpeg;base64,aGVsbG8=";

const VALID_BRIEF = {
  transcriptSummary: "The speaker is balancing fear and momentum while trying to move forward.",
  spokenValence: "mixed",
  visualAffect: "tense",
  signalRelationship: "ambivalent",
  sceneEnergy: "low",
  spatialMood: "compressed",
  paletteMood: "muted_cool",
  abstractionLevel: "symbolic",
  confidence: "medium",
  spokenThemes: ["transition", "self-trust"],
  spokenEmotions: ["uncertain", "hopeful"],
  visualAffectSignals: ["brow drawn together", "tight lips"],
  signalTensions: ["fear vs growth"],
  symbolicElements: ["lantern", "threshold"],
  sceneConcept: "A narrow passage opening toward a distant lit horizon.",
  atmosphere: "restrained tension with fragile hope.",
  composition: "Foreground pressure easing into a more open background.",
};

function setEnv() {
  process.env.OPENAI_API_KEY = "test-key";
  process.env.OPENAI_MIXED_SIGNAL_MODEL = "gpt-5.5";
}

test("POST /api/mixed-signal-brief supports transcript with sampled frames", async (t) => {
  setEnv();

  const mockFetch: MockFetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body ?? "{}"));
    assert.equal(body.model, "gpt-5.5");
    assert.deepEqual(body.response_format, { type: "json_object" });
    assert.equal(
      body.messages[1].content.filter((item: { type: string }) => item.type === "image_url").length,
      2
    );

    return new Response(
      JSON.stringify({
        choices: [{ message: { content: JSON.stringify(VALID_BRIEF) } }],
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  };

  t.mock.method(globalThis, "fetch", mockFetch);

  const request = new Request("http://localhost/api/mixed-signal-brief", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      transcript: "I feel tense and uncertain, but I still want to try.",
      frames: [FRAME, FRAME],
    }),
  });

  const response = await POST(request);
  const json = await response.json();

  assert.equal(response.status, 200);
  assert.equal(json.signalRelationship, "ambivalent");
  assert.deepEqual(json.signalTensions, ["fear vs growth"]);
});

test("POST /api/mixed-signal-brief supports transcript-only requests", async (t) => {
  setEnv();

  const mockFetch: MockFetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body ?? "{}"));
    assert.equal(typeof body.messages[1].content, "string");
    assert.match(String(body.messages[1].content), /Sampled frame count: 0/);

    return new Response(
      JSON.stringify({
        choices: [{ message: { content: JSON.stringify(VALID_BRIEF) } }],
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  };

  t.mock.method(globalThis, "fetch", mockFetch);

  const request = new Request("http://localhost/api/mixed-signal-brief", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      transcript: "I feel tense and uncertain, but I still want to try.",
    }),
  });

  const response = await POST(request);
  const json = await response.json();

  assert.equal(response.status, 200);
  assert.equal(json.visualAffect, "tense");
});

test("POST /api/mixed-signal-brief treats empty frame arrays as transcript-only requests", async (t) => {
  setEnv();

  const mockFetch: MockFetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body ?? "{}"));
    assert.equal(typeof body.messages[1].content, "string");
    assert.match(String(body.messages[1].content), /Sampled frame count: 0/);

    return new Response(
      JSON.stringify({
        choices: [{ message: { content: JSON.stringify(VALID_BRIEF) } }],
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  };

  t.mock.method(globalThis, "fetch", mockFetch);

  const request = new Request("http://localhost/api/mixed-signal-brief", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      transcript: "I feel tense and uncertain, but I still want to try.",
      frames: [],
    }),
  });

  const response = await POST(request);
  const json = await response.json();

  assert.equal(response.status, 200);
  assert.equal(json.visualAffect, "tense");
});

test("POST /api/mixed-signal-brief rejects invalid frames", async () => {
  setEnv();

  const request = new Request("http://localhost/api/mixed-signal-brief", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      transcript: "Sample transcript",
      frames: ["not-an-image"],
    }),
  });

  const response = await POST(request);
  const json = await response.json();

  assert.equal(response.status, 400);
  assert.match(String(json.error), /valid sampled frames/i);
});

test("POST /api/mixed-signal-brief returns safe error on enum validation failure", async (t) => {
  setEnv();

  const mockFetch: MockFetch = async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                ...VALID_BRIEF,
                spokenValence: "optimistic",
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

  t.mock.method(globalThis, "fetch", mockFetch);

  const request = new Request("http://localhost/api/mixed-signal-brief", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      transcript: "Sample transcript",
    }),
  });

  const response = await POST(request);
  const json = await response.json();

  assert.equal(response.status, 502);
  assert.equal(
    json.error,
    "Mixed-signal brief generation is currently unavailable. Please continue with a fallback canvas and try again."
  );
});

test("POST /api/mixed-signal-brief accepts previousDerivedEmotionalContext", async (t) => {
  setEnv();

  const mockFetch: MockFetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body ?? "{}"));
    assert.match(
      String(body.messages[1].content),
      /\"signalRelationship\":\"masking\"/
    );
    assert.match(
      String(body.messages[1].content),
      /previousDerivedEmotionalContext/
    );

    return new Response(
      JSON.stringify({
        choices: [{ message: { content: JSON.stringify(VALID_BRIEF) } }],
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  };

  t.mock.method(globalThis, "fetch", mockFetch);

  const request = new Request("http://localhost/api/mixed-signal-brief", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      transcript: "Edited reflection text",
      previousDerivedEmotionalContext: {
        visualAffect: "guarded",
        visualAffectSignals: ["averted gaze"],
        signalRelationship: "masking",
        signalTensions: ["calm words vs tense posture"],
        sceneEnergy: "low",
        spatialMood: "compressed",
        paletteMood: "desaturated",
        confidence: "medium",
      },
    }),
  });

  const response = await POST(request);
  const json = await response.json();

  assert.equal(response.status, 200);
  assert.equal(json.transcriptSummary, VALID_BRIEF.transcriptSummary);
});
