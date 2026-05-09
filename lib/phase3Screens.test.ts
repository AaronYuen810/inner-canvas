import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { RecordingScreen } from "@/components/RecordingScreen";
import { ResultScreen } from "@/components/ResultScreen";
import { INITIAL_SESSION_STATE } from "@/lib/sessionState";

test("session starts directly on the recording stage", () => {
  assert.equal(INITIAL_SESSION_STATE.stage, "recording");
});

test("recording screen uses focused entry copy and removes repeated disclaimer text", () => {
  const html = renderToStaticMarkup(
    createElement(RecordingScreen, {
      continueLabel: "Create entry",
      onAudioReady: () => {},
      onContinue: () => {},
      onError: () => {},
      onFaceFramesReady: () => {},
      onLoadSampleTranscript: () => {},
      onStreamReady: () => {},
      onTranscriptInputChange: () => {},
      transcriptInputValue: "",
      isCreatingCanvas: false,
    })
  );

  assert.match(html, /Create a visual journal entry/i);
  assert.match(
    html,
    /Speak, show, or type what is here right now\. InnerCanvas turns it into a visual journal and mood snapshot\./i
  );
  assert.doesNotMatch(html, /up to five low-detail still frames may be sampled/i);
});

test("canvas screen includes loading state and transcript edit confirmation controls", () => {
  const html = renderToStaticMarkup(
    createElement(ResultScreen, {
      errorMessage: "",
      generatedImage: "",
      isRegenerating: true,
      mixedSignalBrief: null,
      onConfirmTranscriptEdit: () => {},
      onDiscardTranscriptEdit: () => {},
      onRegenerate: () => {},
      onReset: () => {},
      onStageTranscriptEdit: () => {},
      stagedTranscript: "Edited reflection",
      transcript: "Original reflection",
    })
  );

  assert.match(html, /Creating canvas\.\.\./);
  assert.match(html, /Edit entry text/);
  assert.match(html, /Update entry/);
  assert.doesNotMatch(html, /Confirm tone/i);
});

test("result screen copy uses organized journal-entry output and removes disclaimer wording", () => {
  const html = renderToStaticMarkup(
    createElement(ResultScreen, {
      errorMessage: "",
      generatedImage: "",
      isRegenerating: false,
      mixedSignalBrief: null,
      onConfirmTranscriptEdit: () => {},
      onDiscardTranscriptEdit: () => {},
      onRegenerate: () => {},
      onReset: () => {},
      onStageTranscriptEdit: () => {},
      stagedTranscript: "Reflection",
      transcript: "Reflection",
    })
  );

  assert.match(html, /Journal entry/i);
  assert.match(html, /Summary/i);
  assert.match(html, /Emotions/i);
  assert.match(html, /Additional context/i);
  assert.doesNotMatch(html, /Visual journal entry/i);
  assert.doesNotMatch(html, /Mood snapshot/i);
  assert.doesNotMatch(html, /Entry details/i);
  assert.doesNotMatch(html, /not a conclusion about you/i);
});
