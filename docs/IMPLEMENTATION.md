# InnerCanvas MVP Implementation Breakdown

This breakdown turns `PLAN.md` into a concrete implementation sequence for the current greenfield repo.

## Critical Path

Build the app in this order:

1. State-machine UI
2. Audio recording
3. Transcription
4. Reflection analysis
5. Prompt builder
6. Image generation
7. Result screen
8. Editable visible tone chips
9. Local webcam cue estimator
10. Regeneration modifiers
11. Polish and demo backups

MediaPipe/local cue estimation should come after the AI flow works end to end. It is the highest time-risk piece and has a safe fallback through editable manual tone chips.

## 1. Scaffold The App

- Create a Next.js App Router project with TypeScript and Tailwind CSS.
- Add core dependencies:
  - `openai`
  - `lucide-react`
  - `@mediapipe/tasks-vision` later, only when the core flow is stable
- Add environment variables:
  - `OPENAI_API_KEY`
  - `OPENAI_TEXT_MODEL`
  - `OPENAI_TRANSCRIBE_MODEL`
  - `OPENAI_IMAGE_MODEL`
- Keep the backend inside Next.js API route handlers.
- Do not add a database, auth, accounts, or persisted history.

## 2. Build The App State Machine

Implement a single-session app flow:

```text
intro -> consent -> recording -> review -> generating -> result
```

Session state should live in React state only. It should include:

- media stream
- audio blob
- transcript
- reflection analysis
- visible cue estimate
- confirmed visible tone
- generated prompt
- generated image
- loading/error states

Add a reset/delete action that:

- clears all session state
- clears transcript and analysis
- clears generated prompt and image
- clears visible cue state
- stops all active media tracks
- returns the app to the intro or consent screen

## 3. Create The Core UI Screens

Build these screens/components first:

- `AppShell`
- `IntroConsentScreen`
- `RecordingScreen`
- `ReflectionReviewScreen`
- `GeneratingScreen`
- `ResultScreen`
- `PrivacyResetButton`

Keep language cautious and consistent:

- Use "visible tone estimate"
- Use "visible emotional cue"
- Use "visual interpretation"
- Never claim diagnosis, scoring, or true emotion detection

## 4. Implement Media Capture

Create browser-side capture hooks:

- `useMediaCapture`
- `useAudioRecorder`

Implementation details:

- Request camera and microphone with `navigator.mediaDevices.getUserMedia`.
- Show a live webcam preview in a `<video>` element.
- Record audio with `MediaRecorder`.
- Prefer `audio/webm` when supported.
- Add a 30-second maximum countdown.
- Allow manual stop before the countdown ends.
- Produce an audio `Blob` locally.
- Show a visible recording indicator while recording.

Failure states to handle:

- camera denied
- microphone denied
- no available input device
- unsupported `MediaRecorder`
- browser permission reset needed

## 5. Build The Transcription API

Create:

```text
POST /api/transcribe
```

Input:

- multipart form data with one audio file

Output:

```json
{
  "transcript": "..."
}
```

Implementation details:

- Keep `OPENAI_API_KEY` server-side only.
- Use the OpenAI transcription model from `OPENAI_TRANSCRIBE_MODEL`.
- Return user-facing errors without leaking sensitive backend details.
- On success, move the client into the review flow.

## 6. Build The Reflection Analysis API

Create:

```text
POST /api/analyze-reflection
```

Input:

```json
{
  "transcript": "..."
}
```

Output:

```json
{
  "summary": "...",
  "themes": [],
  "emotionalKeywords": [],
  "metaphors": [],
  "conflicts": [],
  "visualSymbols": [],
  "oneSentenceInterpretation": "..."
}
```

Implementation details:

- Use the OpenAI text model from `OPENAI_TEXT_MODEL`.
- Ask for JSON only.
- Treat the user's words as the source of truth.
- Do not diagnose the user.
- Validate the response shape before returning it to the frontend.
- Show a recoverable error if JSON parsing or validation fails.

## 7. Build The Review Screen

The review screen should show:

- transcript
- one-sentence summary
- themes
- emotional keywords
- metaphors
- conflicts
- visual symbols
- editable visible tone chips

Start with manual editable tone chips:

- `thoughtful`
- `soft`
- `tense`
- `animated`
- `quiet`
- `slightly hopeful`

Show this copy near the tone selector:

```text
This is only a visible cue estimate. You can edit it.
```

The user must confirm or edit the visible tone before generating the image.

## 8. Build The Prompt Builder

Create a deterministic server-side pure function:

```ts
buildImagePrompt(
  analysis,
  confirmedVisibleTone,
  style?,
  modifier?
)
```

The prompt should combine:

- reflection summary
- themes
- emotional keywords
- metaphors
- conflicts
- visual symbols
- confirmed visible tone
- optional style
- optional regeneration modifier

Rules:

- Speech content determines scene, symbols, objects, and narrative.
- Visible tone only influences mood, color, lighting, atmosphere, and intensity.
- Do not imply diagnosis.
- Do not claim the image represents the user's true emotion.
- Avoid text, captions, labels, UI, medical imagery, and diagnostic symbolism.
- Avoid horror unless explicitly requested.

## 9. Build The Image Generation API

Create:

```text
POST /api/generate-image
```

Input:

```json
{
  "analysis": {},
  "confirmedVisibleTone": {},
  "style": "optional",
  "modifier": "optional"
}
```

Output:

```json
{
  "imageBase64": "...",
  "prompt": "...",
  "revisedPrompt": "optional"
}
```

Implementation details:

- Use the OpenAI image model from `OPENAI_IMAGE_MODEL`.
- Generate one square image.
- Prefer low or medium quality for demo speed.
- Return the generated prompt for debugging/demo visibility.
- Store the returned image only in client state.

## 10. Build The Result Screen

The result screen should show:

- generated symbolic image
- one-sentence interpretation
- themes
- confirmed visible tone
- reset/delete button
- regeneration controls

Regeneration buttons:

- `More hopeful`
- `More abstract`
- `More intense`
- `Less dark`
- `Regenerate`

The result copy should frame the output as one possible visual interpretation, not a conclusion about the user.

## 11. Add Regeneration

Either reuse:

```text
POST /api/generate-image
```

with a `modifier`, or add:

```text
POST /api/regenerate-image
```

Modifier behavior:

- `More hopeful`: brighten lighting, warmer palette, clearer path forward.
- `More abstract`: reduce literal human figure, increase symbolic forms.
- `More intense`: increase contrast, scale, motion, and emotional pressure without horror.
- `Less dark`: soften shadows, reduce heaviness, preserve complexity.

Keep regeneration single-image only.

## 12. Add Local Visible Cue Estimation

Create:

- `useVisibleCueEstimator`
- `VisibleCuePanel`

Start with manual tone chips as the fallback. Then add MediaPipe Face Landmarker if time allows.

Possible local cues:

- face present
- head movement or stillness
- mouth corner lift / smile-like expression
- brow tension / concentration-like expression
- gaze direction / looking away
- motion intensity

Convert cues into cautious tone words:

- thoughtful
- soft
- tense
- animated
- quiet
- slightly hopeful

Privacy requirements:

- process webcam frames locally in the browser
- do not upload webcam frames
- do not store webcam frames
- do not describe the output as emotion detection
- always allow the user to edit or override the estimate

## 13. Add Fallbacks And Demo Hardening

Add fallbacks for the riskiest demo points:

- speech-only mode if camera is declined
- manual tone selection if MediaPipe fails
- text transcript input if microphone recording fails
- sample transcript for demo continuity
- backup generated image if image API access or latency fails
- prompt preview as a dev/demo toggle only

Test the demo path in Chrome:

1. Fresh permissions
2. Grant camera/microphone
3. Record a short reflection
4. Confirm visible tone
5. Review transcript and analysis
6. Generate image
7. Regenerate with `More hopeful` or `Less dark`
8. Reset/delete the session

## Suggested File Structure

```text
app/
  api/
    analyze-reflection/
      route.ts
    generate-image/
      route.ts
    transcribe/
      route.ts
  page.tsx
  layout.tsx
components/
  AnalysisSummaryPanel.tsx
  CameraPreview.tsx
  GeneratingScreen.tsx
  IntroConsentScreen.tsx
  PrivacyResetButton.tsx
  RecordingScreen.tsx
  RecordingTimer.tsx
  ReflectionReviewScreen.tsx
  RegenerationControls.tsx
  ResultScreen.tsx
  TranscriptPanel.tsx
  VisibleCuePanel.tsx
hooks/
  useAudioRecorder.ts
  useMediaCapture.ts
  useVisibleCueEstimator.ts
lib/
  apiClient.ts
  promptBuilder.ts
  reflectionTypes.ts
```

## Definition Of Done

The MVP is done when:

- a user can grant permissions
- record up to 30 seconds of audio
- see a transcript
- see structured reflection analysis
- confirm or edit visible tone
- generate one symbolic image
- regenerate with at least one modifier
- reset/delete the session
- use the app without any saved account, database, or journal history
- no webcam frames are uploaded or stored
- the UI never claims diagnosis or true emotion detection
