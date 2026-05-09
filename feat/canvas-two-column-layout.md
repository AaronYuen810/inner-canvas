# Canvas Result Layout Refresh (Two-Column, Summary-First)

## Summary
Redesign the result screen into a responsive two-column layout where the left side is the image and the right side is a concise personal summary panel. De-emphasize advanced/technical UI by moving mixed-signal metadata into a dropdown, minimizing reflection editing prominence, and removing prompt-details display. Keep existing refinement chips and add a custom prompt input for regeneration.

## Key Changes
- **Primary layout**
  - Convert the top result area into a 2-column grid on desktop (`lg`): left = image, right = summary card.
  - Keep single-column stacking on mobile/tablet (`< lg`) with image first, summary second.
  - Reduce image dominance by constraining image container width/height ratio and removing full-width "hero" feel.
- **Right-column summary panel**
  - Show a short **first-person audio summary** derived from the current transcript text (rewrite from transcript; fallback to existing summary text if transcript is empty).
  - Add **Top feelings** section sourced from `mixedSignalBrief.spokenEmotions`, showing only detected items (no forced fill to 5).
  - Keep tone/copy concise and user-facing (non-technical language).
- **Metadata visibility**
  - Move all mixed-signal brief details into a collapsed `<details>` section (scene concept, atmosphere, relationship, themes, etc.).
  - Label as secondary information so it doesn't dominate the surface.
- **Edit reflection de-emphasis**
  - Keep functionality unchanged, but visually reduce prominence:
    - smaller section treatment
    - secondary heading/copy
    - no large visual weight near top of page
- **Refinement controls**
  - Keep existing suggestion chips (`More hopeful`, `More abstract`, `More intense`, `Less dark`, `Regenerate`).
  - Add a **custom prompt input** in the same refine section; submitting uses existing `onRegenerate(modifier)` path with user-entered text.
  - Hide/remove "Prompt details" UI entirely from the result screen (no prompt preview disclosure).

## Interfaces / Behavior
- No backend API contract changes required.
- Reuse existing `modifier?: string` flow for custom prompt text.
- Keep existing regeneration/loading/reset behavior and error handling.
- Implement in:
  - `components/ResultScreen.tsx`
  - `lib/resultScreen.test.ts`
  - `app/page.tsx` (only if prop wiring is needed)

## Test Plan
- Update render tests to assert:
  - two-column summary structure labels/content are present
  - first-person summary block renders
  - top feelings list renders from detected emotions only
  - mixed-signal metadata is in a collapsible details block
  - "Prompt details" no longer renders
  - refine chips still render
  - custom refine input is present and submit-capable
- Keep existing loading-state and regenerate-control tests passing.
- Manual checks:
  - desktop 2-column and mobile stacked behavior
  - custom prompt regeneration triggers same loading/disabled states
  - edit reflection still works but is visually secondary

## Assumptions
- "No need to show prompt details" means remove the prompt-preview disclosure from UI, not from internal state.
- First-person summary can be generated client-side from transcript text without adding a new LLM/API step.
- "Top 5 feelings" will display only available detected feelings when fewer than five exist.
