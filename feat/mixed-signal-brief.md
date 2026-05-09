# Mixed-Signal Brief Implementation Plan

## Summary
Save this plan as `feat/mixed-signals-brief.md`.

Build InnerCanvas around the visible journey **Reflect → Canvas**. Remove the user-facing Review step and move metadata extraction into an internal engine:

`transcript + bounded sampled frames -> gpt-5.5 -> MixedSignalBrief -> deterministic prompt builder -> gpt-image-2`

## Key Changes
- Replace the `Review` and separate `Generating` user stages with a single Canvas experience. Loading belongs inside Canvas.
- Update progress nav to show only **Reflect → Canvas**.
- Change the Reflect CTA to **Create canvas** and the loading copy to “Creating canvas...”.
- Remove visible tone confirmation, tone chips, and review/configuration UI.
- Treat sampled frames as part of normal camera/microphone consent copy. If camera is unavailable, continue audio/text-only.
- Discard sampled frames after the first mixed-signal brief is produced. Keep only transcript, brief, prompt, image, and derived emotional context in browser session state.

## Interfaces
Add:

```bash
OPENAI_MIXED_SIGNAL_MODEL=gpt-5.5
```

Create `POST /api/mixed-signal-brief`.

Request:

```ts
type MixedSignalBriefRequest = {
  transcript: string;
  frames?: string[];
  previousDerivedEmotionalContext?: DerivedEmotionalContext;
};
```

Response:

```ts
type MixedSignalBrief = {
  transcriptSummary: string;
  spokenValence: "negative" | "mixed" | "neutral" | "positive";
  visualAffect: "calm" | "guarded" | "tense" | "sad" | "restless" | "warm" | "flat" | "unreadable";
  signalRelationship: "aligned" | "contrasting" | "amplifying" | "masking" | "ambivalent" | "unclear";
  sceneEnergy: "still" | "low" | "medium" | "high";
  spatialMood: "open" | "balanced" | "compressed" | "fragmented";
  paletteMood: "muted_warm" | "muted_cool" | "earthy" | "desaturated" | "high_contrast" | "luminous";
  abstractionLevel: "symbolic" | "semi_figurative" | "abstract";
  confidence: "low" | "medium" | "high";
  spokenThemes: string[];
  spokenEmotions: string[];
  visualAffectSignals: string[];
  signalTensions: string[];
  symbolicElements: string[];
  sceneConcept: string;
  atmosphere: string;
  composition: string;
};
```

Add:

```ts
type DerivedEmotionalContext = Pick<
  MixedSignalBrief,
  | "visualAffect"
  | "visualAffectSignals"
  | "signalRelationship"
  | "signalTensions"
  | "sceneEnergy"
  | "spatialMood"
  | "paletteMood"
  | "confidence"
>;
```

Refactor prompt building so code accepts `MixedSignalBrief` plus optional modifier and deterministically assembles the final image prompt. Do not ask `gpt-5.5` to write the final image prompt.

Update `/api/generate-image` to accept `mixedSignalBrief` and optional `modifier`, build the prompt server-side, then call `gpt-image-2`.

## Behavior
- Initial generation transcribes audio, sends transcript plus up to 5 sampled frame data URLs to `/api/mixed-signal-brief`, clears frames, then generates the image.
- Missing frames continue text-only.
- Mixed-signal failure creates a local fallback brief.
- Image generation failure shows the existing local backup canvas.
- Regeneration chips reuse the existing `MixedSignalBrief`; they do not re-run `gpt-5.5`.
- Canvas includes **Edit reflection**. Edits are staged and regenerate only after user confirmation.
- Confirmed edits call `/api/mixed-signal-brief` with edited transcript plus `previousDerivedEmotionalContext`, never raw frames.
- Edited transcript controls themes, symbols, and narrative; original derived emotional context preserves the captured moment.

## Test Plan
- Update state-machine tests for no `review` or standalone `generating` user stage.
- Add mixed-signal route tests for transcript+frames, text-only, invalid frames, enum validation, fallback behavior, and previous derived context.
- Update prompt builder tests for enum fields, signal tensions, safety rules, and modifiers.
- Update image route tests to use `mixedSignalBrief` instead of `ReflectionAnalysis` / `FacialAffect`.
- Update render tests for **Create canvas**, Canvas loading state, details drawer, no Review screen, no tone confirmation, and confirmed transcript edit flow.

## Assumptions
- `gpt-5.5` is the default mixed-signal model.
- Browser session state only; no server persistence.
- No audio prosody for hackathon scope. Audio is used only for transcription.
- Existing `analyze-reflection` and `analyze-facial-expression` routes can be deleted or left unused, but the primary flow must use `/api/mixed-signal-brief`.
- Implementation should create the missing `feat/` directory before writing `feat/mixed-signals-brief.md`.
