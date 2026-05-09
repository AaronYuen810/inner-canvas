import React from "react";
export function GeneratingScreen() {
  return (
    <section className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <h2 className="text-2xl font-semibold">Generating visual interpretation</h2>
      <p className="mt-3 max-w-2xl text-zinc-300">
        Building a symbolic scene from your reflection and confirmed visible tone estimate.
      </p>
      <p className="mt-3 text-sm text-zinc-400">This does not infer a diagnosis or a true internal state.</p>
    </section>
  );
}
