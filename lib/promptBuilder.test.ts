import assert from "node:assert/strict";
import test from "node:test";

import { buildImagePrompt } from "./promptBuilder";

const BRIEF = {
  transcriptSummary: "A person is processing uncertainty while trying to move forward.",
  spokenValence: "mixed",
  visualAffect: "tense",
  signalRelationship: "ambivalent",
  sceneEnergy: "low",
  spatialMood: "compressed",
  paletteMood: "muted_cool",
  abstractionLevel: "semi_figurative",
  confidence: "medium",
  spokenThemes: ["transition", "self-trust"],
  spokenEmotions: ["uncertain", "hopeful"],
  visualAffectSignals: ["brow drawn", "tight jaw"],
  signalTensions: ["fear vs growth"],
  symbolicElements: ["lantern", "forked path"],
  sceneConcept: "A person at a threshold where light and shadow meet.",
  atmosphere: "quiet pressure with a small horizon of possibility.",
  composition: "Layered foreground barriers opening toward a distant clearing.",
} as const;

test("buildImagePrompt includes mixed-signal brief fields and safety rules", () => {
  const prompt = buildImagePrompt(BRIEF);

  assert.match(prompt, /A person is processing uncertainty/);
  assert.match(prompt, /Spoken valence: mixed/);
  assert.match(prompt, /Visual affect: tense/);
  assert.match(prompt, /Signal relationship: ambivalent/);
  assert.match(prompt, /Palette mood: muted_cool/);
  assert.match(prompt, /Signal tensions: fear vs growth/);
  assert.match(prompt, /Visual affect may co-author atmosphere, scale, tension, and composition/);
  assert.match(prompt, /Do not imply diagnosis/);
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
    const prompt = buildImagePrompt(BRIEF, testCase.modifier);
    assert.match(prompt, testCase.expected);
  }
});

test("buildImagePrompt defaults to no modifier and preserves unknown modifier text", () => {
  const defaultPrompt = buildImagePrompt(BRIEF);
  const customPrompt = buildImagePrompt(BRIEF, "custom modifier guidance");

  assert.match(defaultPrompt, /Modifier: none/);
  assert.match(customPrompt, /Modifier: custom modifier guidance/);
});
