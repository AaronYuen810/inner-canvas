import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ReflectionReviewScreen } from "@/components/ReflectionReviewScreen";

test("review screen renders transcript and analysis sections", () => {
  const html = renderToStaticMarkup(
    createElement(ReflectionReviewScreen, {
      analysis: {
        summary: "Summary",
        themes: ["change"],
        emotionalKeywords: ["hopeful"],
        metaphors: ["storm passing"],
        conflicts: ["fear vs growth"],
        visualSymbols: ["path at dawn"],
        oneSentenceInterpretation: "A person moving from tension toward hope.",
      },
      canContinue: true,
      continueLabel: "Continue to generating",
      onAddTone: () => {},
      onConfirmVisibleTone: () => {},
      onContinue: () => {},
      onRemoveTone: () => {},
      onToneInputChange: () => {},
      toneInputValue: "",
      transcript: "I feel stuck, but things are improving.",
      visibleTone: ["thoughtful"],
    })
  );

  assert.match(html, /I feel stuck, but things are improving\./);
  assert.match(html, /A person moving from tension toward hope\./);
  assert.match(html, /change/);
  assert.match(html, /hopeful/);
  assert.match(html, /storm passing/);
  assert.match(html, /fear vs growth/);
  assert.match(html, /path at dawn/);
});
