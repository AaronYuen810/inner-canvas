# InnerCanvas

InnerCanvas is a privacy-conscious visual journaling app that turns a short reflection into an abstract symbolic image. The project idea is to give people a gentler way to see and revisit what they are feeling without framing the output as a diagnosis, score, or claim about their true emotional state.

The app lets a user speak, show, or type what is present for them in the moment. It then combines the reflection text with optional visual context from sampled camera frames to create a mixed-signal brief, which is used as art direction for a generated visual journal entry.

## What the App Does

1. Records a short reflection with the microphone and optional camera preview.
2. Allows typed reflection input when recording is not available or preferred.
3. Transcribes recorded audio through a server-side OpenAI API route.
4. Builds a structured mixed-signal brief from the transcript and optional sampled frames.
5. Generates an abstract, symbolic journal image from that brief.
6. Shows a result page with the generated image, audio summary, top feelings, scene concept, atmosphere, and mixed-signal details.
7. Supports image refinements such as "More hopeful," "More abstract," "More intense," "Less dark," and custom regeneration prompts.
8. Lets the user edit the reflection text and regenerate the canvas while preserving the captured emotional context.
9. Provides a reset flow that clears the current session state and stops active media tracks.

## Product Principle

InnerCanvas treats the user's words as the source of truth. Visual context can influence atmosphere, energy, palette, and composition, but it should not override the reflection or claim to detect a person's real emotion.

The generated image is a visual interpretation, not a clinical analysis. The app avoids diagnosis, mental-health scoring, and literal emotion detection language.

## Current User Flow

```text
record or type reflection
  -> transcribe audio if needed
  -> create mixed-signal brief
  -> generate abstract image
  -> review, edit, regenerate, or reset
```

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- lucide-react icons
- OpenAI Node SDK
- Next.js API route handlers for AI calls

## AI Features

- `POST /api/transcribe` converts recorded audio into text.
- `POST /api/mixed-signal-brief` creates structured art direction from the transcript and optional sampled frames.
- `POST /api/generate-image` generates the final symbolic image and returns the prompt used.

The app includes a local fallback image path so the demo can continue if image generation is unavailable.

## Privacy and Safety Notes

- The app does not include accounts, authentication, a database, or saved history.
- Session data is kept in client state during the active session.
- Resetting the session clears the active reflection, generated image, prompt, sampled frames, and media stream.
- Camera frames are sampled only during recording and used for the mixed-signal brief when available.
- The app language should stay cautious: use terms like "visual interpretation," "visible affect," "mixed-signal brief," and "mood snapshot" instead of diagnosis or emotion detection claims.

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file with the required OpenAI key and model settings:

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe
OPENAI_MIXED_SIGNAL_MODEL=gpt-5.5
OPENAI_IMAGE_MODEL=gpt-image-2
```

Run the development server:

```bash
npm run dev
```

Run tests:

```bash
npm test
```
