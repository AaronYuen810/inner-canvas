import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ResultScreen } from "@/components/ResultScreen";

test("result screen renders canvas details, edit reflection, and controls", () => {
  const html = renderToStaticMarkup(
    createElement(ResultScreen, {
      errorMessage: "",
      generatedImage: "base64payload",
      generatedPrompt: "prompt",
      isRegenerating: false,
      mixedSignalBrief: {
        transcriptSummary: "A short summary",
        spokenValence: "mixed",
        visualAffect: "calm",
        signalRelationship: "aligned",
        sceneEnergy: "medium",
        spatialMood: "open",
        paletteMood: "muted_warm",
        abstractionLevel: "symbolic",
        confidence: "high",
        spokenThemes: ["transition", "self-trust"],
        spokenEmotions: ["hopeful"],
        visualAffectSignals: ["steady gaze"],
        signalTensions: ["fear vs momentum"],
        symbolicElements: ["path"],
        sceneConcept: "A path opening through fog",
        atmosphere: "Quiet and warm",
        composition: "Balanced with a central horizon",
      },
      onConfirmTranscriptEdit: () => {},
      onDiscardTranscriptEdit: () => {},
      onRegenerate: () => {},
      onReset: () => {},
      onStageTranscriptEdit: () => {},
      stagedTranscript: "Edited reflection",
      transcript: "Original reflection",
    })
  );

  assert.match(html, /data:image\/png;base64,base64payload/);
  assert.match(html, /Canvas details/);
  assert.match(html, /A path opening through fog/);
  assert.match(html, /Edit reflection/);
  assert.match(html, /Confirm edits and regenerate/);
  assert.match(html, /More hopeful/);
  assert.match(html, /Regenerate/);
  assert.doesNotMatch(html, /Visible tone signal/i);
});

test("result screen shows canvas loading state while regenerating", () => {
  const html = renderToStaticMarkup(
    createElement(ResultScreen, {
      errorMessage: "",
      generatedImage: "",
      generatedPrompt: "",
      isRegenerating: true,
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

  assert.match(html, /Creating canvas\.\.\./);
});
