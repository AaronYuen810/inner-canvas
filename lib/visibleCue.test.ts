import assert from "node:assert/strict";
import test from "node:test";

import {
  buildFallbackVisibleCueEstimate,
  deriveVisibleCueEstimate,
  DEFAULT_VISIBLE_TONES,
} from "./visibleCue";

test("fallback visible cue estimate stays manual and cautious", () => {
  const estimate = buildFallbackVisibleCueEstimate();

  assert.deepEqual(estimate.suggestedTone, ["thoughtful", "soft", "quiet"]);
  assert.match(estimate.message, /manual visible tone selection/i);
});

test("deriveVisibleCueEstimate maps motion and off-center cues to cautious tones", () => {
  const estimate = deriveVisibleCueEstimate({
    faceDetected: true,
    movement: 0.09,
    offCenter: 0.22,
  });

  assert.match(estimate.cueSignals.join(" "), /face present/i);
  assert.match(estimate.cueSignals.join(" "), /head movement/i);
  assert.match(estimate.cueSignals.join(" "), /looking away/i);
  assert.ok(estimate.suggestedTone.includes("animated"));
  assert.ok(estimate.suggestedTone.includes("tense"));
});

test("deriveVisibleCueEstimate stays within supported tone vocabulary", () => {
  const estimate = deriveVisibleCueEstimate({
    faceDetected: true,
    movement: 0.01,
    offCenter: 0.01,
  });

  estimate.suggestedTone.forEach((tone) => {
    assert.ok(DEFAULT_VISIBLE_TONES.includes(tone));
  });
  assert.ok(estimate.suggestedTone.includes("slightly hopeful"));
});
