import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ResultScreen } from "@/components/ResultScreen";

test("result screen renders image, interpretation, tone, themes, and controls", () => {
  const html = renderToStaticMarkup(
    createElement(ResultScreen, {
      confirmedVisibleTone: ["thoughtful", "quiet"],
      errorMessage: "",
      generatedImage: "base64payload",
      isRegenerating: false,
      onRegenerate: () => {},
      onReset: () => {},
      oneSentenceInterpretation:
        "This image reflects one possible visual interpretation of the reflection.",
      themes: ["transition", "self-trust"],
    })
  );

  assert.match(html, /data:image\/png;base64,base64payload/);
  assert.match(html, /one possible visual interpretation/);
  assert.match(html, /transition/);
  assert.match(html, /thoughtful/);
  assert.match(html, /More hopeful/);
  assert.match(html, /Regenerate/);
});
