import assert from "node:assert/strict";
import test from "node:test";

import { POST } from "../app/api/analyze-reflection/route";

type MockFetch = typeof fetch;

const VALID_PAYLOAD = {
  summary: "Short summary",
  themes: ["theme"],
  emotionalKeywords: ["calm"],
  metaphors: ["open road"],
  conflicts: ["certainty vs uncertainty"],
  visualSymbols: ["lantern"],
  oneSentenceInterpretation: "A turning point with cautious optimism.",
};

function setEnv() {
  process.env.OPENAI_API_KEY = "test-key";
  process.env.OPENAI_TEXT_MODEL = "gpt-test";
}

test("POST /api/analyze-reflection returns validated JSON payload", async (t) => {
  setEnv();

  const mockFetch: MockFetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body ?? "{}"));
    assert.equal(body.model, "gpt-test");
    assert.deepEqual(body.response_format, { type: "json_object" });

    return new Response(
      JSON.stringify({
        id: "chatcmpl_123",
        object: "chat.completion",
        created: 0,
        model: "gpt-test",
        choices: [
          {
            index: 0,
            finish_reason: "stop",
            message: {
              role: "assistant",
              content: JSON.stringify(VALID_PAYLOAD),
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

  const request = new Request("http://localhost/api/analyze-reflection", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ transcript: "I feel uncertain but hopeful." }),
  });

  const response = await POST(request);
  const json = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(json, VALID_PAYLOAD);
});

test("POST /api/analyze-reflection returns recoverable error on JSON parse failure", async (t) => {
  setEnv();

  const mockFetch: MockFetch = async () => {
    return new Response(
      JSON.stringify({
        id: "chatcmpl_123",
        object: "chat.completion",
        created: 0,
        model: "gpt-test",
        choices: [
          {
            index: 0,
            finish_reason: "stop",
            message: {
              role: "assistant",
              content: "not-json",
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

  const request = new Request("http://localhost/api/analyze-reflection", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ transcript: "Sample transcript" }),
  });

  const response = await POST(request);
  const json = await response.json();

  assert.equal(response.status, 502);
  assert.match(String(json.error), /couldn/i);
});

test("POST /api/analyze-reflection returns recoverable error on shape validation failure", async (t) => {
  setEnv();

  const mockFetch: MockFetch = async () => {
    return new Response(
      JSON.stringify({
        id: "chatcmpl_123",
        object: "chat.completion",
        created: 0,
        model: "gpt-test",
        choices: [
          {
            index: 0,
            finish_reason: "stop",
            message: {
              role: "assistant",
              content: JSON.stringify({
                summary: "ok",
                themes: ["a"],
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

  const request = new Request("http://localhost/api/analyze-reflection", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ transcript: "Sample transcript" }),
  });

  const response = await POST(request);
  const json = await response.json();

  assert.equal(response.status, 502);
  assert.match(String(json.error), /couldn/i);
});
