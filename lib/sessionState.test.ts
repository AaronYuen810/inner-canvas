import assert from "node:assert/strict";
import test from "node:test";

import {
  INITIAL_SESSION_STATE,
  canTransition,
  resetSessionState,
  stopMediaStream,
} from "./sessionState";

test("canTransition allows only next stage", () => {
  assert.equal(canTransition("recording", "result"), true);
  assert.equal(canTransition("result", "recording"), false);
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

test("initial session state starts on recording", () => {
  assert.equal(INITIAL_SESSION_STATE.stage, "recording");
});

test("resetSessionState clears phase 2 session fields and returns recording", () => {
  const state = {
    ...INITIAL_SESSION_STATE,
    stage: "result" as const,
    mediaStream: {
      getTracks() {
        return [{ stop() {} }];
      },
    } as unknown as MediaStream,
    transcript: "sample transcript",
    stagedTranscript: "edited transcript",
    sampledFaceFrames: ["data:image/jpeg;base64,aGVsbG8="],
    mixedSignalBrief: {
      transcriptSummary: "summary",
      spokenValence: "neutral" as const,
      visualAffect: "calm" as const,
      signalRelationship: "aligned" as const,
      sceneEnergy: "low" as const,
      spatialMood: "balanced" as const,
      paletteMood: "muted_cool" as const,
      abstractionLevel: "symbolic" as const,
      confidence: "medium" as const,
      spokenThemes: ["change"],
      spokenEmotions: ["relief"],
      visualAffectSignals: ["soft gaze"],
      signalTensions: [],
      symbolicElements: ["path"],
      sceneConcept: "concept",
      atmosphere: "atmosphere",
      composition: "composition",
    },
    generatedPrompt: "prompt",
    generatedImage: "base64",
    isLoading: true,
    errorMessage: "error",
  };

  const reset = resetSessionState(state);

  assert.deepEqual(reset, INITIAL_SESSION_STATE);
});
