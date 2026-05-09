import React, { useState } from "react";
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
};

const REFINEMENT_OPTIONS = ["More hopeful", "More abstract", "More intense", "Less dark"] as const;

function renderEmotionChips(emotions: string[] | undefined): React.ReactNode {
  const cleanedEmotions = (emotions || []).map((emotion) => emotion.trim()).filter(Boolean);

  if (cleanedEmotions.length === 0) {
    return <p className="text-sm text-[color:var(--color-muted)]">Not available.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {cleanedEmotions.map((emotion) => (
        <span className="journal-chip" key={emotion}>
          {emotion}
        </span>
      ))}
    </div>
  );
}

function renderInlineList(items: string[] | undefined): string {
  const cleanedItems = (items || []).map((item) => item.trim()).filter(Boolean);
  return cleanedItems.length > 0 ? cleanedItems.join(", ") : "Not available.";
}

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
}: ResultScreenProps) {
  const [customModifier, setCustomModifier] = useState("");
  const imageSource = generatedImage
    ? generatedImage.startsWith("data:")
      ? generatedImage
      : `data:image/png;base64,${generatedImage}`
    : "";

  const hasPendingTranscriptEdit = stagedTranscript.trim() !== transcript.trim();
  const canConfirmTranscriptEdit = stagedTranscript.trim().length > 0 && hasPendingTranscriptEdit;
  const canSubmitCustomModifier = customModifier.trim().length > 0 && !isRegenerating;

  const handleCustomRegenerate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedModifier = customModifier.trim();
    if (!normalizedModifier) {
      return;
    }

    onRegenerate(normalizedModifier);
    setCustomModifier("");
  };

  return (
    <section className="w-full space-y-5">
      <h2 className="sr-only">Canvas</h2>

      <div className="journal-card p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
          <div className="journal-panel p-3 sm:p-4">
            {generatedImage ? (
              <div className="relative mx-auto w-full max-w-xl">
                <img
                  alt="Generated visual companion"
                  className="aspect-[4/5] h-auto w-full rounded-md object-cover"
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
              <div className="flex aspect-[4/5] min-h-80 flex-col items-center justify-center gap-3 rounded-md bg-[color:var(--color-surface)] px-5 text-center text-sm text-[color:var(--color-muted)]">
                <Loader2 aria-hidden="true" className="animate-spin" size={20} />
                <p>Creating canvas...</p>
              </div>
            ) : (
              <div className="flex aspect-[4/5] min-h-80 items-center justify-center rounded-md bg-[color:var(--color-surface)] px-5 text-center text-sm text-[color:var(--color-muted)]">
                Your journal entry will appear here once the entry is created.
              </div>
            )}
          </div>

          <div className="journal-panel p-4">
            <h3 className="font-serif text-2xl font-semibold leading-tight text-[color:var(--color-ink)]">
              Journal entry
            </h3>
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-[color:var(--color-ink)]">Summary</h4>
                <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted)]">
                  {mixedSignalBrief?.transcriptSummary || "Not available."}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[color:var(--color-ink)]">Emotions</h4>
                <div className="mt-3">{renderEmotionChips(mixedSignalBrief?.spokenEmotions)}</div>
              </div>
            </div>

            <details className="mt-4 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-paper)] p-3">
              <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)] [&::-webkit-details-marker]:hidden">
                Additional context
              </summary>
              <div className="mt-3 grid gap-4 text-sm leading-6 text-[color:var(--color-muted)] sm:grid-cols-2">
                <div>
                  <h5 className="font-semibold text-[color:var(--color-ink)]">Scene concept</h5>
                  <p className="mt-1">{mixedSignalBrief?.sceneConcept || "Not available."}</p>
                </div>
                <div>
                  <h5 className="font-semibold text-[color:var(--color-ink)]">Atmosphere</h5>
                  <p className="mt-1">{mixedSignalBrief?.atmosphere || "Not available."}</p>
                </div>
                <div>
                  <h5 className="font-semibold text-[color:var(--color-ink)]">Signal relationship</h5>
                  <p className="mt-1">{mixedSignalBrief?.signalRelationship || "Not available."}</p>
                </div>
                <div>
                  <h5 className="font-semibold text-[color:var(--color-ink)]">Scene energy</h5>
                  <p className="mt-1">{mixedSignalBrief?.sceneEnergy || "Not available."}</p>
                </div>
                <div className="sm:col-span-2">
                  <h5 className="font-semibold text-[color:var(--color-ink)]">Themes carried into the canvas</h5>
                  <p className="mt-1">{renderInlineList(mixedSignalBrief?.spokenThemes)}</p>
                </div>
                <div className="sm:col-span-2">
                  <h5 className="font-semibold text-[color:var(--color-ink)]">Visual signals</h5>
                  <p className="mt-1">{renderInlineList(mixedSignalBrief?.visualAffectSignals)}</p>
                </div>
                <div className="sm:col-span-2">
                  <h5 className="font-semibold text-[color:var(--color-ink)]">Signal tensions</h5>
                  <p className="mt-1">{renderInlineList(mixedSignalBrief?.signalTensions)}</p>
                </div>
              </div>
            </details>
          </div>
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
        <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={handleCustomRegenerate}>
          <input
            className="journal-field flex-1 px-3 py-2 text-sm"
            disabled={isRegenerating}
            onChange={(event) => setCustomModifier(event.target.value)}
            placeholder="Add your own direction (for example: softer light, stronger contrast)"
            value={customModifier}
          />
          <button className="journal-button-secondary" disabled={!canSubmitCustomModifier} type="submit">
            Regenerate with custom prompt
          </button>
        </form>
      </div>

      <div className="journal-panel p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
          Edit entry text (optional)
        </h3>
        <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted)]">
          Confirmed edits regenerate the canvas using your edited reflection while preserving the captured emotional
          context.
        </p>
        <textarea
          className="journal-field mt-3 min-h-24 w-full px-3 py-2 text-sm"
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
