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

  assert.match(prompt, /Create an abstract symbolic visual journal image/);
  assert.match(prompt, /Subject: an emotionally gentle abstract composition/);
  assert.match(prompt, /do not depict recognizable people, faces, portraits, bodies, selfies, silhouettes, or literal human figures/i);
  assert.match(prompt, /Translate any references to a person into abstract spatial forms/);
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
      expected: /Push further into non-representational shapes, layered symbolism, texture, and spatial rhythm\./,
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
  assert.match(customPrompt, /Apply any modifier within the abstract no-human-figure constraint/);
});
