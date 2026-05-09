import React, { useState } from "react";

type ResultScreenProps = {
  generatedImage: string;
  oneSentenceInterpretation: string;
  themes: string[];
  confirmedVisibleTone: string[];
  onRegenerate: (modifier?: string) => void;
  isRegenerating: boolean;
  errorMessage: string;
  onReset: () => void;
  generatedPrompt?: string;
  canPreviewPrompt?: boolean;
};

function renderList(items: string[]): React.ReactNode {
  if (items.length === 0) {
    return <li className="text-zinc-400">None provided yet.</li>;
  }

  return items.map((item) => <li key={item}>{item}</li>);
}

export function ResultScreen({
  generatedImage,
  oneSentenceInterpretation,
  themes,
  confirmedVisibleTone,
  onRegenerate,
  isRegenerating,
  errorMessage,
  onReset,
  generatedPrompt = "",
  canPreviewPrompt = false,
}: ResultScreenProps) {
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const imageSource = generatedImage
    ? generatedImage.startsWith("data:")
      ? generatedImage
      : `data:image/png;base64,${generatedImage}`
    : "";

  return (
    <section className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <h2 className="text-2xl font-semibold">Result</h2>
      <p className="mt-3 max-w-2xl text-zinc-300">
        The final image is presented as one possible visual interpretation, not a conclusion about you.
      </p>
      <div className="mt-5 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950">
        {generatedImage ? (
          <img
            alt="Generated symbolic interpretation"
            className="h-auto w-full object-cover"
            src={imageSource}
          />
        ) : (
          <div className="flex min-h-80 items-center justify-center px-5 text-center text-sm text-zinc-400">
            Generated image preview appears here once image generation completes.
          </div>
        )}
      </div>
      <div className="mt-5 grid gap-4 text-sm md:grid-cols-2">
        <div>
          <h3 className="font-medium text-zinc-100">One-sentence interpretation</h3>
          <p className="mt-1 text-zinc-300">{oneSentenceInterpretation}</p>
        </div>
        <div>
          <h3 className="font-medium text-zinc-100">Confirmed visible tone</h3>
          <ul className="mt-1 list-inside list-disc text-zinc-300">{renderList(confirmedVisibleTone)}</ul>
        </div>
        <div className="md:col-span-2">
          <h3 className="font-medium text-zinc-100">Themes</h3>
          <ul className="mt-1 list-inside list-disc text-zinc-300">{renderList(themes)}</ul>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-100"
          disabled={isRegenerating}
          onClick={() => onRegenerate("More hopeful")}
          type="button"
        >
          More hopeful
        </button>
        <button
          className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-100"
          disabled={isRegenerating}
          onClick={() => onRegenerate("More abstract")}
          type="button"
        >
          More abstract
        </button>
        <button
          className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-100"
          disabled={isRegenerating}
          onClick={() => onRegenerate("More intense")}
          type="button"
        >
          More intense
        </button>
        <button
          className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-100"
          disabled={isRegenerating}
          onClick={() => onRegenerate("Less dark")}
          type="button"
        >
          Less dark
        </button>
        <button
          className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-100"
          disabled={isRegenerating}
          onClick={() => onRegenerate()}
          type="button"
        >
          Regenerate
        </button>
      </div>
      {canPreviewPrompt && generatedPrompt ? (
        <div className="mt-5 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
          <button
            className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
            onClick={() => setShowPromptPreview((previous) => !previous)}
            type="button"
          >
            {showPromptPreview ? "Hide prompt preview" : "Show prompt preview (dev/demo)"}
          </button>
          {showPromptPreview ? (
            <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded-md border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300">
              {generatedPrompt}
            </pre>
          ) : null}
        </div>
      ) : null}
      {errorMessage ? <p className="mt-4 text-sm text-rose-300">{errorMessage}</p> : null}
      <button
        className="mt-5 rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100"
        disabled={isRegenerating}
        onClick={onReset}
        type="button"
      >
        Reset / Delete session
      </button>
    </section>
  );
}
