# InnerCanvas UI/UX Improvement Plan

## Summary
Redesign the app from a dark technical MVP into a calm private-journal experience. Keep the current webcam + mic capture flow, but make the product feel softer, cleaner, and less demo-like. The core metaphor is: **an inner spiral becoming a framed canvas stroke**.

## Key Changes
- Add a quiet editorial brand system: warm paper background, ink-charcoal text, soft borders, muted clay/blue-gray accent, and a refined serif heading style.
- Replace the plain `InnerCanvas` header with an inline SVG logo: abstract inner spiral flowing into a framed brush/canvas stroke. Avoid eye imagery because it can imply surveillance.
- Remove the large `Current stage` card. Replace it with non-clickable step context: `Reflect → Review → Canvas`.
- Keep the linear state machine and current webcam + mic implementation. Do not add type-first or camera-optional branching.
- Intro screen should be emotionally focused: “Turn a short reflection into a quiet visual companion.”
- Consent screen should explain camera/mic access, local editable tone estimate, ephemeral session data, and reset/delete behavior.
- Recording screen should feel like private reflection capture, not a camera tool. Keep the webcam preview, but reduce technical wording.
- Review screen should make manual tone selection primary. Local visible-cue estimate should be a quiet optional helper behind a small disclosure/details area.
- Hide technical/demo language from the primary UX: `Transcript fallback`, `Local FaceDetector API`, cue signals, estimator source/status, and prompt preview should not dominate the interface.
- Result screen should show the generated image first, then the reflection summary. Frame the image as “a visual companion,” not a conclusion about the user.
- Regeneration controls should be quiet refinement chips under a small “Refine the companion image” section.

## Implementation Notes
- Update global styling to a light journal theme with CSS variables for background, surface, ink, muted text, border, accent, and danger.
- Update `AppShell` to own the logo, wordmark, subtitle, and quiet progress indicator.
- Update the screen components’ copy, spacing, card styling, button hierarchy, and technical disclosure treatment.
- Keep public API routes, session data shape, and core app stage transitions unchanged unless a small prop rename is needed for clearer UI copy.
- Use calm CTA labels:
  - Intro: `Begin reflection`
  - Consent: `Continue privately`
  - Recording: `Review reflection`
  - Review: `Create canvas`
  - Result: `Start over / delete session`

## Test Plan
- Run existing unit tests to confirm state transitions, prompt building, route behavior, and result flow still pass.
- Manually verify the full flow: intro → consent → recording → review → generating → result.
- Verify webcam + mic capture still work and reset/delete clears the session.
- Verify the review step cannot continue until visible tone is confirmed.
- Verify the UI is readable on mobile and desktop.
- Verify technical details are hidden or visually secondary in production UI.

## Assumptions
- The goal is visual/UX improvement only, not a feature expansion.
- The current webcam + mic capture model remains the default.
- The generated image is visually first on the result page, but copy frames it as a supporting reflection artifact.
- No database, auth, history, sharing, or persistent storage will be added.
