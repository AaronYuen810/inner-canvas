# Recommended Tech Stack

## Fastest practical stack
- Framework: Next.js App Router + TypeScript
- Styling: Tailwind CSS
- UI components: simple custom components; optionally shadcn/ui only if already comfortable
- Icons: lucide-react
- Local cue model: `@mediapipe/tasks-vision` Face Landmarker
- AI: OpenAI Node SDK
- Deployment: Vercel

## Environment variables
- `OPENAI_API_KEY`
- `OPENAI_TEXT_MODEL=gpt-5.4-mini`
- `OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe`
- `OPENAI_IMAGE_MODEL=gpt-image-2`

## Useful alternatives
- If MediaPipe blocks progress: use manual editable tone chips.
- If Next.js setup slows the team down: Vite React + tiny Express server.
- If image API access is blocked: show the final prompt plus one pre-generated fallback image for demo continuity.
