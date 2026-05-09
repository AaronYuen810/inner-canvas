# Focused Journal Entry UX

## Summary

Collapse the opening intro/consent flow so users land directly on the capture screen. Reframe the product around turning a quick visual/audio check-in into a visual journal entry with a mood snapshot.

Remove scattered disclaimer-style copy from the main UI and keep only one quiet footer note for session/privacy reassurance.

## Key Changes

- Start the app at `recording` instead of `intro`, and reduce the visible progress model to `Reflect -> Canvas`.
- Remove `intro` and `consent` from the active flow, navigation labels, next-stage mapping, and default reset target.
- Repurpose the first screen as the focused entry point:
  - Heading: `Create a visual journal entry`
  - Body: `Speak, show, or type what is here right now. InnerCanvas turns it into a visual journal and mood snapshot.`
  - Primary actions: `Start recording`, `Stop recording`, `Create entry`
- Remove repeated disclaimer panels from capture/result screens, including sampled-frame explanations, `not a conclusion about you`, and privacy chip grids.
- Add one footer-style line outside the main task area: `Session-only. No account or saved history. Start over clears this entry.`
- Simplify reset copy from `Start over / delete session` to `Start over`.

## Result Experience

- Rename the result section from `Your visual companion` to `Visual journal entry`.
- Show the generated image first, then a compact `Mood snapshot` using existing `MixedSignalBrief` fields such as summary, spoken emotions, atmosphere, and scene energy.
- Keep detailed generation metadata hidden behind one optional `Entry details` disclosure.
- Keep edit/regenerate controls, but tighten labels:
  - `Edit reflection` -> `Edit entry text`
  - `Confirm edits and regenerate` -> `Update entry`
  - `Refine the companion image` -> `Adjust image`

## Tests

- Update render tests to assert the app starts on the recording screen and no longer renders intro/consent copy.
- Add assertions that repeated disclaimer phrases are absent from main screens.
- Add result-screen assertions for `Visual journal entry`, `Mood snapshot`, and simplified reset/action labels.
- Run `npm test` and `npm run build` after implementation.

## Assumptions

- Browser permission prompts still occur only when recording starts; no custom consent step is needed.
- Camera/frame sampling behavior remains unchanged internally, but it is no longer explained repeatedly in the primary UI.
- Mood tracking means a lightweight mood snapshot from existing analysis fields, not a saved mood-history feature.
