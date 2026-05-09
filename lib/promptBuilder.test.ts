import assert from "node:assert/strict";
import test from "node:test";

import { buildImagePrompt } from "./promptBuilder";

const ANALYSIS = {
  summary: "A person is processing uncertainty while trying to move forward.",
  themes: ["transition", "self-trust"],
  emotionalKeywords: ["uncertain", "hopeful"],
  metaphors: ["standing at a crossroads"],
  conflicts: ["fear vs growth"],
  visualSymbols: ["lantern", "forked path"],
  oneSentenceInterpretation: "This image reflects one possible turning point toward cautious hope.",
};

test("buildImagePrompt includes reflection analysis, visible tone, and rules", () => {
  const prompt = buildImagePrompt(ANALYSIS, ["thoughtful", "quiet"]);

  assert.match(prompt, /A person is processing uncertainty/);
  assert.match(prompt, /transition, self-trust/);
  assert.match(prompt, /thoughtful, quiet/);
  assert.match(prompt, /Visible tone only influences mood, color, lighting, atmosphere, and intensity/);
  assert.match(prompt, /Avoid horror unless explicitly requested/);
});

test("buildImagePrompt maps known modifier guidance deterministically", () => {
  const cases: Array<{ modifier: string; expected: RegExp }> = [
    {
      modifier: "More hopeful",
      expected: /Brighten lighting, use a warmer palette, and include a clearer sense of path forward\./,
    },
    {
      modifier: "More abstract",
      expected: /Reduce literal human figure details and increase symbolic forms and composition\./,
    },
    {
      modifier: "More intense",
      expected: /Increase contrast, scale, motion, and emotional pressure without introducing horror\./,
    },
    {
      modifier: "Less dark",
      expected: /Soften shadows, reduce visual heaviness, and preserve emotional complexity\./,
    },
  ];

  for (const testCase of cases) {
    const prompt = buildImagePrompt(ANALYSIS, ["soft"], "watercolor", testCase.modifier);
    assert.match(prompt, /Style direction: watercolor/);
    assert.match(prompt, testCase.expected);
  }
});

test("buildImagePrompt defaults to no modifier and preserves unknown modifier text", () => {
  const defaultPrompt = buildImagePrompt(ANALYSIS, ["soft"]);
  const customPrompt = buildImagePrompt(ANALYSIS, ["soft"], undefined, "custom modifier guidance");

  assert.match(defaultPrompt, /Modifier: none/);
  assert.match(customPrompt, /Modifier: custom modifier guidance/);
});
