# InnerCanvas 8-Hour MVP Plan

## Summary
Build a greenfield single-flow web app: consent → 30-second max reflection recording → local visible cue estimate → transcript + reflection analysis → symbolic image prompt → generated image result → simple regeneration modifiers.

Confirmed decisions:
- Webcam cue layer: local browser-side cues, not cloud vision.
- AI stack: OpenAI only for transcription, text analysis, and image generation.
- Storage: no saved history; session is ephemeral with reset/delete behavior.

Use language consistently: “visible emotional cue,” “visible tone estimate,” “visual interpretation.” Never claim diagnosis or true emotion detection.

## 1. Recommended MVP Scope
Absolutely build:
- Consent/intro screen with privacy-first copy.
- Webcam + microphone permission flow.
- Recording page with webcam preview, audio recording, 30-second countdown, and visible recording state.
- Local visible cue estimate from webcam using face/motion cues, with editable user confirmation.
- Audio transcription.
- Reflection analysis extracting summary, themes, emotional keywords, metaphors, conflicts, visual symbols.
- Prompt builder combining speech content with confirmed visible tone.
- One generated symbolic image.
- Result screen with image, one-sentence interpretation, themes, visible tone, and buttons: `More hopeful`, `More abstract`, `More intense`, `Less dark`, `Regenerate`.
- Reset/delete session button.

Cut:
- Auth, accounts, cloud storage, history, sharing, social features.
- Diagnosis, mental health scoring, “detected true emotion,” clinical categories.
- Real-time emotion dashboard.
- Multiple images per generation.
- Advanced image editing.
- Long-form journaling timeline.
- Mobile app wrapper.

Stretch:
- Browser local history toggle.
- Download image.
- Transcript edit before generation.
- Style presets: cinematic, watercolor, surreal, minimal.
- Streaming image partials.
- “Use speech only” mode.
- Pre-demo sample reflection mode.

## 2. Suggested Technical Architecture
Frontend:
- Next.js + React + TypeScript single app.
- App state machine: `intro → consent → recording → review → generating → result`.
- Browser APIs: `getUserMedia`, `MediaRecorder`, `<video>`, `<canvas>`.
- Keep all session data in React state unless user explicitly downloads.

Backend:
- Use Next.js API route handlers, not a separate backend.
- Backend exists only to protect `OPENAI_API_KEY` and proxy AI calls.
- No database.

Webcam emotion cue layer:
- Use local browser processing only.
- Recommended implementation: MediaPipe Face Landmarker if setup works quickly.
- Extract visible cues, not emotions:
  - face present
  - head movement / stillness
  - mouth corner lift / smile-like expression
  - brow tension / concentration-like expression
  - gaze direction / looking away
  - motion intensity
- Convert to cautious tone words:
  - “thoughtful,” “soft,” “tense,” “animated,” “quiet,” “slightly hopeful”
- Always show: “This is only a visible cue estimate. You can edit it.”
- Fallback: manual tone chips if local model fails.

Audio capture/transcription layer:
- Record `audio/webm` from `MediaRecorder`.
- Send audio blob to `/api/transcribe`.
- Use OpenAI transcription, likely `gpt-4o-mini-transcribe` for speed/cost or `gpt-4o-transcribe` for quality.

Speech summarization layer:
- Send transcript to `/api/analyze-reflection`.
- Return structured JSON:
  - `summary`
  - `themes`
  - `emotionalKeywords`
  - `metaphors`
  - `conflicts`
  - `visualSymbols`
  - `oneSentenceInterpretation`

Prompt-construction layer:
- Server-side pure function: `buildImagePrompt(analysis, confirmedVisibleTone, style, modifier?)`.
- Keep it deterministic and inspectable for debugging.

Image-generation layer:
- Use OpenAI Images API for one prompt, one image.
- Default to `gpt-image-2`, square `1024x1024`, low or medium quality for demo speed.
- Return base64/data URL to the frontend.

Storage layer:
- None for MVP.
- Store temporary state only in memory.
- Reset clears transcript, analysis, cues, prompt, generated image, and stops media tracks.

## 3. Recommended Tech Stack
Fastest practical stack:
- Framework: Next.js App Router + TypeScript.
- Styling: Tailwind CSS.
- UI components: simple custom components; optionally shadcn/ui only if already comfortable.
- Icons: lucide-react.
- Local cue model: `@mediapipe/tasks-vision` Face Landmarker.
- AI: OpenAI Node SDK.
- Deployment: Vercel.
- Env vars:
  - `OPENAI_API_KEY`
  - `OPENAI_TEXT_MODEL=gpt-5.4-mini`
  - `OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe`
  - `OPENAI_IMAGE_MODEL=gpt-image-2`

Useful alternatives:
- If MediaPipe blocks progress: use manual editable tone chips.
- If Next.js setup slows the team down: Vite React + tiny Express server.
- If image API access is blocked: show the final prompt plus one pre-generated fallback image for demo continuity.

OpenAI docs checked:
- [Models](https://developers.openai.com/api/docs/models)
- [Speech to text](https://developers.openai.com/api/docs/guides/speech-to-text)
- [Image generation](https://developers.openai.com/api/docs/guides/image-generation)

## 4. Data Flow Diagram
`webcam + mic consent → webcam preview + audio recording → local visible cue estimate + audio blob → transcription API → reflection analysis JSON → user confirms/edits visible tone → prompt builder → image API → result page → modifier regeneration`

## 5. Implementation Phases By Time
Hour 0-1:
- Scaffold Next.js, Tailwind, env config.
- Build app shell and state machine.
- Add positioning copy, consent page, reset/delete behavior.

Hour 1-2:
- Implement webcam/mic permission.
- Add webcam preview, 30-second countdown, start/stop recording.
- Produce audio blob locally.

Hour 2-4:
- Build `/api/transcribe`.
- Build `/api/analyze-reflection`.
- Return structured JSON for summary, themes, metaphors, conflicts, symbols.
- Add review screen showing transcript and analysis.

Hour 4-6:
- Build prompt builder.
- Build `/api/generate-image`.
- Create result screen with image, interpretation, themes, visible tone.
- Add loading/error states.

Hour 6-7:
- Add local visible cue estimator.
- Add editable tone chips.
- Add fallback manual tone selection.
- Ensure no frames are uploaded or stored.

Hour 7-8:
- Polish UI copy and demo path.
- Add regeneration modifiers.
- Test on Chrome with fresh permissions.
- Prepare backup transcript/image in case API or permissions fail.

## 6. Component Breakdown
Pages/components:
- `AppShell`
- `IntroConsentScreen`
- `RecordingScreen`
- `CameraPreview`
- `RecordingTimer`
- `VisibleCuePanel`
- `ReflectionReviewScreen`
- `TranscriptPanel`
- `AnalysisSummaryPanel`
- `PromptPreview` as dev/demo toggle only
- `GeneratingScreen`
- `ResultScreen`
- `RegenerationControls`
- `PrivacyResetButton`

Hooks/modules:
- `useMediaCapture`
- `useAudioRecorder`
- `useVisibleCueEstimator`
- `apiClient`
- `promptBuilder`
- `reflectionTypes`

## 7. API / Interface Design
Client functions:
- `requestMediaConsent(): Promise<MediaStream>`
- `startRecording(durationSec = 30): void`
- `stopRecording(): Promise<Blob>`
- `analyzeFacialCues(videoEl): VisibleCueEstimate`
- `confirmVisibleTone(estimate, userEdits): ConfirmedVisibleTone`
- `resetSession(): void`

Server endpoints:
- `POST /api/transcribe`
  - Input: multipart audio file.
  - Output: `{ transcript: string }`

- `POST /api/analyze-reflection`
  - Input: `{ transcript: string }`
  - Output: `{ summary, themes, emotionalKeywords, metaphors, conflicts, visualSymbols, oneSentenceInterpretation }`

- `POST /api/generate-image`
  - Input: `{ analysis, confirmedVisibleTone, style?: string, modifier?: string }`
  - Output: `{ imageBase64, prompt, revisedPrompt? }`

- `POST /api/regenerate-image`
  - Input: `{ previousPrompt, modifier }`
  - Output: `{ imageBase64, prompt }`

Core types:
```ts
type VisibleCueEstimate = {
  cueLabels: string[];
  toneWords: string[];
  confidence: "low" | "medium";
  source: "local_estimate";
};

type ConfirmedVisibleTone = {
  toneWords: string[];
  userEdited: boolean;
};

type ReflectionAnalysis = {
  summary: string;
  themes: string[];
  emotionalKeywords: string[];
  metaphors: string[];
  conflicts: string[];
  visualSymbols: string[];
  oneSentenceInterpretation: string;
};
```

## 8. Prompt-Engineering Design
Analysis prompt:
```text
You are helping create a symbolic visual journal entry.

Return JSON only.

Do not diagnose the user.
Do not claim to know their true emotion.
Treat the user's words as the source of truth.
Extract:
- summary: one concise sentence
- themes: 3-5 short phrases
- emotionalKeywords: words grounded in the transcript
- metaphors: explicit or implied metaphors
- conflicts: inner tensions or tradeoffs
- visualSymbols: concrete visual objects/scenes that could represent the reflection
- oneSentenceInterpretation: "This image reflects..." phrased as one possible interpretation, not certainty.

Transcript:
{{transcript}}
```

Image prompt template:
```text
Create one symbolic, emotionally gentle visual interpretation of a spoken reflection.

Reflection summary:
{{summary}}

Main themes:
{{themes}}

Emotional keywords from the user's own words:
{{emotionalKeywords}}

Metaphors and inner conflicts:
{{metaphors}}
{{conflicts}}

Possible visual symbols:
{{visualSymbols}}

Confirmed visible tone estimate:
{{confirmedVisibleTone}}

Use the speech content to determine the scene, symbols, objects, and narrative.
Use the visible tone only to influence mood, color, lighting, atmosphere, and intensity.
Do not imply diagnosis or claim this is the user's true emotion.

Visual direction:
- symbolic, cinematic, intimate, reflective
- no text, captions, labels, UI, medical imagery, or diagnostic symbolism
- avoid horror unless explicitly requested
- make it emotionally nuanced, not melodramatic
- polished square composition

Modifier:
{{modifierOrNone}}
```

Regeneration modifiers:
- `More hopeful`: brighten lighting, warmer palette, clearer path forward.
- `More abstract`: reduce literal human figure, increase symbolic forms.
- `More intense`: increase contrast, scale, motion, and emotional pressure without horror.
- `Less dark`: soften shadows, reduce heaviness, preserve complexity.

## 9. Responsible AI And Privacy Safeguards
- Explicit consent before camera/mic access.
- Visible recording indicator and countdown.
- No hidden recording.
- Browser processes webcam cues locally.
- Audio is sent to OpenAI for transcription; say this plainly.
- No webcam frames are uploaded or stored in MVP.
- No diagnosis, no mental health scoring, no “true emotion” claims.
- Use “visible tone estimate” and “one possible visual interpretation.”
- User correction step before image generation.
- “Use speech only” fallback if the user declines camera.
- Reset/delete clears the session and stops media tracks.
- No database, no account, no saved journal history.

## 10. Biggest Engineering Risks
MediaPipe/local cue setup:
- Why it matters: local cue estimation can eat the hackathon.
- Simplify: only extract coarse cues and tone chips.
- Fallback: manual editable visible-tone chips.

Camera/mic permissions:
- Why it matters: demo can fail immediately.
- Simplify: target Chrome desktop first.
- Fallback: text transcript input and manual tone mode.

OpenAI image latency/access:
- Why it matters: image generation is the demo payoff.
- Simplify: one square image, low/medium quality, no batch generation.
- Fallback: pre-generate one backup image from the demo transcript.

Prompt outputs too clinical or dark:
- Why it matters: violates product positioning.
- Simplify: strict prompt language and “Less dark” modifier.
- Fallback: show editable prompt preview in demo mode.

Privacy trust:
- Why it matters: webcam + emotion language is sensitive.
- Simplify: local-only cues, no storage, clear reset.
- Fallback: speech-only mode.

Time pressure:
- Why it matters: end-to-end beats sophisticated partials.
- Simplify: build AI flow first, cue layer second.
- Fallback: cue chips still satisfy the correction and privacy story.

## 11. Best Demo Path Under 2 Minutes
0:00-0:15:
Open app. Read the core promise: “Speak freely. You do not need to organize your thoughts.” Point out local webcam cues and no saved history.

0:15-0:35:
Grant permissions. Record a short reflection:
“I feel excited about starting something new, but also overwhelmed. It feels like there are so many doors open, and I’m scared choosing one means losing all the others.”

0:35-0:55:
Show visible tone estimate and edit/confirm it:
“thoughtful, tense, slightly hopeful.”

0:55-1:15:
Show transcript summary, themes, metaphors, conflicts, symbols.

1:15-1:45:
Generate image. Show final symbolic hallway/open doors image.

1:45-2:00:
Click `More hopeful` or `Less dark` and explain that regeneration changes the interpretation without claiming the app knows the user’s true emotion.

## 12. Final Recommendation
Build this in order:
1. Single polished state-machine UI.
2. Audio recording and transcription.
3. Reflection analysis JSON.
4. Prompt builder.
5. Image generation and result page.
6. Editable visible tone chips.
7. Local webcam cue estimator.
8. Regeneration modifiers.
9. Visual polish and demo backups.

The simplest winning MVP is not “AI emotion detection.” It is a gentle symbolic reflection tool where speech drives meaning, local visible cues shape atmosphere, and the user remains the authority.
