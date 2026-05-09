"use client";

import React from "react";

import { VisibleCuePanel } from "@/components/VisibleCuePanel";
import { useVisibleCueEstimator } from "@/hooks/useVisibleCueEstimator";
import { ReflectionAnalysis } from "@/lib/sessionState";

type ReflectionReviewScreenProps = {
  transcript: string;
  analysis: ReflectionAnalysis | null;
  visibleTone: string[];
  onRemoveTone: (tone: string) => void;
  onAddTone: (tone: string) => void;
  toneInputValue: string;
  onToneInputChange: (value: string) => void;
  mediaStream?: MediaStream | null;
  onApplyEstimatedTone?: (tones: string[]) => void;
  onConfirmVisibleTone: () => void;
  canContinue: boolean;
  onContinue: () => void;
  continueLabel: string;
};

function renderList(items: string[]): React.ReactNode {
  if (items.length === 0) {
    return <li className="text-zinc-400">None provided yet.</li>;
  }

  return items.map((item) => <li key={item}>{item}</li>);
}

export function ReflectionReviewScreen({
  transcript,
  analysis,
  visibleTone,
  onRemoveTone,
  onAddTone,
  toneInputValue,
  onToneInputChange,
  mediaStream = null,
  onApplyEstimatedTone,
  onConfirmVisibleTone,
  canContinue,
  onContinue,
  continueLabel,
}: ReflectionReviewScreenProps) {
  const cueEstimate = useVisibleCueEstimator(mediaStream);

  return (
    <section className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <h2 className="text-2xl font-semibold">Reflection review</h2>
      <div className="mt-4 space-y-4 text-sm">
        <div>
          <h3 className="font-medium text-zinc-100">Transcript</h3>
          <p className="mt-1 whitespace-pre-wrap text-zinc-300">
            {transcript || "Transcript will appear after transcription."}
          </p>
        </div>
        <div>
          <h3 className="font-medium text-zinc-100">One-sentence summary</h3>
          <p className="mt-1 text-zinc-300">
            {analysis?.oneSentenceInterpretation || "Summary will appear after analysis."}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-medium text-zinc-100">Themes</h3>
            <ul className="mt-1 list-inside list-disc text-zinc-300">{renderList(analysis?.themes || [])}</ul>
          </div>
          <div>
            <h3 className="font-medium text-zinc-100">Emotional keywords</h3>
            <ul className="mt-1 list-inside list-disc text-zinc-300">
              {renderList(analysis?.emotionalKeywords || [])}
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-zinc-100">Metaphors</h3>
            <ul className="mt-1 list-inside list-disc text-zinc-300">
              {renderList(analysis?.metaphors || [])}
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-zinc-100">Conflicts</h3>
            <ul className="mt-1 list-inside list-disc text-zinc-300">{renderList(analysis?.conflicts || [])}</ul>
          </div>
          <div className="md:col-span-2">
            <h3 className="font-medium text-zinc-100">Visual symbols</h3>
            <ul className="mt-1 list-inside list-disc text-zinc-300">
              {renderList(analysis?.visualSymbols || [])}
            </ul>
          </div>
        </div>
      </div>
      <VisibleCuePanel
        cueSignals={cueEstimate.cueSignals}
        estimatorMessage={cueEstimate.message}
        estimatorSource={cueEstimate.source}
        estimatorStatus={cueEstimate.status}
        onAddTone={onAddTone}
        onApplyEstimatedTone={(tones) => {
          if (onApplyEstimatedTone) {
            onApplyEstimatedTone(tones);
            return;
          }
          tones.forEach((tone) => onAddTone(tone));
        }}
        onRemoveTone={onRemoveTone}
        onToneInputChange={onToneInputChange}
        suggestedTone={cueEstimate.suggestedTone}
        toneInputValue={toneInputValue}
        visibleTone={visibleTone}
      />
      <button
        className="mt-4 rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100"
        onClick={onConfirmVisibleTone}
        type="button"
      >
        Confirm visible tone
      </button>
      <button
        className="mt-5 ml-3 rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 disabled:opacity-50"
        disabled={!canContinue}
        onClick={onContinue}
        type="button"
      >
        {continueLabel}
      </button>
    </section>
  );
}
