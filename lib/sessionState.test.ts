import assert from "node:assert/strict";
import test from "node:test";

import {
  INITIAL_SESSION_STATE,
  canTransition,
  resetSessionState,
  stopMediaStream,
} from "./sessionState";

test("canTransition allows only next stage", () => {
  assert.equal(canTransition("intro", "consent"), true);
  assert.equal(canTransition("intro", "recording"), false);
  assert.equal(canTransition("review", "result"), false);
  assert.equal(canTransition("generating", "result"), true);
});

test("stopMediaStream stops all tracks", () => {
  let stopCount = 0;
  const stream = {
    getTracks() {
      return [
        { stop() { stopCount += 1; } },
        { stop() { stopCount += 1; } },
      ];
    },
  } as unknown as MediaStream;

  stopMediaStream(stream);
  assert.equal(stopCount, 2);
});

test("resetSessionState clears phase 2 session fields and returns intro", () => {
  const state = {
    ...INITIAL_SESSION_STATE,
    stage: "result" as const,
    mediaStream: {
      getTracks() {
        return [{ stop() {} }];
      },
    } as unknown as MediaStream,
    transcript: "sample transcript",
    visibleCueEstimate: ["thoughtful"],
    confirmedVisibleTone: ["soft"],
    generatedPrompt: "prompt",
    generatedImage: "base64",
    isLoading: true,
    errorMessage: "error",
  };

  const reset = resetSessionState(state);

  assert.deepEqual(reset, INITIAL_SESSION_STATE);
});
