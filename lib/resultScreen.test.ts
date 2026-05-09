import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ResultScreen } from "@/components/ResultScreen";

test("result screen renders journal entry summary, emotion chips, additional context, and controls", () => {
  const html = renderToStaticMarkup(
    createElement(ResultScreen, {
      errorMessage: "",
      generatedImage: "base64payload",
      generatedPrompt: "prompt",
      isRegenerating: false,
      mixedSignalBrief: {
        transcriptSummary: "I felt stuck, but I also noticed a steadier mood later in the day.",
        spokenValence: "mixed",
        visualAffect: "calm",
        signalRelationship: "aligned",
        sceneEnergy: "medium",
        spatialMood: "open",
        paletteMood: "muted_warm",
        abstractionLevel: "symbolic",
        confidence: "high",
        spokenThemes: ["transition", "self-trust"],
        spokenEmotions: ["mild frustration", "resolve", "contentment"],
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
  assert.match(html, /Journal entry/);
  assert.match(html, /Summary/);
  assert.match(html, /I felt stuck, but I also noticed a steadier mood later in the day\./);
  assert.match(html, /Emotions/);
  assert.match(html, /class="journal-chip">resolve<\/span>/);
  assert.match(html, /Additional context/);
  assert.match(html, /A path opening through fog/);
  assert.match(html, /Visual signals/);
  assert.match(html, /Signal tensions/);
  assert.match(html, /Edit entry text/);
  assert.match(html, /Update entry/);
  assert.match(html, /Adjust image/);
  assert.match(html, /Start over/);
  assert.match(html, /More hopeful/);
  assert.match(html, /Regenerate/);
  assert.doesNotMatch(html, /Visual journal entry/i);
  assert.doesNotMatch(html, /Mood snapshot/i);
  assert.doesNotMatch(html, /Entry details/i);
  assert.doesNotMatch(html, /Spoken emotions/i);
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
