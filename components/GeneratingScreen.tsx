import React from "react";
import { Sparkles } from "lucide-react";

export function GeneratingScreen() {
  return (
    <section className="journal-card w-full p-5 sm:p-7">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[rgb(140_101_85_/_0.12)] text-[color:var(--color-accent)]">
        <Sparkles aria-hidden="true" size={20} />
      </div>
      <h2 className="font-serif text-3xl font-semibold leading-tight text-[color:var(--color-ink)]">
        Create the canvas
      </h2>
      <p className="mt-3 max-w-2xl text-base leading-7 text-[color:var(--color-muted)]">
        InnerCanvas will shape the reflection and confirmed tone into a symbolic visual companion.
      </p>
      <p className="mt-3 text-sm text-[color:var(--color-muted)]">
        The image is a creative artifact, not a diagnosis or a claim about your inner state.
      </p>
    </section>
  );
}
