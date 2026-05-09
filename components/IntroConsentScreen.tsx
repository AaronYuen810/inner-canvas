import React from "react";
type IntroConsentScreenProps = {
  stage: "intro" | "consent";
  onContinue: () => void;
  continueLabel: string;
};

const COPY_BY_STAGE = {
  intro: {
    title: "Privacy-first reflection",
    body: "InnerCanvas creates one visual interpretation from your reflection. Session data stays in memory and can be deleted at any time.",
  },
  consent: {
    title: "Consent before capture",
    body: "Camera and microphone are used only for this single session. Visible emotional cue wording stays cautious and editable.",
  },
} as const;

export function IntroConsentScreen({ stage, onContinue, continueLabel }: IntroConsentScreenProps) {
  const copy = COPY_BY_STAGE[stage];

  return (
    <section className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <h2 className="text-2xl font-semibold">{copy.title}</h2>
      <p className="mt-3 max-w-2xl text-zinc-300">{copy.body}</p>
      <button
        className="mt-5 rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950"
        onClick={onContinue}
        type="button"
      >
        {continueLabel}
      </button>
    </section>
  );
}
