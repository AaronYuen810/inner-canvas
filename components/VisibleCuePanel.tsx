import React from "react";

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
  estimatorSource,
  onApplyEstimatedTone,
  onRemoveTone,
  onAddTone,
  onToneInputChange,
}: VisibleCuePanelProps) {
  const trimmedInput = toneInputValue.trim();

  return (
    <section className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
      <h3 className="font-medium text-zinc-100">Visible cue estimate</h3>
      <p className="mt-2 text-sm text-zinc-400">This is only a visible cue estimate. You can edit it.</p>

      <div className="mt-3 rounded-md border border-zinc-800 bg-zinc-900 p-3">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Local cue status</p>
        <p className="mt-1 text-sm text-zinc-300">{estimatorMessage}</p>
        <p className="mt-1 text-xs text-zinc-500">
          Source: {estimatorSource === "face-detector" ? "Local FaceDetector API" : "Manual fallback"} · Status:{" "}
          {estimatorStatus}
        </p>
        <ul className="mt-2 list-inside list-disc text-sm text-zinc-300">
          {cueSignals.map((cue) => (
            <li key={cue}>{cue}</li>
          ))}
        </ul>
        <button
          className="mt-3 rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-100 disabled:opacity-50"
          disabled={suggestedTone.length === 0}
          onClick={() => onApplyEstimatedTone(suggestedTone)}
          type="button"
        >
          Apply local estimate
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {visibleTone.map((tone) => (
          <button
            key={tone}
            className="rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-200 hover:border-zinc-500"
            onClick={() => onRemoveTone(tone)}
            type="button"
          >
            {tone} ×
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          className="w-full max-w-xs rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          onChange={(event) => onToneInputChange(event.target.value)}
          placeholder="Add visible tone"
          value={toneInputValue}
        />
        <button
          className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-100 disabled:opacity-50"
          disabled={!trimmedInput}
          onClick={() => onAddTone(trimmedInput)}
          type="button"
        >
          Add tone
        </button>
      </div>
    </section>
  );
}
