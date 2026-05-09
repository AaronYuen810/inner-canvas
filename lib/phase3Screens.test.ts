import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { GeneratingScreen } from "@/components/GeneratingScreen";
import { IntroConsentScreen } from "@/components/IntroConsentScreen";
import { ReflectionReviewScreen } from "@/components/ReflectionReviewScreen";
import { ResultScreen } from "@/components/ResultScreen";

test("intro and consent screens keep cautious tone language", () => {
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

  assert.match(introHtml, /visual interpretation/i);
  assert.match(consentHtml, /visible emotional cue/i);
});

test("review screen includes editable visible cue estimate notice", () => {
  const html = renderToStaticMarkup(
    createElement(ReflectionReviewScreen, {
      analysis: null,
      canContinue: false,
      continueLabel: "Continue",
      onAddTone: () => {},
      onConfirmVisibleTone: () => {},
      onContinue: () => {},
      onRemoveTone: () => {},
      onToneInputChange: () => {},
      toneInputValue: "",
      transcript: "",
      visibleTone: ["thoughtful", "soft"],
    })
  );

  assert.match(html, /This is only a visible cue estimate\. You can edit it\./);
  assert.match(html, /Confirm visible tone/);
  assert.match(html, /disabled=/);
});

test("generating and result screens avoid diagnosis wording", () => {
  const generatingHtml = renderToStaticMarkup(createElement(GeneratingScreen));
  const resultHtml = renderToStaticMarkup(
    createElement(ResultScreen, {
      confirmedVisibleTone: ["thoughtful"],
      errorMessage: "",
      generatedImage: "",
      isRegenerating: false,
      onRegenerate: () => {},
      onReset: () => {},
      oneSentenceInterpretation:
        "This image reflects one possible visual interpretation of the reflection.",
      themes: ["transition"],
    })
  );

  assert.match(generatingHtml, /does not infer a diagnosis/i);
  assert.match(resultHtml, /one possible visual interpretation/i);
});
