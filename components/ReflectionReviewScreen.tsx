"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

import { MixedSignalBrief } from "@/lib/sessionState";

type ReflectionReviewScreenProps = {
  transcript: string;
  brief: MixedSignalBrief | null;
  canContinue: boolean;
  onContinue: () => void;
  continueLabel: string;
};

function renderList(items: string[]): React.ReactNode {
  if (items.length === 0) {
    return <li className="text-[color:var(--color-muted)]">None provided yet.</li>;
  }

  return items.map((item) => <li key={item}>{item}</li>);
}

export function ReflectionReviewScreen({
  transcript,
  brief,
  canContinue,
  onContinue,
  continueLabel,
}: ReflectionReviewScreenProps) {
  return (
    <section className="journal-card w-full p-5 sm:p-7">
      <h2 className="font-serif text-3xl font-semibold leading-tight text-[color:var(--color-ink)]">
        Reflection snapshot
      </h2>
      <p className="mt-3 max-w-2xl text-base leading-7 text-[color:var(--color-muted)]">
        This screen is no longer part of the default flow. The canvas now generates directly after recording.
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          className="journal-button-primary"
          disabled={!canContinue}
          onClick={onContinue}
          type="button"
        >
          {continueLabel}
          <ArrowRight aria-hidden="true" size={16} />
        </button>
      </div>

      <div className="journal-panel mt-7 p-4 sm:p-5">
        <h3 className="text-base font-semibold text-[color:var(--color-ink)]">Reflection notes</h3>
        <div className="mt-4 space-y-5 text-sm leading-6 text-[color:var(--color-muted)]">
          <div>
            <h4 className="font-semibold text-[color:var(--color-ink)]">Transcript</h4>
            <p className="mt-1 whitespace-pre-wrap">
              {transcript || "Transcript will appear after transcription."}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-[color:var(--color-ink)]">Summary</h4>
            <p className="mt-1">{brief?.transcriptSummary || "Summary will appear after analysis."}</p>
          </div>
          <div>
            <h4 className="font-semibold text-[color:var(--color-ink)]">Themes</h4>
            <ul className="mt-1 list-inside list-disc">{renderList(brief?.spokenThemes || [])}</ul>
          </div>
        </div>
      </div>
    </section>
  );
}
