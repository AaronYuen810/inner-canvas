import React from "react";
import { Plus, Sparkles, X } from "lucide-react";

type VisibleCuePanelProps = {
  cueSignals: string[];
  suggestedTone: string[];
  visibleTone: string[];
  toneInputValue: string;
  estimatorMessage: string;
  estimatorStatus: "idle" | "estimating" | "ready" | "fallback";
  estimatorSource: "face-detector" | "manual-fallback";
  onApplyEstimatedTone: (tones: string[]) => void;
  onRemoveTone: (tone: string) => void;
  onAddTone: (tone: string) => void;
  onToneInputChange: (value: string) => void;
};

export function VisibleCuePanel({
  cueSignals,
  suggestedTone,
  visibleTone,
  toneInputValue,
  estimatorMessage,
  estimatorStatus,
  onApplyEstimatedTone,
  onRemoveTone,
  onAddTone,
  onToneInputChange,
}: VisibleCuePanelProps) {
  const trimmedInput = toneInputValue.trim();

  return (
    <section className="mt-5">
      <h3 className="text-base font-semibold text-[color:var(--color-ink)]">Choose the visible tone</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--color-muted)]">
        Use your own words. This is only a visible tone note for the canvas, and you can edit it before creating.
      </p>

      <div className="mt-4 flex min-h-11 flex-wrap gap-2">
        {visibleTone.length > 0 ? (
          visibleTone.map((tone) => (
            <button
              aria-label={`Remove ${tone}`}
              className="journal-chip"
              key={tone}
              onClick={() => onRemoveTone(tone)}
              type="button"
            >
              {tone}
              <X aria-hidden="true" size={14} />
            </button>
          ))
        ) : (
          <p className="journal-panel px-3 py-2 text-sm text-[color:var(--color-muted)]">
            Add at least one tone to continue.
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          className="journal-field min-h-10 w-full px-3 py-2 text-sm sm:max-w-xs"
          onChange={(event) => onToneInputChange(event.target.value)}
          placeholder="Add a tone, such as steady"
          value={toneInputValue}
        />
        <button
          className="journal-button-secondary"
          disabled={!trimmedInput}
          onClick={() => onAddTone(trimmedInput)}
          type="button"
        >
          <Plus aria-hidden="true" size={16} />
          Add tone
        </button>
      </div>

      <details className="journal-panel mt-5 p-4">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-[color:var(--color-ink)] [&::-webkit-details-marker]:hidden">
          <Sparkles aria-hidden="true" size={16} />
          Optional local suggestion
        </summary>
        <p className="mt-3 text-sm leading-6 text-[color:var(--color-muted)]">
          {estimatorStatus === "estimating" ? "Looking at the current preview..." : estimatorMessage}
        </p>
        {cueSignals.length > 0 ? (
          <ul className="mt-2 list-inside list-disc text-sm leading-6 text-[color:var(--color-muted)]">
            {cueSignals.map((cue) => (
              <li key={cue}>{cue}</li>
            ))}
          </ul>
        ) : null}
        <button
          className="journal-button-secondary mt-3"
          disabled={suggestedTone.length === 0}
          onClick={() => onApplyEstimatedTone(suggestedTone)}
          type="button"
        >
          <Sparkles aria-hidden="true" size={16} />
          Use suggestion
        </button>
      </details>
    </section>
  );
}
