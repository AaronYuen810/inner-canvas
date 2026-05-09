import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { IntroConsentScreen } from "@/components/IntroConsentScreen";
import { ResultScreen } from "@/components/ResultScreen";

test("intro and consent screens describe direct reflect-to-canvas flow", () => {
  const introHtml = renderToStaticMarkup(
    createElement(IntroConsentScreen, {
      continueLabel: "Continue",
      onContinue: () => {},
      stage: "intro",
    })
  );
  const consentHtml = renderToStaticMarkup(
    createElement(IntroConsentScreen, {
      continueLabel: "Continue",
      onContinue: () => {},
      stage: "consent",
    })
  );

  assert.match(introHtml, /quiet visual companion/i);
  assert.match(consentHtml, /up to five sampled still frames/i);
  assert.match(consentHtml, /audio\/text-only still works/i);
  assert.doesNotMatch(consentHtml, /Allow cloud facial expression analysis/i);
});

test("canvas screen includes loading state and transcript edit confirmation controls", () => {
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
      stagedTranscript: "Edited reflection",
      transcript: "Original reflection",
    })
  );

  assert.match(html, /Creating canvas\.\.\./);
  assert.match(html, /Edit reflection/);
  assert.match(html, /Confirm edits and regenerate/);
  assert.doesNotMatch(html, /Confirm tone/i);
});

test("result screen copy avoids diagnosis wording", () => {
  const html = renderToStaticMarkup(
    createElement(ResultScreen, {
      errorMessage: "",
      generatedImage: "",
      generatedPrompt: "",
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

  assert.match(html, /one possible visual companion/i);
});
