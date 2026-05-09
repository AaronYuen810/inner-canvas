import React from "react";
import { Loader2, RefreshCcw, Sparkles, Trash2, WandSparkles } from "lucide-react";

import { MixedSignalBrief } from "@/lib/sessionState";

type ResultScreenProps = {
  generatedImage: string;
  transcript: string;
  stagedTranscript: string;
  mixedSignalBrief: MixedSignalBrief | null;
  onStageTranscriptEdit: (value: string) => void;
  onConfirmTranscriptEdit: () => void;
  onDiscardTranscriptEdit: () => void;
  onRegenerate: (modifier?: string) => void;
  isRegenerating: boolean;
  errorMessage: string;
  onReset: () => void;
  generatedPrompt?: string;
  canPreviewPrompt?: boolean;
};

const REFINEMENT_OPTIONS = ["More hopeful", "More abstract", "More intense", "Less dark"] as const;

export function ResultScreen({
  generatedImage,
  transcript,
  stagedTranscript,
  mixedSignalBrief,
  onStageTranscriptEdit,
  onConfirmTranscriptEdit,
  onDiscardTranscriptEdit,
  onRegenerate,
  isRegenerating,
  errorMessage,
  onReset,
  generatedPrompt = "",
  canPreviewPrompt = false,
}: ResultScreenProps) {
  const imageSource = generatedImage
    ? generatedImage.startsWith("data:")
      ? generatedImage
      : `data:image/png;base64,${generatedImage}`
    : "";

  const hasPendingTranscriptEdit = stagedTranscript.trim() !== transcript.trim();
  const canConfirmTranscriptEdit = stagedTranscript.trim().length > 0 && hasPendingTranscriptEdit;

  return (
    <section className="w-full space-y-5">
      <h2 className="sr-only">Canvas</h2>
      <div className="journal-card overflow-hidden p-3 sm:p-4">
        {generatedImage ? (
          <div className="relative">
            <img
              alt="Generated visual companion"
              className="aspect-square h-auto w-full rounded-md object-cover"
              src={imageSource}
            />
            {isRegenerating ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-md bg-[rgb(26_28_33_/_0.45)]">
                <p className="inline-flex items-center gap-2 rounded-full bg-[rgb(255_250_242_/_0.9)] px-4 py-2 text-sm font-semibold text-[color:var(--color-ink)]">
                  <Loader2 aria-hidden="true" className="animate-spin" size={16} />
                  Creating canvas...
                </p>
              </div>
            ) : null}
          </div>
        ) : isRegenerating ? (
          <div className="flex aspect-square min-h-80 flex-col items-center justify-center gap-3 rounded-md bg-[color:var(--color-surface)] px-5 text-center text-sm text-[color:var(--color-muted)]">
            <Loader2 aria-hidden="true" className="animate-spin" size={20} />
            <p>Creating canvas...</p>
          </div>
        ) : (
          <div className="flex aspect-square min-h-80 items-center justify-center rounded-md bg-[color:var(--color-surface)] px-5 text-center text-sm text-[color:var(--color-muted)]">
            Your visual journal entry will appear here once the entry is created.
          </div>
        )}
      </div>

      <div className="journal-card p-5 sm:p-7">
        <h3 className="font-serif text-3xl font-semibold leading-tight text-[color:var(--color-ink)]">
          Visual journal entry
        </h3>
        <div className="journal-panel mt-5 p-4">
          <h4 className="text-sm font-semibold text-[color:var(--color-ink)]">Mood snapshot</h4>
          <div className="mt-3 grid gap-3 text-sm leading-6 text-[color:var(--color-muted)] md:grid-cols-2">
            <p>
              <span className="font-semibold text-[color:var(--color-ink)]">Summary:</span>{" "}
              {mixedSignalBrief?.transcriptSummary || "Not available."}
            </p>
            <p>
              <span className="font-semibold text-[color:var(--color-ink)]">Spoken emotions:</span>{" "}
              {mixedSignalBrief?.spokenEmotions.length
                ? mixedSignalBrief.spokenEmotions.join(", ")
                : "Not available."}
            </p>
            <p>
              <span className="font-semibold text-[color:var(--color-ink)]">Atmosphere:</span>{" "}
              {mixedSignalBrief?.atmosphere || "Not available."}
            </p>
            <p>
              <span className="font-semibold text-[color:var(--color-ink)]">Scene energy:</span>{" "}
              {mixedSignalBrief?.sceneEnergy || "Not available."}
            </p>
          </div>
        </div>

        <details className="journal-panel mt-5 p-4">
          <summary className="cursor-pointer list-none text-sm font-semibold text-[color:var(--color-ink)] [&::-webkit-details-marker]:hidden">
            Entry details
          </summary>
          <div className="mt-3 grid gap-4 text-sm leading-6 text-[color:var(--color-muted)] md:grid-cols-2">
            <div>
              <h4 className="font-semibold text-[color:var(--color-ink)]">Scene concept</h4>
              <p className="mt-1">{mixedSignalBrief?.sceneConcept || "Not available."}</p>
            </div>
            <div>
              <h4 className="font-semibold text-[color:var(--color-ink)]">Atmosphere</h4>
              <p className="mt-1">{mixedSignalBrief?.atmosphere || "Not available."}</p>
            </div>
            <div>
              <h4 className="font-semibold text-[color:var(--color-ink)]">Transcript summary</h4>
              <p className="mt-1">{mixedSignalBrief?.transcriptSummary || "Not available."}</p>
            </div>
            <div>
              <h4 className="font-semibold text-[color:var(--color-ink)]">Signal relationship</h4>
              <p className="mt-1">{mixedSignalBrief?.signalRelationship || "Not available."}</p>
            </div>
            <div className="md:col-span-2">
              <h4 className="font-semibold text-[color:var(--color-ink)]">Themes carried into the canvas</h4>
              <p className="mt-1">
                {mixedSignalBrief?.spokenThemes.length
                  ? mixedSignalBrief.spokenThemes.join(", ")
                  : "Not available."}
              </p>
            </div>
          </div>
        </details>
      </div>

      <div className="journal-panel p-4">
        <h3 className="text-sm font-semibold text-[color:var(--color-ink)]">Edit entry text</h3>
        <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted)]">
          Confirmed edits regenerate the canvas using your edited reflection while preserving the captured emotional context.
        </p>
        <textarea
          className="journal-field mt-3 min-h-28 w-full px-3 py-2 text-sm"
          disabled={isRegenerating}
          onChange={(event) => onStageTranscriptEdit(event.target.value)}
          placeholder="Edit your reflection"
          value={stagedTranscript}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="journal-button-primary"
            disabled={!canConfirmTranscriptEdit || isRegenerating}
            onClick={onConfirmTranscriptEdit}
            type="button"
          >
            <WandSparkles aria-hidden="true" size={16} />
            Update entry
          </button>
          <button
            className="journal-button-secondary"
            disabled={!hasPendingTranscriptEdit || isRegenerating}
            onClick={onDiscardTranscriptEdit}
            type="button"
          >
            Discard edits
          </button>
        </div>
      </div>

      <div className="journal-panel p-4">
        <h3 className="text-sm font-semibold text-[color:var(--color-ink)]">Adjust image</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {REFINEMENT_OPTIONS.map((option) => (
            <button
              className="journal-chip"
              disabled={isRegenerating}
              key={option}
              onClick={() => onRegenerate(option)}
              type="button"
            >
              <Sparkles aria-hidden="true" size={15} />
              {option}
            </button>
          ))}
          <button
            className="journal-chip"
            disabled={isRegenerating}
            onClick={() => onRegenerate()}
            type="button"
          >
            <RefreshCcw aria-hidden="true" size={15} />
            Regenerate
          </button>
        </div>
      </div>

      {canPreviewPrompt && generatedPrompt ? (
        <details className="journal-panel p-4">
          <summary className="cursor-pointer list-none text-sm font-semibold text-[color:var(--color-ink)] [&::-webkit-details-marker]:hidden">
            Prompt details
          </summary>
          <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-3 text-xs leading-5 text-[color:var(--color-muted)]">
            {generatedPrompt}
          </pre>
        </details>
      ) : null}

      {errorMessage ? <p className="text-sm text-[color:var(--color-danger)]">{errorMessage}</p> : null}

      <div>
        <button
          className="journal-button-danger"
          disabled={isRegenerating}
          onClick={onReset}
          type="button"
        >
          <Trash2 aria-hidden="true" size={16} />
          Start over
        </button>
      </div>
    </section>
  );
}
