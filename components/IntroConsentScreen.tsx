import React from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";

type IntroConsentScreenProps = {
  stage: "intro" | "consent";
  onContinue: () => void;
  continueLabel: string;
};

const COPY_BY_STAGE = {
  intro: {
    title: "Turn a short reflection into a quiet visual companion.",
    body: "Speak for a brief moment, then create one symbolic canvas to sit beside it.",
    notes: ["No account or history", "Session-only data", "One session at a time"],
  },
  consent: {
    title: "A private capture for this session",
    body: "Camera and microphone access prepare a single reflection. If camera is available, up to five sampled still frames may help shape the first canvas. If camera is unavailable, audio/text-only still works.",
    notes: ["No saved history", "Sampled frames are discarded after brief creation", "Starting over deletes the current reflection"],
  },
} as const;

export function IntroConsentScreen({
  stage,
  onContinue,
  continueLabel,
}: IntroConsentScreenProps) {
  const copy = COPY_BY_STAGE[stage];

  return (
    <section className="journal-card w-full p-5 sm:p-7">
      <div className="flex max-w-3xl flex-col gap-5">
        <div>
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[rgb(111_127_135_/_0.14)] text-[color:var(--color-blue-gray)]">
            <ShieldCheck aria-hidden="true" size={20} />
          </div>
          <h2 className="font-serif text-3xl font-semibold leading-tight text-[color:var(--color-ink)] sm:text-4xl">
            {copy.title}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--color-muted)]">{copy.body}</p>
        </div>

        <ul className="grid gap-2 text-sm text-[color:var(--color-muted)] sm:grid-cols-3">
          {copy.notes.map((note) => (
            <li className="journal-panel px-3 py-2" key={note}>
              {note}
            </li>
          ))}
        </ul>
      </div>

      <button
        className="journal-button-primary mt-6"
        onClick={onContinue}
        type="button"
      >
        {continueLabel}
        <ArrowRight aria-hidden="true" size={16} />
      </button>
    </section>
  );
}
